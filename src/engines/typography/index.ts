/**
 * Motor de tipografía y espaciado fluido.
 * Escala modular (base × ratio^n) calculada para móvil y escritorio,
 * fusionada con CSS clamp() resolviendo la recta y = mx + b.
 *
 * Regla dura: la salida SIEMPRE en `rem` (nunca px absolutos ni vw solos),
 * para respetar el zoom de accesibilidad del navegador. La expresión
 * preferida del clamp() combina un offset en `rem` con un término `vw`
 * (patrón accesible: el `rem` escala con el zoom y el clamp acota en rem).
 *
 * Ver docs/DECISIONS.md ADR-007 para el modelo de dos escalas (móvil/escritorio).
 */

/** rem se calcula contra el root por defecto del navegador (16px). */
const REM_BASE_PX = 16

export interface ScaleConfig {
  /** Tamaño del body (px) en el viewport mínimo (móvil). Ej. 16. */
  minBasePx: number
  /** Tamaño del body (px) en el viewport máximo (escritorio). Ej. 18. */
  maxBasePx: number
  /** Ratio modular en móvil. Ej. 1.2 (Tercera Menor). */
  minRatio: number
  /** Ratio modular en escritorio. Ej. 1.25 (Tercera Mayor). */
  maxRatio: number
  /** Peldaños hacia arriba desde body (titulares). Ej. 5 → h1..h5. */
  positiveSteps: number
  /** Peldaños hacia abajo desde body (texto pequeño). Ej. 2 → sm, xs. */
  negativeSteps: number
  /** Viewport mínimo en px (ancla del tamaño móvil). Ej. 360. */
  minViewportPx: number
  /** Viewport máximo en px (ancla del tamaño escritorio). Ej. 1280. */
  maxViewportPx: number
}

/** Un peldaño de la escala tipográfica con su valor clamp() fluido. */
export interface TypeStep {
  label: string // "h1", "h2", ... "body", "sm", "xs"
  minRem: number
  maxRem: number
  /** cadena CSS lista: clamp(min, mvw + brem, max) */
  clamp: string
}

/** Redondea a `places` decimales sin ceros de cola (para CSS limpio). */
function round(n: number, places = 4): number {
  return Number.parseFloat(n.toFixed(places))
}

/**
 * Construye una sola expresión clamp() fluida entre dos tamaños en px,
 * medidos en el viewport mínimo y máximo. Devuelve CSS con bordes en `rem`
 * y término fluido en `vw`.
 *
 * y = m·x + b, con x = ancho de viewport en px:
 *   m = (maxPx − minPx) / (maxViewport − minViewport)   [px por px]
 *   b = minPx − m·minViewport                            [px, offset]
 * En CSS: 1vw = viewport/100 px ⇒ el coeficiente vw es m·100.
 */
export function fluidClamp(
  minPx: number,
  maxPx: number,
  minViewportPx: number,
  maxViewportPx: number,
): string {
  // Sin fluidez (mismo tamaño en ambos extremos): rem plano.
  if (minPx === maxPx || minViewportPx === maxViewportPx) {
    return `${round(minPx / REM_BASE_PX)}rem`
  }

  const slope = (maxPx - minPx) / (maxViewportPx - minViewportPx)
  const interceptRem = (minPx - slope * minViewportPx) / REM_BASE_PX
  const vwCoefficient = slope * 100

  // Los bordes del clamp deben ir ordenados (min, ..., max) aunque el
  // tamaño decrezca con el viewport (slope negativo).
  const lowerRem = Math.min(minPx, maxPx) / REM_BASE_PX
  const upperRem = Math.max(minPx, maxPx) / REM_BASE_PX

  const preferred = `${round(interceptRem)}rem + ${round(vwCoefficient)}vw`
  return `clamp(${round(lowerRem)}rem, ${preferred}, ${round(upperRem)}rem)`
}

/**
 * Etiqueta de un peldaño según su índice n (0 = body).
 * Positivos → titulares: el mayor es h1. Negativos → texto pequeño.
 */
function labelForStep(n: number, positiveSteps: number): string {
  if (n === 0) return 'body'
  if (n > 0) {
    // n = positiveSteps es el mayor → h1; n = 1 → h{positiveSteps}.
    return `h${positiveSteps - n + 1}`
  }
  // -1 → sm, -2 → xs, -3 → 2xs, -4 → 3xs, ...
  const depth = -n
  return depth === 1 ? 'sm' : depth === 2 ? 'xs' : `${depth - 1}xs`
}

/**
 * Genera la escala tipográfica fluida completa, del titular mayor (h1)
 * al texto más pequeño. Cada peldaño interpola entre su tamaño móvil
 * (minBase × minRatio^n) y escritorio (maxBase × maxRatio^n).
 */
export function generateTypeScale(cfg: ScaleConfig): TypeStep[] {
  const steps: TypeStep[] = []
  for (let n = cfg.positiveSteps; n >= -cfg.negativeSteps; n--) {
    const minSizePx = cfg.minBasePx * cfg.minRatio ** n
    const maxSizePx = cfg.maxBasePx * cfg.maxRatio ** n
    steps.push({
      label: labelForStep(n, cfg.positiveSteps),
      minRem: round(minSizePx / REM_BASE_PX),
      maxRem: round(maxSizePx / REM_BASE_PX),
      clamp: fluidClamp(minSizePx, maxSizePx, cfg.minViewportPx, cfg.maxViewportPx),
    })
  }
  return steps
}

export interface SpacingConfig {
  /** Unidad base de espaciado en px. Ej. 4. */
  basePx: number
  /** Multiplicadores de la unidad base. Ej. [0, 0.5, 1, 2, 3, 4, 6, 8]. */
  multipliers: number[]
}

/** Un token de espaciado. Valor no fluido: rem fijo (predecible y accesible). */
export interface SpaceStep {
  /** Etiqueta tipo Tailwind: el multiplicador como string. Ej. "4", "0.5". */
  label: string
  rem: number
  px: number
}

/** Multiplicadores por defecto (compatibles con la convención de Tailwind). */
export const DEFAULT_SPACING_MULTIPLIERS = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24,
] as const

/**
 * Genera la escala de espaciado en `rem`. El espaciado NO es fluido a
 * propósito: tokens de rem fijos son predecibles y respetan el zoom
 * (ver ADR-007). El multiplicador se usa como etiqueta, estilo Tailwind.
 */
export function generateSpacingScale(cfg: SpacingConfig): SpaceStep[] {
  return cfg.multipliers.map((mult) => {
    const px = cfg.basePx * mult
    return {
      label: String(mult),
      rem: round(px / REM_BASE_PX),
      px: round(px, 2),
    }
  })
}
