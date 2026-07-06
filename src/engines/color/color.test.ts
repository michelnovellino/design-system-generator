/**
 * Tests del motor de color OKLCH.
 *
 * Nota sobre tolerancias (ADR-006): el round-trip HEX→OKLCH→HEX cuantiza a
 * 8 bits por canal, así que las comparaciones son perceptuales (ΔE en OKLCH)
 * o con tolerancia numérica, nunca igualdad exacta de floats. El gamut
 * clipping (clampChroma en OKLCH) preserva L y H exactos; el único ruido
 * restante es la cuantización del HEX (~1° de matiz, ~0.005 de L).
 */
import { describe, expect, it } from 'vitest'
import { differenceEuclidean } from 'culori'
import { generateScale, harmonies, hexToOklch, oklchToHex } from './index'

/** ΔE euclídeo en OKLCH entre dos HEX. JND ≈ 0.02. */
const deltaE = differenceEuclidean('oklch')

/** Distancia angular mínima entre dos matices (grados). */
function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

const HEX_RE = /^#[0-9a-f]{6}$/

describe('hexToOklch', () => {
  it('convierte #3b82f6 a las coordenadas OKLCH conocidas', () => {
    const { l, c, h } = hexToOklch('#3b82f6')
    expect(l).toBeCloseTo(0.6231, 3)
    expect(c).toBeCloseTo(0.188, 3)
    expect(h).toBeCloseTo(259.81, 1)
  })

  it('devuelve h = 0 (no undefined/NaN) en colores acromáticos', () => {
    const gray = hexToOklch('#808080')
    expect(gray.c).toBe(0)
    expect(gray.h).toBe(0)
    expect(hexToOklch('#ffffff').h).toBe(0)
    expect(hexToOklch('#000000').h).toBe(0)
  })

  it('lanza error con un HEX inválido', () => {
    expect(() => hexToOklch('no-es-un-color')).toThrow(/inválido/)
  })
})

describe('oklchToHex', () => {
  it('round-trip HEX→OKLCH→HEX perceptualmente idéntico (ΔE < 0.005)', () => {
    const samples = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#111827', '#f9fafb']
    for (const hex of samples) {
      const { hex: back, clipped } = oklchToHex(hexToOklch(hex))
      expect(back).toMatch(HEX_RE)
      expect(clipped).toBe(false) // un HEX parseado siempre está en sRGB
      expect(deltaE(hex, back)).toBeLessThan(0.005)
    }
  })

  it('recorta colores fuera de sRGB marcando clipped y conservando L y H', () => {
    // Verde L=0.7 C=0.35: croma imposible en sRGB.
    const wild = { l: 0.7, c: 0.35, h: 150 }
    const { hex, clipped } = oklchToHex(wild)
    expect(clipped).toBe(true)
    expect(hex).toMatch(HEX_RE)
    // clampChroma en OKLCH solo toca C; el residuo es cuantización del HEX.
    const mapped = hexToOklch(hex)
    expect(Math.abs(mapped.l - wild.l)).toBeLessThan(0.01)
    expect(hueDistance(mapped.h, wild.h)).toBeLessThan(1.5)
    expect(mapped.c).toBeLessThan(wild.c)
  })
})

