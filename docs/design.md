# Design Document: Queens Clone

## 1. Estructura del Proyecto
```text
/
├── backend/                # Motor de lógica en Python
│   ├── app/
│   │   ├── generator/      # Algoritmos de generación de tableros
│   │   ├── api/            # FastAPI para servir tableros
│   │   └── models/         # Modelos de datos (PostgreSQL)
│   ├── pyproject.toml      # Configuración UV
│   └── ruff.toml           # Configuración Ruff
├── frontend/               # Interfaz de usuario (Next.js + Framer Motion)
├── docker/                 # Configuración de contenedores
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── docs/                   # Documentación Viva
│   ├── specs/
│   ├── design.md           # Este archivo
│   └── rfc.md
└── README.md
```

## 2. Arquitectura Técnica
- **Backend**: Python 3.12+, FastAPI, UV para gestión de paquetes.
- **Base de Datos**: PostgreSQL para almacenar semillas y estadísticas.
- **Frontend**: Next.js (React) + Framer Motion.
- **Comunicación**: REST API / WebSockets para actualizaciones en tiempo real si fuera necesario.

### Modelo de Datos (PostgreSQL)
- `puzzles`:
  - `id` (int)
  - `size` (int)
  - `seed` (int)
  - `regions` (json)
  - `solution` (json)
  - `created_at` (timestamp)
- `puzzle_attempts`:
  - `id` (int)
  - `puzzle_id` (int, FK → puzzles.id)
  - `outcome` (text: `win` | `lose`)
  - `mistakes` (int)
  - `duration_ms` (int)
  - `started_at` (timestamp, nullable)
  - `ended_at` (timestamp, nullable)
  - `created_at` (timestamp)

### Endpoints (Backend)
- `GET /generate?size=N&seed=SEED?` genera un reto (no necesariamente persistido) y devuelve `seed`.
- `POST /puzzles` crea y persiste un reto.
- `GET /puzzles/{id}` obtiene un reto persistido.
- `POST /puzzles/{id}/attempts` registra un intento (métricas) para un reto persistido.
- `GET /puzzles/{id}/stats` obtiene estadísticas agregadas del reto persistido.

### Integración Frontend
- El cliente muestra el reto como `size` + `seed` para compartir.
- El cliente puede persistir el reto llamando `POST /puzzles` y mostrar el `id` resultante.
- El cliente puede cargar un reto persistido introduciendo `id` y llamando `GET /puzzles/{id}`.
- Si el reto tiene `id`, el cliente registra un intento al finalizar (victoria/derrota), incluyendo duración y errores.

## 3. Motor de Generación (Python)
Se utilizará un algoritmo de **Constraint Satisfaction Problem (CSP)** con backtracking optimizado para asegurar que:
1. Se generen regiones contiguas válidas.
2. Exista al menos una solución única para el tablero.
3. El tablero cumpla con las restricciones de Queens.

### Determinismo por Seed
- El generador acepta un `seed` opcional para producir retos reproducibles.
- Para un `size` y `seed` dados, el resultado debe ser determinístico.

## 4. Estándares de Calidad
- Linting y formateo con **Ruff**.
- Commits siguiendo **Conventional Commits**.
- Documentación sincronizada con el estado del código.

## 5. UX del Juego
- Interacción por celda: vacío → X → reina → (clic) quitar reina.
- Al colocar una reina, el cliente auto-marca con X: fila, columna, región/color y adyacentes.
- Feedback de error sin spoilers: mensaje y animación sutil al colocar una reina incorrecta (sin revelar la casilla correcta).
- Sistema de vidas: 3 vidas por partida; cada reina incorrecta descuenta exactamente 1 vida; al llegar a 0, derrota y bloqueo de interacción hasta reinicio.
