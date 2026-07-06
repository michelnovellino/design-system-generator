# Design System Generator

Generates complete design systems — color, contrast, typography, and spacing — **100% in the browser**. No backend, no latency. Input a brand color and get a perceptual OKLCH scale, WCAG 2 / Bridge PCA / APCA validated contrast, fluid typography, and **DTCG** tokens ready to export as a `.zip`.

## Features

- **OKLCH Color** — Perceptually uniform 50→950 tonal scale, circular geometry harmonies, and sRGB gamut clipping.
- **Contrast (3 Modes)** — Classic WCAG 2 · **Bridge PCA** (default) · Full APCA. Includes iterative lightness auto-fix.
- **Color Blindness Simulation** — Protanopia, deuteranopia, tritanopia, and achromatopsia via GPU-accelerated SVG filters.
- **Fluid Typography** — Modular scale + `clamp()` in `rem`, respecting accessibility zoom.
- **DTCG Export** — CSS variables, Tailwind config, and `tokens.json`, bundled in a `.zip` via a Web Worker.

## Tech Stack

Vue 3 · Vite · TypeScript · Pinia. 
Color processing with `culori`. Contrast with the official `apca-w3` and `bridge-pca` packages. Bundling with `jszip`.

The `src/engines/` layer is pure TypeScript, with no Vue dependencies, ensuring isolated testing and framework independence.

## Development

```bash
npm install
npm run dev        # Development server
npm run build      # Type-check + production build to dist/
npm run preview    # Preview the build
npm run test       # Run tests (Vitest)
```
*Requires Node.js 20+.*

## Architecture

Key decisions are documented in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## License

[Apache License 2.0](LICENSE). See also [`NOTICE`](NOTICE).
