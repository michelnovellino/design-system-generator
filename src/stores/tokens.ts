/**
 * Store central de tokens de diseño — la "única fuente de verdad" (PLAN §5, §8).
 * Reúne las decisiones de diseño del usuario (color de marca, escala
 * tipográfica, espaciado) y deriva de ellas el árbol DTCG que consume la
 * capa de exportación. Los engines calculan; el store compone.
 */
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type { ContrastMode } from '@/types'
import { generateScale } from '@/engines/color'
import {
  DEFAULT_SPACING_MULTIPLIERS,
  generateSpacingScale,
  generateTypeScale,
  type ScaleConfig,
} from '@/engines/typography'
import { buildTokens, validate } from '@/export/dtcg'

export const useTokensStore = defineStore('tokens', () => {
  /** Color base de marca introducido por el usuario (HEX). */
  const brandHex = ref<string>('#3b82f6')

  /** Modo de contraste activo. Bridge PCA es el default (ver ADR-003). */
  const contrastMode = ref<ContrastMode>('bridge')

  /** Configuración de la escala tipográfica fluida (editable en la UI). */
  const typeConfig = reactive<ScaleConfig>({
    minBasePx: 16,
    maxBasePx: 18,
    minRatio: 1.2,
    maxRatio: 1.25,
    positiveSteps: 5,
    negativeSteps: 2,
    minViewportPx: 360,
    maxViewportPx: 1280,
  })

  /** Unidad base del espaciado en px (multiplicadores estilo Tailwind). */
  const spacingBasePx = ref<number>(4)

  function setBrand(hex: string) {
    brandHex.value = hex
  }

  function setContrastMode(mode: ContrastMode) {
    contrastMode.value = mode
  }

  // ── Escalas derivadas (los engines calculan sobre el estado del store) ──
  const brandScale = computed(() => generateScale(brandHex.value, 'brand'))
  const spacingScale = computed(() =>
    generateSpacingScale({
      basePx: spacingBasePx.value,
      multipliers: [...DEFAULT_SPACING_MULTIPLIERS],
    }),
  )
  const typeScale = computed(() => generateTypeScale(typeConfig))

  /** Árbol DTCG completo (primitivos + semánticos + componente). */
  const tokenTree = computed(() =>
    buildTokens({
      brand: brandScale.value,
      spacing: spacingScale.value,
      type: typeScale.value,
    }),
  )

  /** Errores de consistencia del árbol (alias colgantes / ciclos). */
  const validationErrors = computed(() => validate(tokenTree.value))

  return {
    brandHex,
    contrastMode,
    typeConfig,
    spacingBasePx,
    setBrand,
    setContrastMode,
    brandScale,
    spacingScale,
    typeScale,
    tokenTree,
    validationErrors,
  }
})
