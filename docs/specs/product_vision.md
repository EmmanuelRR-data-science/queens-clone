# Requerimientos de Producto: Queens Clone (Estilo Queens Master)

## 1. Visión del Producto
Recrear la mecánica del juego "Queens" de LinkedIn con un enfoque premium, tableros generados proceduralmente y una estética visualmente atractiva inspirada en "Queens Master" (Kwalee). El juego permitirá retos únicos e infinitos con dificultades progresivas.

## 2. Requerimientos Funcionales
- **Generación de Tableros**: Un motor en Python que genere tableros de N x N con N regiones contiguas de colores únicos.
- **Reglas del Juego**:
    - Una reina por fila.
    - Una reina por columna.
    - Una reina por región de color.
    - Dos reinas no pueden tocarse (ni siquiera en diagonal).
- **Dificultad Progresiva**: Tableros desde 5x5 hasta 20x20 con formas geométricas complejas.
- **Persistencia**: Guardar semillas de tableros en PostgreSQL para permitir la recreación de los mismos retos.
- **Retos Compartibles**: Cada reto debe poder reproducirse con `size` + `seed` (y en el futuro, un ID en PostgreSQL).
- **Retos Persistidos**: Los retos pueden guardarse en PostgreSQL y compartirse por `id`.
- **Interfaz de Usuario**:
    - Tablero interactivo con respuesta táctil/visual.
    - Efectos visuales al colocar/quitar reinas.
    - Validación en tiempo real de errores (reinas en conflicto) sin revelar la solución.
    - Interacción por celda: vacío → X → reina → (clic) quitar reina.
    - Auto-marcado con X al colocar una reina: fila, columna, región/color y adyacentes.
    - Sistema de vidas: 3 vidas por partida; cada reina incorrecta descuenta exactamente 1 vida; al llegar a 0, derrota.

## 3. Requerimientos No Funcionales
- **Performance**: Generación de tableros en menos de 1 segundo.
- **Estética**: Gráficos premium, sombras, animaciones suaves y paleta de colores vibrantes.
- **Despliegue**: Contenerizado con Docker para VPS.

## 4. Criterios de Aceptación
- El usuario puede completar un tablero y el sistema reconoce la victoria.
- El sistema detecta y marca visualmente si una reina rompe alguna regla.
- Se genera un nuevo tablero único cada vez que se solicita una nueva partida.
- El usuario empieza con 3 vidas; cada reina en conflicto descuenta 1; con 0 vidas se muestra derrota y se bloquea la interacción hasta reiniciar.
- El error debe señalar que la reina es incorrecta sin indicar la posición correcta.
