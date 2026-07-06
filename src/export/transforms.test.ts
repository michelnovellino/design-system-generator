/**
 * Tests de las transforms DTCG → targets.
 */
import { describe, expect, it } from 'vitest'
import {
  TARGET_FILES,
  toCssVars,
  toDtcgJson,
  toTailwindConfig,
  transformTokens,
} from './transforms'
import { buildTokens, type TokenSources } from './dtcg'
import { generateScale } from '@/engines/color'
import {
  DEFAULT_SPACING_MULTIPLIERS,
  generateSpacingScale,
  generateTypeScale,
} from '@/engines/typography'

function tree() {
  const src: TokenSources = {
    brand: generateScale('#3b82f6', 'brand'),
    spacing: generateSpacingScale({ basePx: 4, multipliers: [...DEFAULT_SPACING_MULTIPLIERS] }),
    type: generateTypeScale({
      minBasePx: 16,
      maxBasePx: 18,
      minRatio: 1.2,
      maxRatio: 1.25,
      positiveSteps: 5,
      negativeSteps: 2,
      minViewportPx: 360,
      maxViewportPx: 1280,
    }),
  }
  return buildTokens(src)
}

describe('toCssVars', () => {
  const css = toCssVars(tree())

  it('emite un bloque :root', () => {
    expect(css).toMatch(/^:root \{/)
    expect(css.trimEnd()).toMatch(/\}$/)
  })

  it('primitivo: --color-brand-500 con el HEX bruto', () => {
    expect(css).toContain('--color-brand-500: #3b82f6;')
  })

  it('alias: --color-primary referencia var(--color-brand-500), no el valor', () => {
    expect(css).toContain('--color-primary: var(--color-brand-500);')
  })

  it('componente encadena: --button-primary-background → var(--color-primary)', () => {
    expect(css).toContain('--button-primary-background: var(--color-primary);')
  })

  it('espaciado en rem, nombres saneados', () => {
    expect(css).toContain('--spacing-0-5: 0.125rem;')
    expect(css).toContain('--spacing-4: 1rem;')
  })
})

describe('toTailwindConfig', () => {
  const cfg = toTailwindConfig(tree())

  it('exporta un config con theme.extend', () => {
    expect(cfg).toContain('export default {')
    expect(cfg).toContain('theme: {')
    expect(cfg).toContain('extend:')
  })

  it('resuelve alias a valores concretos (no {refs} ni var())', () => {
    expect(cfg).not.toMatch(/\{color\./)
    expect(cfg).not.toContain('var(--')
    // primary resuelto al hex del 500
    expect(cfg).toMatch(/primary:\s*"#3b82f6"/)
  })

  it('anida la escala de marca con claves numéricas entrecomilladas', () => {
    expect(cfg).toMatch(/brand:\s*\{/)
    expect(cfg).toMatch(/"500":\s*"#3b82f6"/)
  })

  it('es JS evaluable: theme.extend.colors.primary resuelve al hex', async () => {
    // Import dinámico del data-URL del módulo generado.
    const mod = await import(
      /* @vite-ignore */ `data:text/javascript,${encodeURIComponent(cfg)}`
    )
    expect(mod.default.theme.extend.colors.primary).toBe('#3b82f6')
    expect(mod.default.theme.extend.colors.brand['500']).toBe('#3b82f6')
    expect(mod.default.theme.extend.spacing['4']).toBe('1rem')
  })
})

describe('toDtcgJson', () => {
  const json = toDtcgJson(tree())

  it('es JSON válido y conserva los alias como {refs}', () => {
    const parsed = JSON.parse(json)
    expect(parsed.color.primary.$value).toBe('{color.brand.500}')
    expect(parsed.color.brand['500'].$value).toBe('#3b82f6')
    expect(parsed.color.brand['500'].$type).toBe('color')
  })
})

describe('transformTokens', () => {
  it('genera un archivo por target en su ruta canónica', () => {
    const files = transformTokens(tree(), ['css-vars', 'tailwind', 'dtcg-json'])
    expect(Object.keys(files).sort()).toEqual(
      [TARGET_FILES['css-vars'], TARGET_FILES.tailwind, TARGET_FILES['dtcg-json']].sort(),
    )
    for (const content of Object.values(files)) {
      expect(content.length).toBeGreaterThan(0)
    }
  })

  it('respeta el subconjunto de targets pedido', () => {
    const files = transformTokens(tree(), ['css-vars'])
    expect(Object.keys(files)).toEqual([TARGET_FILES['css-vars']])
  })
})
