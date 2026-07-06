/**
 * Capa de exportación.
 * Toma el árbol de tokens DTCG y produce archivos por target, luego los
 * empaqueta en un .zip con JSZip.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ ARQUITECTURA — Style Dictionary                                       │
 * │ Usamos transforms PROPIAS en TypeScript (css-vars, tailwind,          │
 * │ dtcg-json). NO integramos Style Dictionary. Razón y pasos futuros:    │
 * │ docs/DECISIONS.md → ADR-004. No re-litigar sin leer ese ADR.          │
 * │                                                                       │
 * │ WEB WORKER: el PLAN §7 sugería empaquetar en un Web Worker. Para el   │
 * │ volumen real (unos cientos de tokens, <20 KB de texto) el empaquetado │
 * │ tarda <10 ms, así que se hace síncrono. El worker queda diferido como │
 * │ optimización futura. Ver ADR-010.                                     │
 * └─────────────────────────────────────────────────────────────────────┘
 */
import JSZip from 'jszip'
import { buildTokens, validate, type TokenSources, type ValidationError } from './dtcg'
import { transformTokens, type ExportTarget } from './transforms'

export * from './dtcg'
export * from './transforms'

/** README incluido en el zip, explicando el contenido. */
function readme(targets: ExportTarget[]): string {
  const lines = [
    '# Design tokens',
    '',
    'Generado por Design System Generator (100% en el navegador, determinista).',
    '',
    'Contenido:',
  ]
  if (targets.includes('css-vars')) lines.push('- `css/variables.css` — variables CSS nativas.')
  if (targets.includes('tailwind')) lines.push('- `tailwind/tailwind.config.js` — config de Tailwind.')
  if (targets.includes('dtcg-json')) lines.push('- `tokens/tokens.json` — tokens en formato DTCG (fuente de verdad).')
  lines.push('')
  return lines.join('\n')
}

/** Empaqueta el mapa { ruta → contenido } en un Blob .zip (usa JSZip). */
export async function packageZip(files: Record<string, string>): Promise<Blob> {
  const zip = new JSZip()
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content)
  }
  return zip.generateAsync({ type: 'blob' })
}

export interface ExportResult {
  blob: Blob
  files: Record<string, string>
  errors: ValidationError[]
}

/**
 * Pipeline completo: construye el árbol DTCG desde las escalas, lo valida,
 * lo transforma a los targets pedidos y empaqueta el zip. Los errores de
 * validación se devuelven (no bloquean la exportación, se informan en UI).
 */
export async function buildExport(
  sources: TokenSources,
  targets: ExportTarget[],
): Promise<ExportResult> {
  const tree = buildTokens(sources)
  const errors = validate(tree)
  const files = transformTokens(tree, targets)
  files['README.md'] = readme(targets)
  const blob = await packageZip(files)
  return { blob, files, errors }
}
