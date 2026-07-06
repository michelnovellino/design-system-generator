<script setup lang="ts">
// Panel de simulación de daltonismo (PLAN §10, paso 7).
// Muestra la escala tonal de la marca vista bajo cada deficiencia de visión
// del color, aplicando filtros SVG feColorMatrix (GPU) — nunca Canvas.
// Las matrices vienen del motor engines/cvd (fuente única de los valores).
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTokensStore } from '@/stores/tokens'
import { generateScale } from '@/engines/color'
import { CVD_TYPES, cvdFilterId, cvdMatrix } from '@/engines/cvd'
import type { CvdType } from '@/types'
import { t, type TranslationKey } from '@/i18n'

const store = useTokensStore()
const { brandHex } = storeToRefs(store)

const scale = computed(() => generateScale(brandHex.value, 'brand'))

/** Filas: visión normal (sin filtro) + una por cada tipo de CVD. */
const rows = computed<{ type: CvdType | null; name: string; desc: string }[]>(() => [
  { type: null, name: t('cvd_normal'), desc: '' },
  ...CVD_TYPES.map((type) => ({
    type,
    name: t(`cvd_${type}` as TranslationKey),
    desc: t(`cvd_${type}_desc` as TranslationKey),
  })),
])

function filterStyle(type: CvdType | null) {
  return type ? { filter: `url(#${cvdFilterId(type)})` } : {}
}
</script>

<template>
  <section class="cvd" :aria-label="t('cvd_heading')">
    <div class="head">
      <h2 class="heading">{{ t('cvd_heading') }}</h2>
      <p class="intro">{{ t('cvd_intro') }}</p>
    </div>

    <!-- Filtros SVG ocultos: los valores salen del motor CVD. -->
    <svg class="cvd-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter
          v-for="type in CVD_TYPES"
          :key="type"
          :id="cvdFilterId(type)"
          color-interpolation-filters="linearRGB"
        >
          <feColorMatrix type="matrix" :values="cvdMatrix(type).join(' ')" />
        </filter>
      </defs>
    </svg>

    <div class="rows">
      <div v-for="row in rows" :key="row.name" class="cvd-row">
        <div class="cvd-meta">
          <span class="cvd-name mono">{{ row.name }}</span>
          <span v-if="row.desc" class="cvd-desc">{{ row.desc }}</span>
        </div>
        <div class="cvd-scale" :style="filterStyle(row.type)">
          <span
            v-for="s in scale.steps"
            :key="s.step"
            class="cvd-swatch"
            :style="{ background: s.hex }"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cvd {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 1px solid var(--border);
  padding-top: var(--space-3);
}

.head {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.heading {
  font-size: 1.15rem;
  color: var(--text-strong);
  margin: 0;
  letter-spacing: -0.01em;
}

.intro {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 60ch;
}

/* El SVG de defs no debe ocupar espacio ni renderizar nada. */
.cvd-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cvd-row {
  display: grid;
  grid-template-columns: 11rem 1fr;
  gap: var(--space-2);
  align-items: center;
}

.cvd-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.cvd-name {
  font-size: 0.8rem;
  color: var(--text-strong);
}

.cvd-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.cvd-scale {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 2px;
  border-radius: calc(var(--radius) - 5px);
  overflow: hidden;
}

.cvd-swatch {
  height: 2rem;
}

@media (max-width: 560px) {
  .cvd-row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
  .cvd-swatch {
    height: 1.5rem;
  }
}
</style>