describe('generateScale', () => {
  const scale = generateScale('#3b82f6', 'blue')

  it('devuelve exactamente los 11 peldaños 50→950', () => {
    expect(scale.steps.map((s) => s.step)).toEqual([
      50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
    ])
  })

  it('rellena name y baseHue; name por defecto es "brand"', () => {
    expect(scale.name).toBe('blue')
    expect(scale.baseHue).toBeCloseTo(259.81, 1)
    expect(generateScale('#3b82f6').name).toBe('brand')
  })

  it('inserta el color base en el peldaño 500 (perceptualmente, ΔE < 0.01)', () => {
    const step500 = scale.steps[5]
    expect(step500?.step).toBe(500)
    expect(deltaE('#3b82f6', step500!.hex)).toBeLessThan(0.01)
  })

  it('la curva L es estrictamente descendente con extremos 0.97 y 0.15', () => {
    const ls = scale.steps.map((s) => s.oklch.l)
    expect(ls[0]).toBeCloseTo(0.97, 2)
    expect(ls.at(-1)).toBeCloseTo(0.15, 2)
    for (let i = 1; i < ls.length; i++) {
      expect(ls[i]!).toBeLessThan(ls[i - 1]!)
    }
  })

  it('la campana de croma alcanza su máximo en el 500 y decae hacia los extremos', () => {
    const cs = scale.steps.map((s) => s.oklch.c)
    const c500 = cs[5]!
    expect(c500).toBeCloseTo(hexToOklch('#3b82f6').c, 4)
    for (let i = 0; i < cs.length; i++) {
      if (i !== 5) expect(cs[i]!).toBeLessThan(c500)
    }
    expect(cs[0]!).toBeLessThan(c500 * 0.3)
    expect(cs.at(-1)!).toBeLessThan(c500 * 0.3)
  })

  it('todos los HEX son válidos, el matiz se conserva y clipped es coherente', () => {
    for (const s of scale.steps) {
      expect(s.hex).toMatch(HEX_RE)
      expect(s.oklch.h).toBeCloseTo(scale.baseHue, 5)
      const back = hexToOklch(s.hex)
      if (back.c > 0.02) {
        // en cromas mínimos el matiz del HEX cuantizado pierde precisión
        expect(hueDistance(back.h, scale.baseHue)).toBeLessThan(1.5)
      }
      expect(typeof s.clipped).toBe('boolean')
    }
  })

  it('mantiene la escala monótona y usable con bases extremas (casi negro/blanco)', () => {
    for (const hex of ['#0a0a0a', '#fafafa', '#ff0000']) {
      const s = generateScale(hex)
      expect(s.steps).toHaveLength(11)
      const ls = s.steps.map((t) => t.oklch.l)
      for (let i = 1; i < ls.length; i++) {
        expect(ls[i]!).toBeLessThan(ls[i - 1]!)
      }
      for (const t of s.steps) expect(t.hex).toMatch(HEX_RE)
    }
  })

  it('es determinista: mismo input → mismo output', () => {
    expect(generateScale('#3b82f6', 'blue')).toEqual(scale)
  })
})

describe('harmonies', () => {
  const base = hexToOklch('#3b82f6')
  const h = harmonies('#3b82f6')

  /** Tolerancia de matiz: solo ruido de cuantización del HEX a 8 bits. */
  const HUE_TOL = 1.5

  it('devuelve HEX válidos en toda la estructura', () => {
    const all = [h.complementary, ...h.analogous, ...h.triadic, ...h.tetradic]
    expect(all).toHaveLength(7)
    for (const hex of all) expect(hex).toMatch(HEX_RE)
  })

  it('complementario: matiz base + 180°', () => {
    const got = hexToOklch(h.complementary)
    expect(hueDistance(got.h, normalize(base.h + 180))).toBeLessThan(HUE_TOL)
  })

  it('análogos: matiz base ± 30°', () => {
    expect(hueDistance(hexToOklch(h.analogous[0]).h, normalize(base.h - 30))).toBeLessThan(HUE_TOL)
    expect(hueDistance(hexToOklch(h.analogous[1]).h, normalize(base.h + 30))).toBeLessThan(HUE_TOL)
  })

  it('triádicos: matiz base ± 120°', () => {
    expect(hueDistance(hexToOklch(h.triadic[0]).h, normalize(base.h - 120))).toBeLessThan(HUE_TOL)
    expect(hueDistance(hexToOklch(h.triadic[1]).h, normalize(base.h + 120))).toBeLessThan(HUE_TOL)
  })

  it('tetrádicos: matiz base ± 90°', () => {
    expect(hueDistance(hexToOklch(h.tetradic[0]).h, normalize(base.h - 90))).toBeLessThan(HUE_TOL)
    expect(hueDistance(hexToOklch(h.tetradic[1]).h, normalize(base.h + 90))).toBeLessThan(HUE_TOL)
  })

  it('las armonías conservan L respecto al base (solo ruido de cuantización)', () => {
    for (const hex of [h.complementary, ...h.analogous, ...h.triadic, ...h.tetradic]) {
      expect(Math.abs(hexToOklch(hex).l - base.l)).toBeLessThan(0.01)
    }
  })

  function normalize(deg: number): number {
    return ((deg % 360) + 360) % 360
  }
})
