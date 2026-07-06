/**
 * Tests del motor de tipografía y espaciado.
 * La propiedad clave del clamp() fluido: evaluado en el viewport mínimo
 * da el tamaño móvil, y en el máximo el de escritorio (recta y = mx + b).
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SPACING_MULTIPLIERS,
  fluidClamp,
  generateSpacingScale,
  generateTypeScale,
  type ScaleConfig,
} from './index'

/** Evalúa una expresión CSS "Xrem + Yvw" (o "Zrem") a px para un viewport. */
function evalPreferred(expr: string, viewportPx: number): number {
  const rem = /(-?[\d.]+)rem/.exec(expr)
  const vw = /(-?[\d.]+)vw/.exec(expr)
  const remPx = rem ? Number.parseFloat(rem[1]!) * 16 : 0
  const vwPx = vw ? (Number.parseFloat(vw[1]!) / 100) * viewportPx : 0
  return remPx + vwPx
}

/** Extrae el término preferido (medio) de un clamp(min, PREF, max). */
function preferredOf(clampStr: string): string {
  const inner = /clamp\(([^,]+),(.+),([^,]+)\)/.exec(clampStr)
  return inner ? inner[2]!.trim() : clampStr
}

describe('fluidClamp', () => {
  it('interpola linealmente: extremos exactos en min y max viewport', () => {
    const c = fluidClamp(16, 24, 360, 1280)
    expect(c).toMatch(/^clamp\(/)
    const pref = preferredOf(c)
    // tolerancia 0.01px: el CSS redondea los coeficientes a 4 decimales
    expect(evalPreferred(pref, 360)).toBeCloseTo(16, 2)
    expect(evalPreferred(pref, 1280)).toBeCloseTo(24, 2)
  })

  it('acota en rem: borde inferior 1rem, superior 1.5rem', () => {
    const c = fluidClamp(16, 24, 360, 1280)
    expect(c).toMatch(/clamp\(1rem,/)
    expect(c).toMatch(/, 1\.5rem\)$/)
  })

  it('sin fluidez (min = max) devuelve rem plano, sin clamp', () => {
    expect(fluidClamp(16, 16, 360, 1280)).toBe('1rem')
  })

  it('maneja tamaño decreciente (slope negativo) ordenando los bordes', () => {
    const c = fluidClamp(24, 16, 360, 1280)
    expect(c).toMatch(/clamp\(1rem,/) // borde inferior = el menor
    expect(c).toMatch(/, 1\.5rem\)$/) // borde superior = el mayor
    const pref = preferredOf(c)
    expect(evalPreferred(pref, 360)).toBeCloseTo(24, 2)
    expect(evalPreferred(pref, 1280)).toBeCloseTo(16, 2)
  })

  it('la salida nunca usa px absolutos ni vw en los bordes del clamp', () => {
    const c = fluidClamp(14, 40, 320, 1440)
    // los bordes (fuera del preferido) deben ser rem
    expect(c).not.toMatch(/\dpx/)
    const [, min, , max] = /clamp\(([^,]+),(.+),([^,]+)\)/.exec(c)!
    expect(min!.trim()).toMatch(/rem$/)
    expect(max!.trim()).toMatch(/rem$/)
  })
})

describe('generateTypeScale', () => {
  const cfg: ScaleConfig = {
    minBasePx: 16,
    maxBasePx: 18,
    minRatio: 1.2,
    maxRatio: 1.25,
    positiveSteps: 5,
    negativeSteps: 2,
    minViewportPx: 360,
    maxViewportPx: 1280,
  }
  const scale = generateTypeScale(cfg)

  it('produce positiveSteps + 1 + negativeSteps peldaños', () => {
    expect(scale).toHaveLength(5 + 1 + 2)
  })

  it('ordena de mayor (h1) a menor, con body y small', () => {
    expect(scale.map((s) => s.label)).toEqual([
      'h1', 'h2', 'h3', 'h4', 'h5', 'body', 'sm', 'xs',
    ])
  })

  it('el peldaño body es exactamente base/16 en cada extremo', () => {
    const body = scale.find((s) => s.label === 'body')!
    expect(body.minRem).toBeCloseTo(16 / 16, 4) // 1rem móvil
    expect(body.maxRem).toBeCloseTo(18 / 16, 4) // 1.125rem escritorio
  })

  it('h1 = base × ratio^5 en ambas escalas', () => {
    const h1 = scale[0]!
    expect(h1.label).toBe('h1')
    expect(h1.minRem).toBeCloseTo((16 * 1.2 ** 5) / 16, 3)
    expect(h1.maxRem).toBeCloseTo((18 * 1.25 ** 5) / 16, 3)
  })

  it('minRem crece monótonamente de menor a mayor peldaño', () => {
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i]!.minRem).toBeLessThan(scale[i - 1]!.minRem)
    }
  })

  it('cada clamp evalúa a su tamaño móvil/escritorio en los extremos', () => {
    for (const step of scale) {
      if (!step.clamp.startsWith('clamp(')) continue
      const pref = preferredOf(step.clamp)
      expect(evalPreferred(pref, 360) / 16).toBeCloseTo(step.minRem, 3)
      expect(evalPreferred(pref, 1280) / 16).toBeCloseTo(step.maxRem, 3)
    }
  })

  it('es determinista', () => {
    expect(generateTypeScale(cfg)).toEqual(scale)
  })
})

describe('generateSpacingScale', () => {
  const scale = generateSpacingScale({
    basePx: 4,
    multipliers: [...DEFAULT_SPACING_MULTIPLIERS],
  })

  it('convierte multiplicador × base a rem (base 4px)', () => {
    const s4 = scale.find((s) => s.label === '4')!
    expect(s4.px).toBe(16)
    expect(s4.rem).toBe(1)
    const half = scale.find((s) => s.label === '0.5')!
    expect(half.px).toBe(2)
    expect(half.rem).toBe(0.125)
  })

  it('incluye el cero y respeta el orden de los multiplicadores', () => {
    expect(scale[0]!.label).toBe('0')
    expect(scale[0]!.rem).toBe(0)
    expect(scale).toHaveLength(DEFAULT_SPACING_MULTIPLIERS.length)
  })
})
