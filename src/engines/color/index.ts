/**
 * Motor de color — OKLCH.
 * Responsable de: parseo HEX↔OKLCH, generación de escala tonal 50→950,
 * gamut mapping a sRGB, y armonías por geometría circular sobre el matiz.
 *
 * Depende de `culori` para las conversiones de espacio de color.
 * TypeScript puro, sin Vue. (Ver docs/DECISIONS.md ADR-002 y ADR-006.)
 */
import { clampChroma, converter, displayable, formatHex } from 'culori'
import type { ColorScale, Oklch, ToneStep } from '@/types'

const toOklchColor = converter('oklch')

/**
 * Definición de la escala: peldaño Tailwind + L de referencia.
 * Curva descendente 0.97 → 0.15 (PLAN §6.1: 50 ≈ 0.97, 950 ≈ 0.15–0.20),
 * con el pivote del 500 en 0.58.
 */
const SCALE_DEF = [
  { step: 50, l: 0.97 },
  { step: 100, l: 0.92 },
  { step: 200, l: 0.85 },
  { step: 300, l: 0.77 },
  { step: 400, l: 0.68 },
  { step: 500, l: 0.58 },
  { step: 600, l: 0.48 },
  { step: 700, l: 0.38 },
  { step: 800, l: 0.29 },
  { step: 900, l: 0.21 },
  { step: 950, l: 0.15 },
] as const

const L_LIGHTEST = 0.97
const L_PIVOT = 0.58
const L_DARKEST = 0.15

/**
 * Rango admisible para insertar el L del color base en el peldaño 500.
 * Bases casi negras o casi blancas se acotan aquí: la escala sigue siendo
 * estrictamente descendente y usable, a costa de que el 500 no coincida
 * exactamente con el base (solo ocurre con bases extremas).
 */
const L_BASE_MIN = 0.2
const L_BASE_MAX = 0.92

/** Normaliza un ángulo de matiz al rango [0, 360). */
function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360
}

/** Convierte un HEX (#rrggbb) a coordenadas OKLCH. */
export function hexToOklch(hex: string): Oklch {
  const parsed = toOklchColor(hex)
  if (parsed === undefined) {
    throw new Error(`Color HEX inválido: "${hex}"`)
  }
  return {
    l: parsed.l,
    c: parsed.c,
    // culori deja h undefined en colores acromáticos (c = 0); fijamos 0.
    h: parsed.h === undefined ? 0 : normalizeHue(parsed.h),
  }
}

/** Convierte OKLCH a HEX en gama sRGB, con gamut mapping si es necesario. */
export function oklchToHex(color: Oklch): { hex: string; clipped: boolean } {
  const oklch = { mode: 'oklch' as const, l: color.l, c: color.c, h: color.h }
  if (displayable(oklch)) {
    return { hex: formatHex(oklch), clipped: false }
  }
  // Bisección de croma EN OKLCH (el modo por defecto de clampChroma es
  // CIE LCH, hay que pasarlo explícito): reduce C manteniendo L y H
  // intactos hasta entrar en sRGB, como exige PLAN §6.1. Ver ADR-006.
  return { hex: formatHex(clampChroma(oklch, 'oklch')), clipped: true }
}

/**
 * Reescala la curva L de referencia para que el peldaño 500 caiga en
 * `lTarget` sin mover los extremos: cada tramo (claro y oscuro) se
 * interpola por separado preservando el ritmo de la curva original.
 * Estrictamente monótona para cualquier lTarget ∈ (L_DARKEST, L_LIGHTEST).
 */
function insertBaseLightness(lRef: number, lTarget: number): number {
  if (lRef >= L_PIVOT) {
    const t = (lRef - L_PIVOT) / (L_LIGHTEST - L_PIVOT)
    return lTarget + t * (L_LIGHTEST - lTarget)
  }
  const t = (L_PIVOT - lRef) / (L_PIVOT - L_DARKEST)
  return lTarget - t * (lTarget - L_DARKEST)
}

/**
 * Genera una escala tonal completa (50→950) a partir de un color base.
 * L: curva descendente con el base insertado en el 500.
 * C: campana senoidal (croma pleno en el centro, reducido en extremos).
 * H: constante, el del base. Gamut mapping por peldaño.
 */
export function generateScale(baseHex: string, name = 'brand'): ColorScale {
  const base = hexToOklch(baseHex)
  const lTarget = Math.min(L_BASE_MAX, Math.max(L_BASE_MIN, base.l))

  const steps: ToneStep[] = SCALE_DEF.map(({ step, l: lRef }, i) => {
    const l = insertBaseLightness(lRef, lTarget)
    // Campana senoidal: 1.0 en el índice 5 (peldaño 500), ~0.26 en extremos.
    const c = base.c * Math.sin(((i + 1) / 12) * Math.PI)
    const oklch: Oklch = { l, c, h: base.h }
    const { hex, clipped } = oklchToHex(oklch)
    return { step, oklch, hex, clipped }
  })

  return { name, baseHue: base.h, steps }
}

/**
 * Armonías por geometría circular sobre el matiz (módulo 360).
 * L y C se mantienen; cada matiz se materializa a HEX con gamut mapping
 * (matices distintos admiten cromas máximos distintos en sRGB).
 */
export function harmonies(baseHex: string): {
  complementary: string
  analogous: [string, string]
  triadic: [string, string]
  tetradic: [string, string]
} {
  const base = hexToOklch(baseHex)
  const rotate = (deg: number): string =>
    oklchToHex({ l: base.l, c: base.c, h: normalizeHue(base.h + deg) }).hex

  return {
    complementary: rotate(180),
    analogous: [rotate(-30), rotate(30)],
    triadic: [rotate(-120), rotate(120)],
    tetradic: [rotate(-90), rotate(90)],
  }
}
