/**
 * Tests del pipeline de exportación: empaquetado zip y buildExport.
 * Se carga el zip de vuelta con JSZip para verificar rutas y contenido.
 */
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { buildExport, packageZip } from './index'
import type { TokenSources } from './dtcg'
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

describe('packageZip', () => {
  it('produce un Blob que JSZip puede releer con los archivos dados', async () => {
    const blob = await packageZip({ 'a/b.txt': 'hola', 'c.json': '{}' })
    expect(blob).toBeInstanceOf(Blob)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(await zip.file('a/b.txt')!.async('string')).toBe('hola')
    expect(await zip.file('c.json')!.async('string')).toBe('{}')
  })
})

describe('buildExport', () => {
  it('empaqueta los 3 targets + README y no reporta errores de validación', async () => {
    const { blob, errors, files } = await buildExport(sources(), [
      'css-vars',
      'tailwind',
      'dtcg-json',
    ])
    expect(errors).toEqual([])
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const names = Object.keys(zip.files)
    expect(names).toContain('css/variables.css')
    expect(names).toContain('tailwind/tailwind.config.js')
    expect(names).toContain('tokens/tokens.json')
    expect(names).toContain('README.md')

    // El CSS del zip coincide con el generado y contiene un token real.
    const css = await zip.file('css/variables.css')!.async('string')
    expect(css).toBe(files['css/variables.css'])
    expect(css).toContain('--color-brand-500: #3b82f6;')
  })

  it('solo incluye los targets pedidos', async () => {
    const { blob } = await buildExport(sources(), ['dtcg-json'])
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const names = Object.keys(zip.files)
    expect(names).toContain('tokens/tokens.json')
    expect(names).not.toContain('css/variables.css')
  })
})
