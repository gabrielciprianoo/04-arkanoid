# Spec 01: MVP Jugable de Arkanoid

**Estado:** Aprobado
**Dependencias:** Ninguna (usa assets existentes: `assets/spritesheet.js`, `assets/spritesheet-breakout.png`, `assets/sounds/`)
**Fecha:** 2026-07-07

**Objetivo:** Implementar un MVP jugable de Arkanoid en vanilla JS + Canvas, con paddle controlado por teclado, layout fijo de bloques de colores, sistema de vidas, física de rebote variable por punto de impacto, puntaje por color persistido en localStorage, y pantallas de inicio/victoria/derrota.

## Scope

### Dentro del MVP

- Canvas 480x640, `index.html` + `game.js` en raíz.
- Loop de juego (requestAnimationFrame).
- Paddle: movimiento con flechas izq/der y A/D.
- Ball: física de movimiento, colisión con paredes, paddle (ángulo de rebote varía según punto de impacto) y bloques.
- Grid fijo de bloques: 8 columnas x 5 filas, colores mezclados (gray/red/yellow/cyan/magenta/hotpink/green).
- Destrucción de bloque: animación de explosión (`EXPLOSION_FRAMES`/`drawFrame`) + sonido `break-sound.mp3`.
- Sonido `ball-bounce.mp3` en rebote (pared, paddle, bloque).
- Puntaje por color de bloque: gray=1, red=2, yellow=3, cyan=4, magenta=5, hotpink=6, green=7. Se muestra en pantalla durante el juego.
- Sistema de vidas: 5 vidas. Se pierde una vida cuando la bola cae debajo del paddle.
- Pantalla de inicio con botón "Start".
- Pantalla de Game Over al perder la última vida (reload de página para reintentar).
- Pantalla de Victoria al romper todos los bloques.
- High score persistido en `localStorage`, mostrado en pantalla de inicio.
- Velocidad de bola/paddle fija durante todo el MVP (sin aceleración progresiva).

### Fuera del MVP (specs futuros)

- Power-ups.
- Múltiples niveles / layouts de bloques distintos.
- Aceleración de velocidad con el tiempo o bloques rotos.
- Controles de mouse/touch.
- Pausa del juego.
- Mute/control de volumen.
- Layout responsive/mobile.
- Multijugador.
- Tabla de puntajes (leaderboard) — solo un high score único.
- Bloques indestructibles.

## Modelo de datos

### Constantes

```js
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

const BLOCK_COLORS = ['gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];

const BLOCK_POINTS = {
  gray: 1, red: 2, yellow: 3, cyan: 4,
  magenta: 5, hotpink: 6, green: 7,
};

const GRID_COLS = 8;
const GRID_ROWS = 5;

const LIVES_START = 5;

const HIGHSCORE_KEY = 'arkanoid-highscore';
```

### Entidades

```js
// Paddle
{ x, y, width, height, speed }

// Ball
{ x, y, dx, dy, radius, speed }

// Block
{
  x, y, width, height,
  color,            // uno de BLOCK_COLORS
  points,            // BLOCK_POINTS[color]
  destroyed,         // bool
  exploding,         // bool, true mientras corre animación
  explosionStartTime // timestamp para calcular frame actual vía EXPLOSION_DURATION
}
```

### Estado global del juego

```js
{
  state,        // 'start' | 'playing' | 'gameover' | 'victory'
  score,        // number, acumulado en la partida actual
  lives,        // number, arranca en LIVES_START
  blocks,       // Block[], grid de GRID_COLS x GRID_ROWS
  paddle,       // Paddle
  ball,         // Ball
  highScore,    // number, leído de localStorage al iniciar
}
```

### Persistencia

- `localStorage['arkanoid-highscore']` — string numérico, el mayor `score` alcanzado. Se actualiza al terminar la partida (game over o victoria) si `score > highScore`.

## Plan de implementación

1. **Scaffold inicial.** Crear `index.html` (canvas 480x640, carga `assets/spritesheet.js` y `game.js`) y `game.js` con loop base. Dibujar pantalla de Start (texto/botón "Start") leyendo `highScore` de `localStorage`. Click en Start cambia `state` a `'playing'` (sin contenido de juego aún).

2. **Paddle.** Crear entidad paddle, dibujar con `drawSprite(ctx, 'paddle', ...)`, movimiento con flechas izq/der y A/D dentro del loop en estado `'playing'`.

3. **Ball — movimiento y paredes.** Crear entidad ball, dibujar con `drawSprite`, movimiento continuo, rebote en pared izquierda/derecha/arriba con sonido `ball-bounce.mp3`. Si la bola cae por debajo del canvas: resta una vida, resetea bola sobre el paddle. Si `lives` llega a 0: `state = 'gameover'`.

