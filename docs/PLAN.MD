# Plan de Proyecto: Generador de Sistemas de Diseño Front-End

## 1. Resumen y filosofía

Aplicación web 100% cliente que genera sistemas de diseño completos (color, tipografía, espaciado) y los exporta listos para usar ("plug and play"). Sin backend, sin APIs de IA en runtime, sin dependencias de servidor. Todo el cálculo ocurre en el navegador con matemáticas deterministas: mismo input → mismo output, siempre.

La IA (Claude Code) se usa solo en la fase de desarrollo, para construir el motor. Nunca decide diseño en runtime.

## 2. Stack técnico

| Área | Elección | Razón |
|------|----------|-------|
| Framework | Vue 3 (Composition API) | Preferencia; sirve estáticos igual que React |
| Build | Vite | Estándar de Vue, build estático rápido |
| Estado | Pinia | Store central para los design tokens |
| Hosting | Cloudflare Pages | Gratis, HTTPS, dominio custom, build automático |
| Color | culori | Conversión OKLCH ↔ sRGB, gamut clipping |
| Contraste | apca-w3 + bridge-pca (paquetes oficiales) | Licencia exige código oficial sin modificar |
| Empaquetado | jszip | Genera el .zip de exportación en el cliente |
| Lenguaje | TypeScript | Tipos previenen bugs de color/contraste; engines/ reutilizables |
| Tokens | Formato DTCG (W3C) | Estándar de la industria |
| Compilación tokens | Transforms propias en TS (NO Style Dictionary) | Menos deps frágiles; ver ADR-004 |

Nota sobre Style Dictionary: **decisión cerrada** (ver `docs/DECISIONS.md` ADR-004). Usamos transforms propias para CSS vars, Tailwind config y tokens.json. Style Dictionary queda como good-to-have futuro documentado, solo si el alcance crece a muchos targets (iOS/Android/etc.).

## 3. Restricciones de licencia (APCA / Bridge PCA) — CRÍTICO

Estas condiciones se respetan al pie de la letra:

- **Usar los paquetes oficiales** `apca-w3` y `bridge-pca` sin modificar el algoritmo ni las constantes. No reimplementar desde cero.
- **Mantener las versiones actualizadas** (la licencia se revoca con versiones obsoletas). No fijar versiones viejas indefinidamente.
- **No usar los logos** "APCA" / "Powered by APCA" ni sugerir aval oficial de Myndex.
- **Enlace vivo a "Why APCA"** cerca del output de Lc (git.apcacontrast.com/documentation/WhyAPCA).
- **Solo contenido web** (nuestro caso). Uso no comercial sin regalías (nuestro caso).
- El primer color es siempre el TEXTO, el segundo el FONDO. Ambos algoritmos son sensibles a polaridad.

## 4. Los tres modos de contraste

| Modo | Qué muestra | Para quién |
|------|-------------|------------|
| WCAG 2 clásico | Ratio literal del algoritmo original (X:1) | Auditoría, número exacto legal |
| Bridge PCA (default) | Lc + ratio "WCAG compatible" perceptual | Cumplimiento legal + buena legibilidad |
| APCA completo | Valor Lc puro con lookup de fuente | Máxima flexibilidad de diseño |

**Advertencia de UI obligatoria:** el "ratio WCAG" de Bridge PCA NO es el cálculo literal de WCAG 2, es un equivalente perceptual. Tooltip aclaratorio para no confundir.

## 5. Arquitectura de datos (DTCG)

Taxonomía de tres niveles:

1. **Primitivos (core):** valores brutos generados por las matemáticas. Ej: `color.blue.500`, `spacing.4`
2. **Semánticos (alias):** referencias con significado. Ej: `color.background.primary`
3. **Componente:** nombres específicos de UI. Ej: `button.primary.background`

Metadatos DTCG con prefijo `$`. Una única fuente de verdad: `tokens.json`. Validación cruzada para evitar referencias circulares y alertar si un alias apunta a un primitivo eliminado.

## 6. Motores algorítmicos (el corazón)

