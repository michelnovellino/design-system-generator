/**
 * Motor de simulación de daltonismo (CVD).
 * Genera las matrices feColorMatrix para filtros SVG, delegando el cálculo
 * a la GPU en vez de manipular píxeles en Canvas (que bloquearía el hilo).
 *
 * Modelo: Machado, Oliveira & Fernandes (o Brettel-Viénot).
 *
 * STUB: firmas definidas; implementación pendiente.
 */
import type { CvdType } from '@/types'

/**
 * Devuelve los 20 valores (matriz 4x5) para <feColorMatrix type="matrix">
 * correspondientes al tipo de deficiencia dado.
 */
export function cvdMatrix(_type: CvdType): number[] {
  throw new Error('not implemented')
}

/** Devuelve el bloque SVG <filter> completo listo para inyectar en el DOM. */
export function cvdFilterSvg(_type: CvdType): string {
  throw new Error('not implemented')
}
