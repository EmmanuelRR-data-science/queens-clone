import pytest
from httpx import ASGITransport, AsyncClient

from app.db import ENGINE, SessionLocal
from app.main import app
from app.models.puzzle import Base, Puzzle, PuzzleAttempt


def _clear_db() -> None:
    with SessionLocal() as db:
        db.query(PuzzleAttempt).delete()
        db.query(Puzzle).delete()
        db.commit()


@pytest.mark.anyio
async def test_create_and_get_puzzle() -> None:
    Base.metadata.create_all(bind=ENGINE)
    _clear_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create = await client.post("/puzzles", json={"size": 8, "seed": 42})
        assert create.status_code == 200
        created = create.json()

        assert created["size"] == 8
        assert created["seed"] == 42
        assert "id" in created
        assert len(created["regions"]) == 8
        assert len(created["solution"]) == 8

        get_resp = await client.get(f"/puzzles/{created['id']}")
        assert get_resp.status_code == 200
        loaded = get_resp.json()

        assert loaded["id"] == created["id"]
        assert loaded["seed"] == 42
        assert loaded["regions"] == created["regions"]
        assert loaded["solution"] == created["solution"]


@pytest.mark.anyio
async def test_attempts_and_stats() -> None:
    Base.metadata.create_all(bind=ENGINE)
    _clear_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create = await client.post("/puzzles", json={"size": 8, "seed": 7})
        assert create.status_code == 200
        puzzle = create.json()
        puzzle_id = puzzle["id"]

        attempt_1 = await client.post(
            f"/puzzles/{puzzle_id}/attempts",
            json={"outcome": "win", "mistakes": 1, "duration_ms": 12000},
        )
        assert attempt_1.status_code == 200

        attempt_2 = await client.post(
            f"/puzzles/{puzzle_id}/attempts",
            json={"outcome": "lose", "mistakes": 3, "duration_ms": 8000},
        )
        assert attempt_2.status_code == 200

        stats = await client.get(f"/puzzles/{puzzle_id}/stats")
        assert stats.status_code == 200
        payload = stats.json()

        assert payload["puzzle_id"] == puzzle_id
        assert payload["plays"] == 2
        assert payload["wins"] == 1
        assert payload["losses"] == 1
        assert payload["avg_duration_ms"] == 10000.0
        assert payload["avg_mistakes"] == 2.0
