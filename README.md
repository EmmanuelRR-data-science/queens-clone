# Queens Clone
Una experiencia premium inspirada en el juego “Queens” (LinkedIn) con estética tipo “Queens Master”: retos infinitos por seed, UX sin spoilers, sistema de vidas y backend en Python con persistencia para compartir retos por ID.

## Por qué te va a gustar
- Retos infinitos y reproducibles: comparte `size` + `seed` y juega el mismo tablero exacto.
- Dificultad real por geometría: regiones contiguas con formas “locas” (sin regiones fragmentadas).
- UX pensada para jugar fluido: ciclo de clic (vacío → X → reina → quitar), auto-marcado inteligente, feedback sin spoilers.
- Listo para compartir: guarda un reto y compártelo por `id` (persistido en PostgreSQL).
- Métricas por reto: registra intentos (win/lose), duración y errores.

## Demo local (Docker)
Requisitos: Docker + Docker Compose.

1. Levanta todo:

```bash
docker compose up -d --build
```

2. Abre:
- Frontend: http://127.0.0.1:3000
- Backend: http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)

3. Apaga:

```bash
docker compose down
```

## Cómo jugar (rápido)
- Un clic: marca X
- Segundo clic: coloca reina
- Tercer clic: quita reina
- Al colocar una reina se auto-marcan X en fila, columna, región y adyacentes
- Si colocas una reina incorrecta, se muestra error sin revelar la posición correcta y pierdes 1 vida

## Compartir y persistir retos
- Compartir por seed: el UI muestra `size=<n>&seed=<seed>` y lo puedes copiar.
- Guardar reto: crea un `id` persistido en el backend (`POST /puzzles`).
- Cargar por ID: ingresa el `id` y el reto se restaura (`GET /puzzles/{id}`).

## Arquitectura (alto nivel)
- Frontend: Next.js (React + TypeScript), Tailwind CSS, Framer Motion.
- Backend: FastAPI + SQLAlchemy, generador determinístico por `seed`.
- DB: PostgreSQL (contenedor en Docker Compose).

## Seguridad (básicos aplicados en Docker local)
- Puertos expuestos solo a `127.0.0.1` (no se publican al exterior).
- Postgres sin puerto publicado (solo red interna de Docker).
- CORS restringido a `http://localhost:3000` y `http://127.0.0.1:3000`.
- Trusted hosts en backend y headers de seguridad (nosniff, frame deny, etc.).
- Contenedores sin root para backend y frontend.

Nota: para despliegue público conviene agregar reverse proxy (TLS, rate limiting) y secrets reales (no defaults).

## Variables de entorno útiles
Docker Compose:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `CORS_ORIGINS` (backend)
- `TRUSTED_HOSTS` (backend)

Frontend:
- `NEXT_PUBLIC_API_BASE_URL` (por defecto `http://127.0.0.1:8000`)

## Roadmap sugerido
- Upgrade mayor de Next.js si vas a exponerlo públicamente.
- Reverse proxy con TLS y rate limiting.
- Observabilidad: logs estructurados y métricas por sesión/usuario.
