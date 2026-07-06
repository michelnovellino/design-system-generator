/**
 * Tests del motor de contraste.
 * Valores de referencia verificados directamente contra los paquetes
 * oficiales apca-w3@0.1.9 y bridge-pca@0.1.6 (Lc negro/blanco ≈ 106.04,
 * blanco/negro ≈ 107.88, gris #767676 sobre blanco ≈ 71.57).
 */
import { describe, expect, it } from 'vitest'
import { apca, apcaFontTable, autoFix, bridge, wcag2 } from './index'
import { hexToOklch } from '@/engines/color'

describe('wcag2', () => {
  it('negro sobre blanco = 21:1, AAA', () => {
    const r = wcag2('#000000', '#ffffff')
    expect(r.mode).toBe('wcag2')
    expect(r.ratio).toBeCloseTo(21, 1)
    expect(r.label).toBe('AAA')
    expect(r.passes).toBe(true)
  })

  it('#767676 sobre blanco ≈ 4.54:1, AA', () => {
    const r = wcag2('#767676', '#ffffff')
    expect(r.ratio).toBeCloseTo(4.54, 1)
    expect(r.label).toBe('AA')
    expect(r.passes).toBe(true)
  })

  it('no es sensible a la polaridad (texto/fondo intercambiables)', () => {
    expect(wcag2('#3b82f6', '#ffffff').ratio).toBeCloseTo(wcag2('#ffffff', '#3b82f6').ratio!, 5)
  })

  it('contraste insuficiente falla', () => {
    const r = wcag2('#9ca3af', '#ffffff')
    expect(r.passes).toBe(false)
    expect(r.label).toBe('Falla')
  })
})

describe('apca', () => {
  it('negro sobre blanco: |Lc| ≈ 106.04', () => {
    const r = apca('#000000', '#ffffff')
    expect(r.lc).toBeCloseTo(106.04, 1)
    expect(r.passes).toBe(true)
    expect(r.label).toContain('Lc 90+')
  })

  it('ES sensible a la polaridad: blanco sobre negro da |Lc| ≈ 107.88', () => {
    const r = apca('#ffffff', '#000000')
    expect(r.lc).toBeCloseTo(107.88, 1)
    // distinto del caso invertido — la polaridad importa
    expect(r.lc).not.toBeCloseTo(apca('#000000', '#ffffff').lc!, 1)
  })

  it('#767676 sobre blanco: |Lc| ≈ 71.57 — pasa WCAG 2 pero no el mínimo APCA de cuerpo', () => {
    const r = apca('#767676', '#ffffff')
    expect(r.lc).toBeCloseTo(71.57, 1)
    expect(r.passes).toBe(false)
    expect(r.label).toContain('texto grande')
  })

  it('no expone ratio (Lc puro)', () => {
    expect(apca('#000000', '#ffffff').ratio).toBeUndefined()
  })
})

describe('bridge', () => {
  it('negro sobre blanco: ratio WCAG-compatible ≈ 16:1 (NO el literal 21:1)', () => {
    const r = bridge('#000000', '#ffffff')
    expect(r.ratio).toBeCloseTo(16, 0)
    expect(r.lc).toBeCloseTo(106.04, 1)
    expect(r.passes).toBe(true)
  })

  it('#767676 sobre blanco: ratio perceptual ≈ 4.1 — falla donde WCAG 2 literal pasa', () => {
    const r = bridge('#767676', '#ffffff')
    expect(r.ratio).toBeCloseTo(4.1, 1)
    expect(r.passes).toBe(false)
    // la divergencia con WCAG 2 literal es exactamente la razón de ser de Bridge
    expect(wcag2('#767676', '#ffffff').passes).toBe(true)
  })

  it('expone tanto lc como ratio', () => {
    const r = bridge('#3b82f6', '#ffffff')
    expect(r.lc).toBeGreaterThan(0)
    expect(r.ratio).toBeGreaterThan(0)
  })
})

describe('apcaFontTable', () => {
  it('devuelve la tabla oficial: [lc, ...px por peso 100..900]', () => {
    const row = apcaFontTable(75)
    expect(row).toHaveLength(10)
    // peso 400 (índice 4) a Lc 75 → 18px según la tabla oficial
    expect(row[4]).toBe(18)
  })
})

describe('autoFix', () => {
  it('devuelve el color original si ya cumple el objetivo', () => {
    expect(autoFix('#000000', '#ffffff', 'wcag2', 4.5)).toBe('#000000')
  })

  it('oscurece un gris claro sobre blanco hasta cumplir WCAG 2 AA', () => {
    const fixed = autoFix('#9ca3af', '#ffffff', 'wcag2', 4.5)
    expect(fixed).not.toBeNull()
    expect(wcag2(fixed!, '#ffffff').passes).toBe(true)
    // mantiene el matiz (H) del color original
    const orig = hexToOklch('#9ca3af')
    const got = hexToOklch(fixed!)
    if (got.c > 0.02) {
      expect(Math.abs(got.h - orig.h)).toBeLessThan(5)
    }
    // el cambio fue en L, hacia oscuro
    expect(got.l).toBeLessThan(orig.l)
  })

  it('alcanza el mínimo APCA de cuerpo (|Lc| ≥ 75) ajustando solo L', () => {
    const fixed = autoFix('#767676', '#ffffff', 'apca', 75)
    expect(fixed).not.toBeNull()
    expect(apca(fixed!, '#ffffff').lc).toBeGreaterThanOrEqual(75)
  })

  it('funciona en modo bridge con objetivo de ratio', () => {
    const fixed = autoFix('#767676', '#ffffff', 'bridge', 4.5)
    expect(fixed).not.toBeNull()
    expect(bridge(fixed!, '#ffffff').passes).toBe(true)
  })

  it('devuelve null cuando el objetivo es inalcanzable ajustando solo L', () => {
    // Sobre un fondo gris medio, ningún L alcanza 10:1 en WCAG 2.
    expect(autoFix('#3b82f6', '#808080', 'wcag2', 10)).toBeNull()
  })

  it('es determinista', () => {
    expect(autoFix('#9ca3af', '#ffffff', 'wcag2', 4.5)).toBe(
      autoFix('#9ca3af', '#ffffff', 'wcag2', 4.5),
    )
  })
})
