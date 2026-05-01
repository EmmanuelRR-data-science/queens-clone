# RFC: Implementación del Motor de Generación y Estética Visual

**Author(s):** Emmanuel Ramírez Romero  
**Status:** En Revisión (Fase de Diseño)  
**Actualización:** 2026-04-30  

---

## 1. Objetivo
Definir la arquitectura del motor de generación procedural de tableros y establecer los lineamientos estéticos para replicar la experiencia de "Queens Master".

## 2. Goals
- Generar tableros de N x N (5 a 20) con regiones contiguas y solución única.
- Definir un stack de frontend capaz de manejar animaciones fluidas y efectos visuales premium.
- Implementar persistencia de retos mediante semillas.
- Implementar UX de apoyo sin spoilers: auto-marcado de casillas inválidas y feedback de error sin revelar la solución.
- Implementar sistema de vidas: 3 vidas por partida; cada error consume 1 vida; al llegar a 0 el jugador pierde.
- Persistir retos en PostgreSQL para compartir por ID (además de seed).

## 3. Non-Goals
- No se implementará modo multijugador en esta fase inicial.
- No se soportarán regiones no contiguas (fragmentadas).

## 4. Background
El juego "Queens" requiere un equilibrio entre la dificultad de las regiones y la lógica de posicionamiento. LinkedIn usa un estilo minimalista; nosotros buscamos una experiencia de juego móvil premium.

## 5. Overview
El sistema se dividirá en un backend de alta performance (Python) encargado de la matemática del tablero y un frontend vibrante encargado de la experiencia del usuario.

## 6. Detailed Design / Solución
### Algoritmo de Generación:
1. **Fase de Inundación (Flood Fill)**: Generar regiones aleatorias pero contiguas.
2. **Fase de Validación**: Colocar una reina en una posición válida y verificar mediante backtracking si el resto del tablero es resoluble.
3. **Fase de Refinado**: Ajustar bordes para aumentar la complejidad visual.

### Propuesta Arquitectura:
- **Backend**: FastAPI + UV + Ruff.
- **Frontend**: Next.js (React) + Framer Motion.
- **DB**: PostgreSQL.

### Seed / Retos Reproducibles:
- El backend expone `GET /generate?size=N&seed=SEED?`.
- Si `seed` no se proporciona, el backend genera uno y lo devuelve en la respuesta.
- Para un `size` y `seed` dados, el generador debe ser determinístico (mismo `regions` y `solution`).
- El frontend puede usar el `seed` para compartir y re-jugar un reto exacto.

### Persistencia (PostgreSQL):
- Tabla `puzzles`: `id`, `size`, `seed`, `regions`, `solution`, `created_at`.
- Endpoints:
  - `POST /puzzles` crea y persiste un reto (acepta `size` y `seed?`).
  - `GET /puzzles/{id}` recupera un reto persistido.
- UX: el cliente puede mostrar `seed` y ofrecer un botón para guardar el reto y obtener `id`.

### UX / Interacción:
- Ciclo de interacción por celda: vacío → X → reina → (clic) quitar reina.
- Al colocar una reina, se auto-marcan con X: fila, columna, región/color y adyacentes.
- Si el usuario coloca una reina incorrecta: mostrar mensaje de error y animación sutil (sin indicar la posición correcta), descontar exactamente 1 vida.
- La validación de “incorrecto” se basa en la solución generada para el tablero (sin revelar la solución al usuario).

## 7. Métricas
### Métricas Técnicas:
- Tiempo de generación del tablero < 1000ms.
- Cobertura de tests en la lógica del motor > 90%.
- FPS en el frontend > 60fps.

### Métricas de Producto:
- Tiempo promedio para resolver un tablero 8x8.
- Tasa de reintentos por nivel de dificultad.

---
**Links:**
- [Design Document](file:///c:/Users/EmmanuelRam%C3%ADrez/OneDrive%20-%20PhiQus/Documentos/test-trae/docs/design.md)
- [Product Vision](file:///c:/Users/EmmanuelRam%C3%ADrez/OneDrive%20-%20PhiQus/Documentos/test-trae/docs/specs/product_vision.md)
