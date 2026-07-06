/**
 * Store central de tokens de diseño — la "única fuente de verdad".
 * Todo el estado del sistema de diseño que el usuario construye vive aquí,
 * en una forma alineable con DTCG. Los engines operan sobre estos datos.
 *
 * STUB: estructura mínima; se expande al implementar cada engine.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ContrastMode } from '@/types'

export const useTokensStore = defineStore('tokens', () => {
  /** Color base de marca introducido por el usuario (HEX). */
  const brandHex = ref<string>('#3b82f6')

  /** Modo de contraste activo. Bridge PCA es el default (ver ADR-003). */
  const contrastMode = ref<ContrastMode>('bridge')

  function setBrand(hex: string) {
    brandHex.value = hex
  }

  function setContrastMode(mode: ContrastMode) {
    contrastMode.value = mode
  }

  return { brandHex, contrastMode, setBrand, setContrastMode }
})
