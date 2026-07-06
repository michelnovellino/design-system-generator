/**
 * Tests del motor de simulación de daltonismo.
 * Las matrices son las de Machado et al. 2009 (severidad 1.0); se comprueba
 * su forma para feColorMatrix y la invariante clave: el blanco sigue blanco
 * (cada fila del 3×3 suma ≈1) y el alfa queda intacto.
 */
import { describe, expect, it } from 'vitest'
import {
  CVD_TYPES,
  cvdFilterId,
  cvdFilterSvg,
  cvdFiltersSvg,
  cvdMatrix,
} from './index'
import type { CvdType } from '@/types'

/** Aplica la matriz 4×5 de feColorMatrix a un color RGBA (0..1). */
function applyMatrix(
  values: number[],
  rgba: [number, number, number, number],
): [number, number, number, number] {
  const [r, g, b, a] = rgba
  const channel = (o: number): number =>
    values[o]! * r + values[o + 1]! * g + values[o + 2]! * b + values[o + 3]! * a + values[o + 4]!
  return [channel(0), channel(5), channel(10), channel(15)]
}

describe('cvdMatrix', () => {
  it('devuelve 20 valores (matriz 4×5) para cada tipo', () => {
    for (const type of CVD_TYPES) {
      expect(cvdMatrix(type)).toHaveLength(20)
    }
  })

  it('la fila alfa es identidad: alfa intacto, sin offset', () => {
    for (const type of CVD_TYPES) {
      const m = cvdMatrix(type)
      expect(m.slice(15)).toEqual([0, 0, 0, 1, 0])
    }
  })

  it('el blanco permanece blanco (cada fila de color suma ≈1)', () => {
    for (const type of CVD_TYPES) {
      const [r, g, b] = applyMatrix(cvdMatrix(type), [1, 1, 1, 1])
      expect(r).toBeCloseTo(1, 4)
      expect(g).toBeCloseTo(1, 4)
      expect(b).toBeCloseTo(1, 4)
    }
  })

  it('el negro permanece negro (sin offsets)', () => {
    for (const type of CVD_TYPES) {
      const out = applyMatrix(cvdMatrix(type), [0, 0, 0, 1])
      expect(out.slice(0, 3)).toEqual([0, 0, 0])
    }
  })

  it('acromatopsia produce gris: los tres canales de salida son iguales', () => {
    const [r, g, b] = applyMatrix(cvdMatrix('achromatopsia'), [0.9, 0.3, 0.1, 1])
    expect(g).toBeCloseTo(r, 6)
    expect(b).toBeCloseTo(r, 6)
    // y coincide con la luma Rec. 709
    expect(r).toBeCloseTo(0.2126 * 0.9 + 0.7152 * 0.3 + 0.0722 * 0.1, 6)
  })

  it('mantiene los valores exactos de Machado para protanopía', () => {
    // primera fila del 3×3
    expect(cvdMatrix('protanopia').slice(0, 3)).toEqual([0.152286, 1.052583, -0.204868])
  })

  it('los tipos dicromáticos alteran el color (no son identidad)', () => {
    const dichromats: CvdType[] = ['protanopia', 'deuteranopia', 'tritanopia']
    for (const type of dichromats) {
      const [r, g] = applyMatrix(cvdMatrix(type), [0.8, 0.2, 0.2, 1])
      // rojo puro se distorsiona perceptiblemente
      expect(Math.abs(r - 0.8) + Math.abs(g - 0.2)).toBeGreaterThan(0.05)
    }
  })
})

describe('cvdFilterId / cvdFilterSvg', () => {
  it('genera ids estables con prefijo cvd-', () => {
    expect(cvdFilterId('deuteranopia')).toBe('cvd-deuteranopia')
  })

  it('el filtro declara linearRGB y contiene los valores de la matriz', () => {
    const svg = cvdFilterSvg('tritanopia')
    expect(svg).toContain('id="cvd-tritanopia"')
    expect(svg).toContain('color-interpolation-filters="linearRGB"')
    expect(svg).toContain('type="matrix"')
    expect(svg).toContain(cvdMatrix('tritanopia').join(' '))
  })
})

describe('cvdFiltersSvg', () => {
  it('inyecta un filtro por cada tipo, oculto y sin ocupar espacio', () => {
    const svg = cvdFiltersSvg()
    for (const type of CVD_TYPES) {
      expect(svg).toContain(`id="${cvdFilterId(type)}"`)
    }
    expect(svg).toContain('aria-hidden="true"')
    expect(svg).toMatch(/width:0;height:0/)
  })
})
