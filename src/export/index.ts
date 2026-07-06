/**
 * Capa de exportación.
 * Toma el árbol de tokens DTCG y produce archivos por target, luego los
 * empaqueta en un .zip con JSZip (en un Web Worker para no congelar la UI).
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ TODO / DECISIÓN DE ARQUITECTURA — Style Dictionary                    │
 * │                                                                       │
 * │ Usamos transforms PROPIAS en TypeScript (CSS vars, Tailwind config,   │
 * │ tokens.json DTCG). NO integramos Style Dictionary por ahora.          │
 * │                                                                       │
 * │ Razón: su port a navegador es no oficial y añade riesgo de            │
 * │ mantenimiento. Para 3-4 targets, transforms propias son más simples   │
 * │ y con menos dependencias frágiles.                                    │
 * │                                                                       │
 * │ Es un "good to have" a futuro SOLO si el alcance crece a muchos       │
 * │ targets (iOS/Swift, Android/Compose, SCSS, RN, Flutter...).           │
 * │                                                                       │
 * │ El razonamiento completo, el tradeoff aceptado y los PASOS para       │
 * │ integrarlo más adelante están en:  docs/DECISIONS.md  → ADR-004       │
 * │ No re-litigar esta decisión sin leer ese ADR primero.                 │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * STUB: firmas definidas; implementación pendiente.
 */

/** Targets de exportación soportados (transforms propias). */
export type ExportTarget = 'css-vars' | 'tailwind' | 'dtcg-json'

/** Transforma el árbol DTCG a los archivos de texto de cada target. */
export function transformTokens(
  _dtcg: Record<string, unknown>,
  _targets: ExportTarget[],
): Record<string, string> {
  throw new Error('not implemented')
}

/** Empaqueta el mapa de archivos en un Blob .zip (usa JSZip). */
export async function packageZip(_files: Record<string, string>): Promise<Blob> {
  throw new Error('not implemented')
}
