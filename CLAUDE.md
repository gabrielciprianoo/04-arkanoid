# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Early-stage scaffold for a browser-based Arkanoid/Breakout game. No game source code exists yet — only assets and a spec-driven workflow are in place. There is no build system, package.json, linter, or test suite to run yet; these will appear once specs are implemented.

## Spec-driven workflow

This repo uses two custom skills (installed via `skills-lock.json` from `Klerith/fernando-skills`, defined under `.agents/skills/`) that gate all feature work:

- **`/spec <feature>`** — Interactive spec designer. Asks clarifying questions in phases, then writes an approved-or-draft spec to `specs/NN-slug.md` section by section. Never writes code.
- **`/spec-impl <NN-slug>`** — Implements a spec, but **only if its state is `Approved`** (or equivalent in another language). It creates/switches to a git branch named `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`, default `true`), then implements the plan step by step, pausing after each step for review.

Practical implications when working in this repo:

- Do not write feature code directly — check whether a spec exists in `specs/` first. If none exists for the work requested, prefer running `/spec` before implementing.
- Never implement a spec whose status is not "Approved" (Draft/Borrador, In review, Implemented, Obsolete, etc. all block implementation) — this is enforced by `/spec-impl`, not optional.
- Specs live in `specs/NN-slug.md`; the numbering is sequential and the slug is derived from the spec's objective.
- Spec state and `AutoCreateBranch` config must be respected exactly as described in `.agents/skills/spec-impl/SKILL.md` — do not improvise around them.

## Assets

- `assets/spritesheet-breakout.png` — single sprite sheet image containing paddle, ball, colored blocks (gray/red/yellow/cyan/magenta/hotpink/green), and per-color explosion animation frames.
- `assets/spritesheet.js` — sprite-sheet loader/drawing API, currently the only executable code in the repo:
  - `loadSpritesheet(cb)` — lazily loads the PNG onto an offscreen canvas (`ssImg`) and invokes `cb` once ready (queues callbacks if called multiple times before load completes).
  - `drawSprite(ctx, name, x, y, w, h)` — draws a static sprite by name (`'paddle'`, `'ball'`, or `'block_<color>'`, e.g. `'block_red'`) looked up from the `SPRITES` table.
  - `drawFrame(ctx, frame, x, y, w, h)` — draws a single explosion animation frame (an `{sx, sy, sw, sh}` rect), used with entries from `EXPLOSION_FRAMES[color]` (4 frames per color) and `EXPLOSION_DURATION` (150ms per frame) to animate block destruction.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.

Any future game code (canvas setup, game loop, paddle/ball/block entities, collision, scoring) is expected to consume `SPRITES`/`EXPLOSION_FRAMES` via the functions above rather than re-reading sprite coordinates.
