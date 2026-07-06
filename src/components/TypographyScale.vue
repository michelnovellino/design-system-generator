<script setup lang="ts">
// Panel de tipografía y espaciado fluido (PLAN §10, paso 6).
// Controles de escala → previsualización en vivo de cada peldaño con su
// clamp() real aplicado, más la escala de espaciado en rem.
// La matemática vive en engines/typography.
import { computed, reactive, ref } from 'vue'
import {
  DEFAULT_SPACING_MULTIPLIERS,
  generateSpacingScale,
  generateTypeScale,
  type ScaleConfig,
} from '@/engines/typography'
import { t } from '@/i18n'

const RATIOS = computed(() => [
  { name: t('ratio_minor_second'), value: 1.067 },
  { name: t('ratio_major_second'), value: 1.125 },
  { name: t('ratio_minor_third'), value: 1.2 },
  { name: t('ratio_major_third'), value: 1.25 },
  { name: t('ratio_perfect_fourth'), value: 1.333 },
  { name: t('ratio_golden'), value: 1.618 },
])

const cfg = reactive<ScaleConfig>({
  minBasePx: 16,
  maxBasePx: 18,
  minRatio: 1.2,
  maxRatio: 1.25,
  positiveSteps: 5,
  negativeSteps: 2,
  minViewportPx: 360,
  maxViewportPx: 1280,
})

const typeScale = computed(() => generateTypeScale(cfg))
const spacing = computed(() =>
  generateSpacingScale({ basePx: 4, multipliers: [...DEFAULT_SPACING_MULTIPLIERS] }),
)

const copied = ref<string | null>(null)
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = text
    setTimeout(() => {
      if (copied.value === text) copied.value = null
    }, 1200)
  } catch {
    /* portapapeles no disponible */
  }
}
</script>

<template>
  <section class="typo" :aria-label="t('typo_heading')">
    <h2 class="heading">{{ t('typo_heading') }}</h2>

    <div class="controls">
      <label class="ctl">
        <span class="caption mono">{{ t('label_ratio_min') }}</span>
        <select v-model.number="cfg.minRatio" class="select mono">
          <option v-for="r in RATIOS" :key="'min' + r.value" :value="r.value">
            {{ r.name }} · {{ r.value }}
          </option>
        </select>
      </label>
      <label class="ctl">
        <span class="caption mono">{{ t('label_ratio_max') }}</span>
        <select v-model.number="cfg.maxRatio" class="select mono">
          <option v-for="r in RATIOS" :key="'max' + r.value" :value="r.value">
            {{ r.name }} · {{ r.value }}
          </option>
        </select>
      </label>
      <label class="ctl narrow">
        <span class="caption mono">{{ t('label_body_min') }}</span>
        <input v-model.number="cfg.minBasePx" type="number" min="10" max="28" class="num mono" />
      </label>
      <label class="ctl narrow">
        <span class="caption mono">{{ t('label_body_max') }}</span>
        <input v-model.number="cfg.maxBasePx" type="number" min="10" max="32" class="num mono" />
      </label>
      <label class="ctl narrow">
        <span class="caption mono">{{ t('label_titulares') }}</span>
        <input v-model.number="cfg.positiveSteps" type="number" min="1" max="8" class="num mono" />
      </label>
    </div>

    <div class="samples">
      <button
        v-for="s in typeScale"
        :key="s.label"
        class="sample"
        :style="{ fontSize: s.clamp }"
        :title="t('copy_clamp', { step: s.label })"
        @click="copy(s.clamp)"
      >
        <span class="sample-label mono">{{ s.label }}</span>
        <span class="sample-text">{{ t('sample_text_typo') }}</span>
        <span class="sample-clamp mono">{{ copied === s.clamp ? t('copied_exclamation') : s.clamp }}</span>
      </button>
    </div>

    <h2 class="heading">{{ t('spacing_heading') }}</h2>
    <div class="spacing" role="list">
      <button
        v-for="sp in spacing"
        :key="sp.label"
        role="listitem"
        class="space-row"
        :title="t('copy_spacing', { rem: sp.rem })"
        @click="copy(`${sp.rem}rem`)"
      >
        <span class="space-token mono">{{ sp.label }}</span>
        <span class="space-bar" :style="{ width: `${Math.max(sp.px, 1)}px` }"></span>
        <span class="space-val mono">{{ copied === `${sp.rem}rem` ? t('copied') : sp.rem + 'rem' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.typo {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 1px solid var(--border);
  padding-top: var(--space-3);
}

.heading {
  font-size: 1.15rem;
  color: var(--text-strong);
  margin: 0;
  letter-spacing: -0.01em;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.ctl {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.caption {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.select,
.num {
  height: 2.2rem;
  padding: 0 0.6rem;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 4px);
  background: var(--surface-1);
  color: var(--text-strong);
  font-size: 0.82rem;
}
.num {
  width: 5.5rem;
}
.select:focus-visible,
.num:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.samples {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sample {
  appearance: none;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 0;
  cursor: pointer;
  text-align: left;
  color: var(--text-strong);
  display: grid;
  grid-template-columns: 3.5rem 1fr auto;
  align-items: baseline;
  gap: var(--space-2);
  line-height: 1.1;
}

.sample-label {
  font-size: 0.7rem;
  color: var(--accent);
}
.sample-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sample-clamp {
  font-size: 0.68rem;
  color: var(--text-muted);
  align-self: center;
}

.spacing {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.space-row {
  appearance: none;
  background: transparent;
  border: none;
  cursor: pointer;
  display: grid;
  grid-template-columns: 3rem 1fr 5rem;
  align-items: center;
  gap: var(--space-2);
  padding: 0.25rem 0;
}
.space-row:hover .space-bar {
  background: var(--accent-strong);
}

.space-token {
  font-size: 0.75rem;
  color: var(--text);
  text-align: right;
}
.space-bar {
  height: 0.85rem;
  background: var(--accent);
  border-radius: 3px;
  max-width: 100%;
}
.space-val {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-align: right;
}

@media (max-width: 560px) {
  .sample {
    grid-template-columns: 3rem 1fr;
  }
  .sample-clamp {
    grid-column: 1 / -1;
  }
}
</style>
