# Registro de Decisiones de Arquitectura (ADR)

Este archivo documenta decisiones tomadas deliberadamente, con su razonamiento,
para no volver a discutirlas y para que cualquier contribuidor entienda el porqué.

---

## ADR-001 — Licencia del proyecto: Apache 2.0

**Estado:** Aceptada

**Contexto:** El proyecto es open source y busca contribuciones externas.

**Decisión:** Apache License 2.0.

**Razón:** Además de ser permisiva como MIT, Apache 2.0 incluye una cláusula
explícita de concesión de patentes, lo que da mayor tranquilidad legal a
empresas y contribuidores. Elegida antes del primer commit público para evitar
el problema de re-licenciar con contribuidores ya presentes.

---

## ADR-002 — TypeScript, con énfasis en la capa `engines/`

**Estado:** Aceptada

**Decisión:** Todo el proyecto en TypeScript. La capa `engines/` (color,
contraste, CVD, tipografía) es TS puro, sin ninguna dependencia de Vue.

**Razón:** La matemática de color y contraste es propensa a bugs sutiles de
tipos (p. ej. confundir un array RGBA con RGB, o un OKLCH normalizado con uno
sin normalizar). Los tipos los previenen. Mantener `engines/` libre de Vue
permite testearlos en aislamiento y reutilizarlos intactos si algún día se
migra a otro framework.

---

## ADR-003 — Tres modos de contraste

**Estado:** Aceptada

**Decisión:** Ofrecer WCAG 2 clásico, APCA completo y Bridge PCA (este último
como modo por defecto).

**Razón:** WCAG 2 sigue siendo el estándar legal mientras WCAG 3 está en
borrador. Bridge PCA da cumplimiento legal + legibilidad perceptual. APCA
completo da máxima flexibilidad de diseño. Cubren tres perfiles de usuario
distintos y no son excluyentes.

**Restricciones de licencia (Myndex):** usar `apca-w3` y `bridge-pca` oficiales
sin modificar algoritmo/constantes; mantener versiones al día; enlace vivo a
"Why APCA" cerca del output de Lc; no usar logos "APCA"/"Powered by APCA".

**Nota de integración:** `bridge-pca@0.1.6` (la última publicada) importa
`colorparsley` con una ruta relativa hardcodeada que no resuelve bajo pnpm.
Para NO modificar el paquete oficial, la corrección vive en `vite.config.ts`:
un `resolve.alias` que redirige ese specifier al paquete real, más
`optimizeDeps.exclude` porque el pre-bundler no aplica aliases. Si una
versión futura corrige el import, retirar ambos ajustes.

---

## ADR-004 — Capa de exportación: transforms propias, NO Style Dictionary

**Estado:** Aceptada (decisión firme — no re-litigar)

**Contexto:** Los tokens se almacenan en formato DTCG (JSON). Frameworks como
Tailwind, CSS nativo, iOS o Android no consumen DTCG directamente; hace falta
traducirlo. La herramienta estándar de la industria para esto es
**Style Dictionary** (de Amazon), pero está orientada a Node.js. Para operar
100% en el cliente habría que usar un *port* a navegador (p. ej.
`browser-style-dictionary`).

**Decisión:** Para el alcance actual, escribir **transforms propias en
TypeScript** que cubran los targets que realmente necesitamos:
- Variables CSS nativas (`:root { --color-...: ... }`)
- Configuración de Tailwind (`tailwind.config.js`)
- El propio `tokens.json` en formato DTCG

**NO** integrar Style Dictionary por ahora.

**Razón:**
1. El port a navegador **no es oficial** y añade riesgo de mantenimiento
   (puede quedar desactualizado respecto al Style Dictionary principal).
2. Para 3-4 targets, escribir las transforms nosotros es sencillo y nos da
   control total, sin arrastrar una dependencia pesada y frágil.
3. Menos dependencias externas = build más liviano y menos superficie de fallo,
   coherente con la filosofía "100% cliente, auditable, sin sorpresas".

**Consecuencia / tradeoff aceptado:** si en el futuro queremos soportar muchos
más targets (Swift/iOS, Jetpack Compose/Android, SCSS, React Native, Flutter,
etc.), mantener transforms propias para todos ellos se vuelve costoso. Ahí es
donde Style Dictionary brillaría.

### Por qué integrarlo sería un "good to have" (futuro)
- Ecosistema maduro de transforms y formatos ya escritos y probados para
  decenas de plataformas.
- Comunidad grande: menos trabajo propio para targets exóticos.
- Estandariza el pipeline de tokens, alineándonos con lo que ya usan equipos
  corporativos.

### Pasos para integrarlo cuando llegue el momento
1. Evaluar el estado de `browser-style-dictionary` (u otro port vigente):
   ¿está mantenido?, ¿sincronizado con la versión oficial?, ¿soporta los
   formatos que necesitamos? Si no hay un port sano, reconsiderar.
2. Añadir la dependencia y aislarla detrás de una interfaz propia
   (`export/StyleDictionaryAdapter.ts`) para no acoplar el resto del código
   a su API. Nuestras transforms actuales quedan como fallback/alternativa.
