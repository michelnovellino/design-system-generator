/**
 * Declaraciones ambient para los paquetes oficiales de Myndex, que no
 * publican tipos ni existen en DefinitelyTyped. Solo se declara la
 * superficie que usamos (ver ADR-003: paquetes oficiales sin modificar).
 *
 * Convención de ambos paquetes: el primer argumento/luminancia es SIEMPRE
 * el TEXTO y el segundo el FONDO (sensibles a polaridad).
 */

declare module 'apca-w3' {
  /** Luminancia Y estimada desde sRGB. `rgb` = [r, g, b] en 0–255. */
  export function sRGBtoY(rgb: number[]): number
  /** Contraste APCA (Lc con signo: positivo = texto oscuro sobre fondo claro). */
  export function APCAcontrast(textY: number, backgroundY: number, places?: number): number
  /**
   * Tabla de fuentes APCA para un Lc dado: [lc, ...tamaño mínimo en px
   * para los pesos 100..900]. Valores 777/999 = uso no permitido.
   */
  export function fontLookupAPCA(contrast: number, places?: number): number[]
}

declare module 'bridge-pca' {
  /** Luminancia Y estimada desde sRGB. `rgb` = [r, g, b] en 0–255. */
  export function sRGBtoY(rgb: number[]): number
  /** Contraste Bridge PCA (Lc con signo, misma convención que APCA). */
  export function BPCAcontrast(textY: number, backgroundY: number, places?: number): number
  /**
   * Convierte un Lc de Bridge PCA al ratio "WCAG compatible" perceptual.
   * Devuelve un string tipo "4.5 to 1". NO es el cálculo literal de WCAG 2.
   */
  export function bridgeRatio(
    contrastLc: number,
    txtY: number,
    bgY: number,
    ratioStr?: string,
    places?: number,
  ): string
}
