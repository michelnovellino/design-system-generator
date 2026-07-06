/**
 * Tipos compartidos entre los engines.
 * Esta capa es TypeScript puro, SIN dependencias de Vue,
 * para poder testearla en aislamiento y reutilizarla si algún día
 * se migra el frontend a otro framework. (Ver docs/DECISIONS.md ADR-002)
 */

/** Color en coordenadas OKLCH. L 0..1, C 0..~0.4, H 0..360 (grados). */
export interface Oklch {
  l: number
  c: number
  h: number
}

/** Un solo peldaño de una escala tonal (50..950). */
export interface ToneStep {
  /** Etiqueta tipo Tailwind: 50, 100, ... 950 */
  step: number
  /** Valor en OKLCH */
  oklch: Oklch
  /** Valor HEX en gama sRGB, ya recortado si hacía falta */
  hex: string
  /** true si el color original caía fuera de sRGB y se recortó el croma */
  clipped: boolean
}

/** Una escala tonal completa para un color. */
export interface ColorScale {
  /** Nombre del color, p. ej. "brand", "blue" */
  name: string
  /** Matiz base en grados */
  baseHue: number
  steps: ToneStep[]
}

/** Modo de evaluación de contraste. */
export type ContrastMode = 'wcag2' | 'bridge' | 'apca'

/** Resultado de una evaluación de contraste. */
export interface ContrastResult {
  mode: ContrastMode
  /** Valor Lc (APCA/Bridge) — |Lc| 0..106. undefined en wcag2 puro. */
  lc?: number
  /** Ratio X:1 (WCAG 2 clásico, o el "WCAG compatible" de Bridge). */
  ratio?: number
  /** Etiqueta legible: "AAA", "AA", "Falla", o nivel de fuente APCA. */
  label: string
  /** ¿Pasa el umbral objetivo dado? */
  passes: boolean
}

/** Tipo de deficiencia de visión del color a simular. */
export type CvdType =
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