3. Mapear nuestra estructura DTCG a la configuración de Style Dictionary
   (source + platforms + transformGroups).
4. Ejecutarlo dentro del Web Worker de exportación para no congelar la UI.
5. Migrar target por target (empezando por los que ya tenemos, para validar
   paridad de salida), no todo de golpe.
6. Mantener tests que comparen la salida de Style Dictionary con la esperada,
   para detectar cambios de comportamiento entre versiones.

**Nota:** hasta que eso ocurra, dejar un TODO visible en `src/export/` que
apunte a este ADR.

---

## ADR-005 — Hosting: Cloudflare Pages

**Estado:** Aceptada

**Decisión:** Desplegar en Cloudflare Pages (Vue + Vite genera estáticos).

**Razón:** Gratis, HTTPS, dominio custom sencillo, build automático desde Git,
sin configuración de `base` como sí requiere GitHub Pages. Correo del proyecto
vía Cloudflare Email Routing (gratis). Coste real del proyecto ≈ solo el dominio.

---

## ADR-006 — Algoritmo de la escala tonal y gamut clipping

**Estado:** Aceptada

**Contexto:** El motor de color (PLAN §6.1) genera la escala 50→950 en OKLCH.
Hubo que fijar tres decisiones de implementación.

**Decisión 1 — Gamut clipping con `clampChroma(color, 'oklch')`:**
`culori` ofrece dos mecanismos: `clampChroma` (bisección de croma pura) y
`toGamut` (algoritmo CSS Color 4 con tolerancia JND). Se evaluó `toGamut` y
se descartó: su tolerancia JND desplaza el matiz hasta ~5°, y el PLAN §6.1
exige "reducir croma manteniendo L y H". `clampChroma` en modo `'oklch'`
preserva L y H exactos. **Ojo:** el modo por defecto de `clampChroma` es CIE
LCH, no OKLCH — siempre pasar `'oklch'` explícito.

**Decisión 2 — Inserción del color base en el peldaño 500:**
La curva L de referencia (0.97 → 0.15, dentro del rango del PLAN para el 950)
se reescala por tramos: el tramo claro [500→50] y el oscuro [500→950] se
interpolan por separado hacia el L del base, preservando el ritmo de la curva.
Esto garantiza monotonía estricta y extremos fijos para cualquier base con
L ∈ (0.15, 0.97). Bases extremas (casi negras/blancas) se acotan a
L ∈ [0.20, 0.92]: la escala sigue siendo usable, a costa de que el 500 no
coincida exactamente con el base en esos casos límite.

**Decisión 3 — Tests con tolerancia perceptual, no igualdad exacta:**
El round-trip HEX→OKLCH→HEX cuantiza a 8 bits por canal; la igualdad exacta
de strings HEX no es una propiedad universal. Los tests comparan con ΔE
euclídeo en OKLCH (JND ≈ 0.02) y tolerancias angulares de matiz (~1.5°,
el ruido de cuantización).

---

## ADR-007 — Motor de tipografía: dos escalas y espaciado no fluido

**Estado:** Aceptada

**Contexto:** El stub de `ScaleConfig` traía un solo `basePx` y un solo
`ratio`. El PLAN §6.4 exige "calcular dos veces: móvil y escritorio" e
interpolar con `clamp()`. Con un único base+ratio, el tamaño móvil y el de
escritorio serían idénticos: no hay fluidez posible.

**Decisión 1 — Modelo de dos escalas (móvil/escritorio):**
`ScaleConfig` se rediseñó con `minBasePx`/`maxBasePx` y `minRatio`/`maxRatio`
(metodología estilo utopia.fyi). Cada peldaño `n` interpola entre su tamaño
móvil (`minBase × minRatio^n`) y el de escritorio (`maxBase × maxRatio^n`).
Se añadieron `positiveSteps`/`negativeSteps` para titulares y texto pequeño.
Ningún consumidor usaba aún el stub, así que el cambio no rompe nada.

**Decisión 2 — `clamp()` con offset en rem + término vw:**
La expresión preferida es `{b}rem + {m·100}vw`, resolviendo `y = m·x + b`
sobre el ancho de viewport. Los bordes del `clamp()` van SIEMPRE en rem
(regla dura del PLAN §6.4: respetar el zoom). El término `vw` da la fluidez;
combinado con el offset en rem y el acotado en rem, es el patrón accesible
recomendado (vw puro sí rompería el zoom). Coeficientes redondeados a 4
decimales → los tests validan la interpolación con tolerancia de ~0.01px.

**Decisión 3 — El espaciado NO es fluido:**
Pese al título "espaciado fluido" del PLAN, la escala de espaciado se emite
como tokens de `rem` fijos (multiplicadores estilo Tailwind sobre una unidad
base de 4px). Motivo: el espaciado fluido es impredecible para maquetar y
rara vez deseado; rem fijo ya respeta el zoom. Queda como posible extensión
futura si se pide explícitamente.
