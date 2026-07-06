/**
 * Motor de simulación de daltonismo (CVD).
 * Genera las matrices feColorMatrix para filtros SVG, delegando el cálculo
 * a la GPU en vez de manipular píxeles en Canvas (que bloquearía el hilo).
 *
 * Modelo: Machado, Oliveira & Fernandes (2009), severidad 1.0 (dicromacia
 * completa) para proto/deutero/tritanopía. Acromatopsia por luma Rec. 709.
 *
 * Espacio de color: las matrices de Machado están derivadas en RGB LINEAL,
 * por eso los filtros declaran color-interpolation-filters="linearRGB" (que
 * además es el valor por defecto de SVG). Los coeficientes de luma Rec. 709
 * también se definen sobre RGB lineal, así que todo es consistente.
 * Ver docs/DECISIONS.md ADR-008.
 */
import type { CvdType } from '@/types'

/** Prefijo de los `id` de filtro inyectados en el DOM. */
export const CVD_FILTER_PREFIX = 'cvd-'

/** Todos los tipos de CVD soportados, en orden de presentación. */
export const CVD_TYPES: readonly CvdType[] = [
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
] as const

/**
 * Matrices 3×3 (fila-mayor) que mapean RGB→RGB simulando cada deficiencia.
 * Cada fila suma ≈1, de modo que el blanco permanece blanco.
 */
const CVD_3X3: Record<CvdType, readonly number[]> = {
  // Machado et al. 2009, severidad 1.0
  protanopia: [
    0.152286, 1.052583, -0.204868,
    0.114503, 0.786281, 0.099216,
    -0.003882, -0.048116, 1.051998,
  ],
  deuteranopia: [
    0.367322, 0.860646, -0.227968,
    0.280085, 0.672501, 0.047413,
    -0.01182, 0.04294, 0.968881,
  ],
  tritanopia: [
    1.255528, -0.076749, -0.178779,
    -0.078411, 0.930809, 0.147602,
    0.004733, 0.691367, 0.3039,
  ],
  // Acromatopsia: luminancia Rec. 709 replicada en los tres canales.
  achromatopsia: [
    0.2126, 0.7152, 0.0722,
    0.2126, 0.7152, 0.0722,
    0.2126, 0.7152, 0.0722,
  ],
}

/**
 * Devuelve los 20 valores (matriz 4×5) para <feColorMatrix type="matrix">
 * correspondientes al tipo de deficiencia dado. Las filas son R, G, B, A;
 * cada una lleva [·R, ·G, ·B, ·A, offset]. El canal alfa queda intacto.
 */
export function cvdMatrix(type: CvdType): number[] {
  const m = CVD_3X3[type]
  return [
    m[0]!, m[1]!, m[2]!, 0, 0,
    m[3]!, m[4]!, m[5]!, 0, 0,
    m[6]!, m[7]!, m[8]!, 0, 0,
    0, 0, 0, 1, 0,
  ]
}

/** `id` del filtro SVG para un tipo dado (p. ej. "cvd-protanopia"). */
export function cvdFilterId(type: CvdType): string {
  return `${CVD_FILTER_PREFIX}${type}`
}

/** Devuelve el bloque SVG <filter> completo listo para inyectar en el DOM. */
export function cvdFilterSvg(type: CvdType): string {
  const values = cvdMatrix(type).join(' ')
  return (
    `<filter id="${cvdFilterId(type)}" color-interpolation-filters="linearRGB">` +
    `<feColorMatrix type="matrix" values="${values}"/>` +
    `</filter>`
  )
}

/** SVG oculto con TODOS los filtros CVD, para inyectar una sola vez. */
export function cvdFiltersSvg(): string {
  const filters = CVD_TYPES.map(cvdFilterSvg).join('')
  return (
    `<svg aria-hidden="true" focusable="false" ` +
    `style="position:absolute;width:0;height:0;overflow:hidden">` +
    `<defs>${filters}</defs></svg>`
  )
}
