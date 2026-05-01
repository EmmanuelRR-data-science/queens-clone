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
├── frontend/               # Interfaz de usuario (React/Next.js/PixiJS - TBD)
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
- **Frontend**: Investigación en curso (React + Framer Motion o PixiJS).
- **Comunicación**: REST API / WebSockets para actualizaciones en tiempo real si fuera necesario.

## 3. Motor de Generación (Python)
Se utilizará un algoritmo de **Constraint Satisfaction Problem (CSP)** con backtracking optimizado para asegurar que:
1. Se generen regiones contiguas válidas.
2. Exista al menos una solución única para el tablero.
3. El tablero cumpla con las restricciones de Queens.

## 4. Estándares de Calidad
- Linting y formateo con **Ruff**.
- Commits siguiendo **Conventional Commits**.
- Documentación sincronizada con el estado del código.
