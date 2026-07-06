/**
 * Tests del modelo de tokens DTCG: construcción del árbol de 3 niveles,
 * resolución de alias y detección de alias colgantes / circulares.
 */
import { describe, expect, it } from 'vitest'
import {
  buildTokens,
  flatten,
  isAlias,
  isToken,
  materialize,
  resolveValue,
  tokenAt,
  validate,
  type DtcgGroup,
  type TokenSources,
} from './dtcg'
import { generateScale } from '@/engines/color'
import {
  DEFAULT_SPACING_MULTIPLIERS,
  generateSpacingScale,
  generateTypeScale,
} from '@/engines/typography'

function sources(): TokenSources {
  return {
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
}

describe('helpers', () => {
  it('isAlias reconoce {refs} y descarta valores brutos', () => {
    expect(isAlias('{color.brand.500}')).toBe(true)
    expect(isAlias('#3b82f6')).toBe(false)
    expect(isAlias('1rem')).toBe(false)
    expect(isAlias('{}')).toBe(false)
  })

  it('isToken distingue hoja de grupo', () => {
    expect(isToken({ $value: '#fff' })).toBe(true)
    expect(isToken({ brand: { $value: '#fff' } } as DtcgGroup)).toBe(false)
  })
})

describe('buildTokens', () => {
  const tree = buildTokens(sources())

  it('primitivos: color.brand.500 lleva el HEX del color base', () => {
    expect(tokenAt(tree, ['color', 'brand', '500'])?.$value).toBe('#3b82f6')
  })

  it('los 11 peldaños de marca están presentes', () => {
    const brand = tree.color as DtcgGroup
    const steps = Object.keys(brand.brand as DtcgGroup).filter((k) => !k.startsWith('$'))
    expect(steps).toHaveLength(11)
  })

  it('semánticos son alias a primitivos', () => {
    expect(tokenAt(tree, ['color', 'primary'])?.$value).toBe('{color.brand.500}')
    expect(tokenAt(tree, ['color', 'background'])?.$value).toBe('{color.brand.50}')
  })

  it('componente encadena alias → semántico → primitivo', () => {
    expect(tokenAt(tree, ['button', 'primary', 'background'])?.$value).toBe('{color.primary}')
    // resolución completa de la cadena
    expect(resolveValue(tree, '{button.primary.background}')).toBe('#3b82f6')
  })

  it('saneado de nombres: spacing "0.5" → "0-5" (sin puntos, DTCG-válido)', () => {
    expect(tokenAt(tree, ['spacing', '0-5'])?.$value).toBe('0.125rem')
    // no debe existir un nombre con punto
    expect(flatten(tree).some((f) => f.path.some((p) => p.includes('.')))).toBe(false)
  })

  it('font-size guarda el clamp() como valor', () => {
    const body = tokenAt(tree, ['font-size', 'body'])
    expect(body?.$value).toMatch(/^clamp\(|rem$/)
  })
})

describe('resolveValue', () => {
  const tree = buildTokens(sources())

  it('devuelve valores brutos tal cual', () => {
    expect(resolveValue(tree, '#abcdef')).toBe('#abcdef')
  })

  it('sigue la cadena de alias hasta el valor bruto', () => {
    expect(resolveValue(tree, '{color.primary-hover}')).toBe(
      tokenAt(tree, ['color', 'brand', '600'])?.$value,
    )
  })

  it('lanza en alias colgante', () => {
    expect(() => resolveValue(tree, '{color.nope}')).toThrow(/colgante/)
  })
})

describe('validate', () => {
  it('un árbol bien formado no tiene errores', () => {
    expect(validate(buildTokens(sources()))).toEqual([])
  })

  it('detecta un alias colgante', () => {
    const tree: DtcgGroup = {
      color: { roto: { $value: '{color.inexistente}', $type: 'color' } },
    }
    const errors = validate(tree)
    expect(errors).toHaveLength(1)
    expect(errors[0]!.path).toEqual(['color', 'roto'])
    expect(errors[0]!.message).toMatch(/colgante/)
  })

  it('detecta un ciclo A → B → A', () => {
    const tree: DtcgGroup = {
      a: { $value: '{b}', $type: 'color' },
      b: { $value: '{a}', $type: 'color' },
    }
    const errors = validate(tree)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((e) => /circular/.test(e.message))).toBe(true)
  })
})

describe('materialize', () => {
  const tree = buildTokens(sources())

  it('resuelve todos los alias de un grupo a valores brutos', () => {
    const color = materialize(tree, tree.color as DtcgGroup)
    expect((color.primary as string)).toBe('#3b82f6')
    expect((color.brand as Record<string, string>)['500']).toBe('#3b82f6')
  })

  it('conserva el anidamiento del grupo', () => {
    const materialized = materialize(tree, buildTokens(sources()))
    const button = materialized.button as Record<string, Record<string, string>>
    expect(button.primary!.background).toBe('#3b82f6')
  })
})