4. **Colisión paddle-ball.** Rebote en paddle con ángulo variable según punto de impacto (impacto en el borde = ángulo más agudo, centro = rebote más vertical). Sonido `ball-bounce.mp3`.

5. **Grid de bloques.** Generar grid fijo 8x5 con colores mezclados de `BLOCK_COLORS`, dibujar con `drawSprite(ctx, 'block_<color>', ...)`.

6. **Colisión ball-bloque.** Detectar colisión bola-bloque, marcar bloque como `destroyed`, sumar `BLOCK_POINTS[color]` a `score`, reproducir `break-sound.mp3`, correr animación de explosión con `drawFrame`/`EXPLOSION_FRAMES`/`EXPLOSION_DURATION` antes de remover el bloque del render.

7. **Condición de victoria.** Cuando todos los bloques están `destroyed`: `state = 'victory'`.

8. **HUD.** Mostrar `score` y `lives` en pantalla durante `'playing'`.

9. **Persistencia de high score.** Al llegar a `'gameover'` o `'victory'`, comparar `score` vs `highScore` en `localStorage`, actualizar si corresponde.

10. **Pantallas finales y pulido.** Pantallas de Game Over y Victoria muestran score final, high score, y mensaje "recarga la página para reintentar". Verificar integración completa de sonidos y transiciones entre los 4 estados.

## Criterios de aceptación

- [ ] `index.html` carga canvas 480x640 y `assets/spritesheet.js` sin errores en consola.
- [ ] Pantalla de inicio muestra botón "Start" y high score guardado (0 si no hay ninguno).
- [ ] Click en "Start" inicia la partida (`state = 'playing'`).
- [ ] Paddle se mueve con flechas izq/der y con A/D, sin salir del canvas.
- [ ] Bola rebota en paredes izquierda, derecha y superior, con sonido `ball-bounce.mp3`.
- [ ] Bola rebota en el paddle con ángulo distinto según el punto de impacto (borde vs centro).
- [ ] Bola que cae debajo del paddle resta una vida y se reposiciona sobre el paddle.
- [ ] Al llegar a 0 vidas, pantalla muestra Game Over con score final.
- [ ] Grid de 8x5 bloques se renderiza con colores mezclados de `BLOCK_COLORS`.
- [ ] Al golpear un bloque: se reproduce `break-sound.mp3`, corre animación de explosión de 4 frames, el bloque desaparece del canvas y ya no colisiona.
- [ ] Puntaje en pantalla aumenta según `BLOCK_POINTS[color]` al romper cada bloque.
- [ ] Al romper todos los bloques, pantalla muestra Victoria con score final.
- [ ] Al terminar la partida (Game Over o Victoria), si `score > highScore`, `localStorage['arkanoid-highscore']` se actualiza.
- [ ] High score persiste tras recargar la página (F5) y se muestra en la pantalla de inicio.
- [ ] Recargar la página desde Game Over o Victoria permite iniciar una nueva partida desde cero.

## Decisiones tomadas y descartadas

- **Vanilla JS + Canvas, sin framework.** Consistente con `assets/spritesheet.js` ya existente, mantiene el MVP simple.
- **Layout de bloques fijo, sin múltiples niveles.** Reduce scope; niveles quedan para spec futuro.
- **Velocidad fija, sin aceleración progresiva.** Reduce scope y complejidad de balance para el MVP.
- **Controles solo teclado (flechas + A/D).** Sin mouse/touch — no es requisito del MVP.
- **Puntaje distinto por color de bloque (no uniforme).** Aprovecha la variedad de sprites ya disponible, da feedback más rico.
- **Ángulo de rebote variable en paddle (no reflejo especular simple).** Se siente más "Arkanoid clásico", costo de implementación bajo.
- **Reinicio vía reload de página, no botón in-game.** Evita manejo de estado extra para reset; suficiente para MVP.
- **Un solo high score en localStorage, sin leaderboard.** Reduce scope de persistencia.
- **Power-ups descartados del MVP.** No hay sprites de power-ups en el spritesheet; se deja para spec futuro.
- **Canvas fijo 480x640, sin diseño responsive.** Proporción vertical clásica de Arkanoid, sin necesidad de adaptar a mobile en el MVP.

## Riesgos identificados

- **Doble colisión bola-bloque en mismo frame.** Grid denso (8x5) puede detectar colisión con más de un bloque en el mismo frame y generar rebote errático. Mitigación: procesar una sola colisión de bloque por frame.
- **Ángulo de rebote extremo en paddle.** Impacto muy cerca del borde puede generar trayectoria casi horizontal (bola "atascada" lateralmente). Mitigación: clamp de ángulo mínimo/máximo en el cálculo de rebote.
- **Carga asíncrona de assets.** `loadSpritesheet` es asíncrono — iniciar el loop antes de que cargue puede dibujar sprites vacíos. Mitigación: arrancar el loop solo dentro del callback de `loadSpritesheet`.
