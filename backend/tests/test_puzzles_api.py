import pytest
from httpx import ASGITransport, AsyncClient

from app.db import ENGINE, SessionLocal
from app.main import app
from app.models.puzzle import Base, Puzzle


def _clear_db() -> None:
    with SessionLocal() as db:
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
