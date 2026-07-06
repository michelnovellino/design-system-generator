/**
 * Motor de contraste — tres modos.
 *  - wcag2:  algoritmo clásico (luminancia relativa, ratio X:1).
 *  - bridge: paquete oficial `bridge-pca` (default de la app).
 *  - apca:   paquete oficial `apca-w3`.
 *
 * IMPORTANTE (licencia Myndex — ver docs/DECISIONS.md ADR-003):
 *  - Usar los paquetes oficiales SIN modificar algoritmo ni constantes.
 *  - Mantener las versiones al día.
 *  - El primer color es SIEMPRE el texto, el segundo el fondo
 *    (APCA y Bridge son sensibles a la polaridad).
 *  - Mostrar enlace a "Why APCA" cerca del output de Lc. No usar logos.
 *
 * Umbrales por defecto (texto de cuerpo): wcag2 y bridge → ratio ≥ 4.5;
 * apca → |Lc| ≥ 75 (mínimo para cuerpo según las guías APCA).
 */
import { converter, wcagContrast } from 'culori'
import { APCAcontrast, fontLookupAPCA, sRGBtoY as apcaSrgbToY } from 'apca-w3'
import { BPCAcontrast, bridgeRatio, sRGBtoY as bpcaSrgbToY } from 'bridge-pca'
import { hexToOklch, oklchToHex } from '@/engines/color'
import type { ContrastResult } from '@/types'

const toRgb = converter('rgb')

/** HEX → [r, g, b] en 0–255, el formato que esperan apca-w3 y bridge-pca. */
function hexToRgb255(hex: string): number[] {
  const rgb = toRgb(hex)
  if (rgb === undefined) {
    throw new Error(`Color HEX inválido: "${hex}"`)
  }
  return [Math.round(rgb.r * 255), Math.round(rgb.g * 255), Math.round(rgb.b * 255)]
}

/** Etiqueta WCAG 2 clásica según el ratio (texto normal / grande). */
function wcagLabel(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA (solo texto grande)'
  return 'Falla'
}

/** WCAG 2 clásico. No sensible a polaridad. Umbral: AA cuerpo (4.5:1). */
export function wcag2(textHex: string, bgHex: string): ContrastResult {
  const ratio = wcagContrast(textHex, bgHex)
  return {
    mode: 'wcag2',
    ratio,
    label: wcagLabel(ratio),
    passes: ratio >= 4.5,
  }
}

/**
 * Bridge PCA — Lc perceptual + ratio "WCAG compatible".
 * OJO: el ratio NO es el cálculo literal de WCAG 2, es un equivalente
 * perceptual (la UI debe aclararlo, PLAN §4). Umbral: ratio ≥ 4.5.
 */
export function bridge(textHex: string, bgHex: string): ContrastResult {
  const txtY = bpcaSrgbToY(hexToRgb255(textHex))
  const bgY = bpcaSrgbToY(hexToRgb255(bgHex))
  const lcSigned = BPCAcontrast(txtY, bgY)
  // bridgeRatio devuelve "4.5 to 1"; extraemos el número.
  const ratio = Number.parseFloat(bridgeRatio(lcSigned, txtY, bgY))
  return {
    mode: 'bridge',
    lc: Math.abs(lcSigned),
    ratio,
    label: wcagLabel(ratio),
    passes: ratio >= 4.5,
  }
}

/** Etiqueta según los niveles de legibilidad de las guías APCA. */
function apcaLabel(absLc: number): string {
  if (absLc >= 90) return 'Lc 90+ · óptimo para cuerpo'
  if (absLc >= 75) return 'Lc 75+ · mínimo para cuerpo'
  if (absLc >= 60) return 'Lc 60+ · texto grande'
  if (absLc >= 45) return 'Lc 45+ · titulares grandes'
  if (absLc >= 30) return 'Lc 30+ · solo elementos no-texto'
  return 'Falla'
}

/** APCA completo — valor Lc. Umbral: |Lc| ≥ 75 (mínimo cuerpo). */
export function apca(textHex: string, bgHex: string): ContrastResult {
  const lcSigned = APCAcontrast(apcaSrgbToY(hexToRgb255(textHex)), apcaSrgbToY(hexToRgb255(bgHex)))
  const absLc = Math.abs(lcSigned)
  return {
    mode: 'apca',
    lc: absLc,
    label: apcaLabel(absLc),
    passes: absLc >= 75,
  }
}

/**
 * Tabla de fuentes APCA: tamaño mínimo (px) por peso 100..900 para un Lc.
 * Envuelve `fontLookupAPCA` oficial; índice 0 es el propio Lc.
 * Valores 777/999 significan "no permitido para texto".
 */
export function apcaFontTable(lc: number): number[] {
  return fontLookupAPCA(lc)
}

/** Métrica que se compara contra el objetivo en cada modo. */
function measure(mode: ContrastResult['mode'], textHex: string, bgHex: string): number {
  switch (mode) {
    case 'wcag2':
      return wcag2(textHex, bgHex).ratio ?? 0
    case 'bridge':
      return bridge(textHex, bgHex).ratio ?? 0
    case 'apca':
      return apca(textHex, bgHex).lc ?? 0
  }
}

/** Paso de ajuste del canal L por iteración (PLAN §6.2). */
const L_STEP = 0.005

/**
 * Auto-fix: ajusta iterativamente el canal L (OKLCH) del texto en pasos
 * de ±0.005 hasta alcanzar el objetivo del modo dado, manteniendo H y C
 * (el croma solo se recorta si el nuevo L lo saca de sRGB).
 *
 * `target` se interpreta en la métrica del modo: ratio para wcag2/bridge
 * (p. ej. 4.5) y |Lc| para apca (p. ej. 75).
 *
 * Explora hacia claro y oscuro a la vez y devuelve el candidato con el
 * menor cambio de L. Devuelve null si ni L=0 ni L=1 alcanzan el objetivo
 * (ajustar solo L no basta contra ese fondo).
 */
export function autoFix(
  textHex: string,
  bgHex: string,
  mode: ContrastResult['mode'],
  target: number,
): string | null {
  if (measure(mode, textHex, bgHex) >= target) return textHex

  const base = hexToOklch(textHex)
  const maxSteps = Math.ceil(1 / L_STEP)

  for (let k = 1; k <= maxSteps; k++) {
    const delta = k * L_STEP
    for (const l of [base.l - delta, base.l + delta]) {
      if (l < 0 || l > 1) continue
      const { hex } = oklchToHex({ l, c: base.c, h: base.h })
      if (measure(mode, hex, bgHex) >= target) return hex
    }
  }
  return null
}