### 6.1 Motor de color (OKLCH)
- Input: un color base (HEX de marca).
- Genera escala tonal 50→950 aislando canales OKLCH.
- Canal L: curva descendente (50 ≈ 0.97, 950 ≈ 0.15-0.20). Base se inserta cerca del 500.
- Canal C: curva de campana (croma máximo al centro, reducido en extremos).
- Gamut clipping: reduce croma manteniendo L y H hasta volver a sRGB.
- Armonías por geometría circular sobre el matiz H (% 360): complementario (+180°), análogos (±30°), triádico (±120°), tetrádico (±90°).

### 6.2 Motor de contraste (3 modos)
- WCAG 2: luminancia relativa + cociente clásico.
- APCA: paquete `apca-w3`.
- Bridge PCA: paquete `bridge-pca` (`BPCAcontrast` + `bridgeRatio`).
- **Auto-fix:** loop iterativo sobre canal L en OKLCH (pasos ~0.005), re-evalúa contraste, bloquea al cumplir. Mantiene H y C originales lo más posible. Fallback si ajustar solo L no alcanza el umbral.

### 6.3 Simulación de daltonismo
- Modelos Machado-Oliveira-Fernandes o Brettel-Viénot (matrices).
- Cuatro tipos: protanopía, deuteranopía, tritanopía, acromatopsia.
- Ejecución vía filtros SVG `feColorMatrix` (GPU), NO manipulación de píxeles en Canvas (bloquearía el hilo principal).

### 6.4 Motor de tipografía y espaciado
- Escala modular: tamaño base (16px) × ratio (1.25, 1.333, 1.618...) elevado a exponentes.
- Se calcula dos veces: móvil y escritorio.
- Interpolación con CSS `clamp()`: resolver `y = mx + b`.
  - Pendiente m = (max − min) / (viewportMax − viewportMin)
  - Intersección b = min − (m × viewportMin)
- **Salida siempre en `rem`** (no `px` ni `vw` solos) para respetar accesibilidad de zoom.

## 7. Exportación
- Resolución de alias, casing por target (CSS `--kebab`, JS `camelCase`), inyección de configs (tailwind.config.js).
- Empaquetado con jszip: estructura de carpetas (/css/, /tailwind/, /tokens/), `generateAsync({type:"blob"})`, descarga vía `URL.createObjectURL`.
- Web Worker para no congelar la UI durante la compilación.

## 8. Estructura del repositorio (propuesta)

```
/
├── public/
├── src/
│   ├── engines/          # lógica pura, sin Vue — testeable en aislamiento
│   │   ├── color/        # OKLCH, escalas, armonías, gamut
│   │   ├── contrast/     # wcag2, apca, bridge, autofix
│   │   ├── cvd/          # matrices daltonismo + SVG filters
│   │   └── typography/   # escala modular, clamp
│   ├── export/           # dtcg, transforms, jszip, worker
│   ├── stores/           # Pinia (tokens = single source of truth)
│   ├── components/       # UI Vue
│   ├── views/
│   └── App.vue
├── vite.config.js
├── LICENSE               # MIT o Apache 2.0 (decidir antes del 1er commit público)
└── README.md
```

Principio clave: los `engines/` son JS/TS puro, sin dependencias de Vue. Así se pueden testear solos y, si algún día migras a React, se reutilizan tal cual.

## 9. Decisiones (ver docs/DECISIONS.md para el detalle)
- ✅ **Licencia:** Apache 2.0 (ADR-001)
- ✅ **Lenguaje:** TypeScript, engines/ sin Vue (ADR-002)
- ✅ **Exportación:** transforms propias, Style Dictionary diferido (ADR-004)
- ✅ **Hosting:** Cloudflare Pages (ADR-005)

Pendiente (no bloquea código): nombre del proyecto + dominio + correo (Cloudflare Email Routing, gratis).

## 10. Orden de construcción sugerido
1. Scaffold Vue+Vite, deploy vacío a Cloudflare Pages (validar pipeline desde el día 1).
2. Motor de color OKLCH + escala tonal (el núcleo visible).
3. UI mínima: input de color base → mostrar escala.
4. Motor de contraste con los 3 modos.
5. Auto-fix.
6. Tipografía + espaciado fluido.
7. Simulación de daltonismo.
8. Estructura DTCG + store Pinia.
9. Exportación (transforms + jszip + worker).
10. Pulido de UI, tooltips de licencia, enlace "Why APCA", README.