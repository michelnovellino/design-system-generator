<script setup lang="ts">
// Panel de contraste (PLAN §10, paso 4-5): texto + fondo → evaluación en
// los 3 modos (WCAG 2 / Bridge PCA / APCA) con auto-fix.
// La matemática vive en engines/contrast; aquí solo se presenta.
//
// Requisitos de licencia visibles aquí (ADR-003):
//  - Enlace "Why APCA" cerca del output de Lc.
//  - Aclaración de que el ratio de Bridge NO es el cálculo literal WCAG 2.
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTokensStore } from '@/stores/tokens'
import { apca, autoFix, bridge, wcag2 } from '@/engines/contrast'
import type { ContrastMode } from '@/types'
import { t } from '@/i18n'

const store = useTokensStore()
const { contrastMode } = storeToRefs(store)

/** Polaridad fija: primero TEXTO, segundo FONDO (APCA/Bridge la exigen). */
const textHex = ref('#767676')
const bgHex = ref('#ffffff')

const modes: { id: ContrastMode; name: string }[] = [
  { id: 'wcag2', name: 'WCAG 2' },
  { id: 'bridge', name: 'Bridge PCA' },
  { id: 'apca', name: 'APCA' },
]

const result = computed(() => {
  switch (contrastMode.value) {
    case 'wcag2':
      return wcag2(textHex.value, bgHex.value)
    case 'bridge':
      return bridge(textHex.value, bgHex.value)
    case 'apca':
      return apca(textHex.value, bgHex.value)
    default:
      return bridge(textHex.value, bgHex.value)
  }
})

/** Objetivo por defecto (texto de cuerpo) en la métrica de cada modo. */
const target = computed(() => (contrastMode.value === 'apca' ? 75 : 4.5))

const fixedHex = computed(() =>
  result.value.passes
    ? null
    : autoFix(textHex.value, bgHex.value, contrastMode.value, target.value),
)

function applyFix() {
  if (fixedHex.value) textHex.value = fixedHex.value
}

function swap() {
  ;[textHex.value, bgHex.value] = [bgHex.value, textHex.value]
}
</script>

<template>
  <section class="contrast" :aria-label="t('contrast_heading')">
    <div class="head">
      <h2 class="heading">{{ t('contrast_heading') }}</h2>
      <div class="modes" role="radiogroup" :aria-label="t('contrast_heading')">
        <button
          v-for="m in modes"
          :key="m.id"
          role="radio"
          :aria-checked="contrastMode === m.id"
          class="mode mono"
          :class="{ active: contrastMode === m.id }"
          @click="store.setContrastMode(m.id)"
        >
          {{ m.name }}
        </button>
      </div>
    </div>

    <div class="lab">
      <div class="inputs">
        <label class="swatch-input">
          <span class="caption mono">{{ t('contrast_label_text') }}</span>
          <input v-model="textHex" type="color" class="picker" :aria-label="t('contrast_picker_text')" />
          <span class="mono hexval">{{ textHex }}</span>
        </label>
        <button class="swap mono" :title="t('contrast_swap')" @click="swap">⇅</button>
        <label class="swatch-input">
          <span class="caption mono">{{ t('contrast_label_bg') }}</span>
          <input v-model="bgHex" type="color" class="picker" :aria-label="t('contrast_picker_bg')" />
          <span class="mono hexval">{{ bgHex }}</span>
        </label>
      </div>

      <div class="preview" :style="{ background: bgHex, color: textHex }">
        <p class="preview-body">{{ t('pangram') }}</p>
        <p class="preview-small">{{ t('preview_small') }}</p>
      </div>

      <div class="verdict" :class="result.passes ? 'ok' : 'ko'">
        <div class="metric">
          <template v-if="result.lc !== undefined">
            <span class="metric-value mono">Lc {{ result.lc.toFixed(1) }}</span>
            <a
              class="why mono"
              href="https://git.apcacontrast.com/documentation/WhyAPCA"
              target="_blank"
              rel="noopener"
              >Why APCA</a
            >
          </template>
          <span v-if="result.ratio !== undefined" class="metric-ratio mono">
            {{ result.ratio.toFixed(2) }}:1
          </span>
        </div>
        <span class="label">{{ result.label }}</span>
        <span class="badge mono">{{ result.passes ? t('contrast_passes') : t('contrast_fails') }}</span>
      </div>

      <p v-if="contrastMode === 'bridge'" class="note mono">
        {{ t('contrast_bridge_note') }}
      </p>

      <div v-if="!result.passes" class="fix">
        <template v-if="fixedHex">
          <span class="note mono">
            {{ t('autofix_text') }}
            <span class="fix-chip mono" :style="{ background: fixedHex, color: bgHex }">{{
              fixedHex
            }}</span>
          </span>
          <button class="fix-btn mono" @click="applyFix">{{ t('autofix_btn') }}</button>
        </template>
        <span v-else class="note mono">
          {{ t('autofix_impossible') }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contrast {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border-top: 1px solid var(--border);
  padding-top: var(--space-3);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.heading {
  font-size: 1.15rem;
  color: var(--text-strong);
  margin: 0;
  letter-spacing: -0.01em;
}

.modes {
  display: flex;
  gap: 4px;
}

.mode {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface-1);
  color: var(--text-muted);
  font-size: 0.72rem;
  padding: 0.35rem 0.7rem;
  border-radius: calc(var(--radius) - 4px);
  cursor: pointer;
}
.mode.active {
  color: var(--text-strong);
  border-color: var(--accent);
  background: var(--surface-2);
}
.mode:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 1px;
}

.lab {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.inputs {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}

.swatch-input {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.caption {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.picker {
  width: 3.4rem;
  height: 2.4rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 4px);
  background: var(--surface-1);
  cursor: pointer;
}

.hexval {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.swap {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface-1);
  color: var(--text);
  height: 2.4rem;
  width: 2.4rem;
  border-radius: calc(var(--radius) - 4px);
  cursor: pointer;
  align-self: center;
}

.preview {
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: var(--space-2) var(--space-3);
}
.preview-body {
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
}
.preview-small {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.95;
}

.verdict {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: 0.6rem 0.9rem;
  border-radius: calc(var(--radius) - 3px);
  border: 1px solid var(--border);
  background: var(--surface-1);
}
.verdict.ok {
  border-color: oklch(0.55 0.12 155);
}
.verdict.ko {
  border-color: oklch(0.55 0.16 25);
}

.metric {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}
.metric-value {
  font-size: 1.15rem;
  color: var(--text-strong);
}
.metric-ratio {
  font-size: 1.05rem;
  color: var(--text-strong);
}
.why {
  font-size: 0.7rem;
}

.label {
  font-size: 0.85rem;
  color: var(--text);
}

.badge {
  margin-left: auto;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}
.ok .badge {
  color: oklch(0.75 0.14 155);
}
.ko .badge {
  color: oklch(0.72 0.17 25);
}

.note {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.fix {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.fix-chip {
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.fix-btn {
  appearance: none;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent-strong);
  font-size: 0.75rem;
  padding: 0.3rem 0.8rem;
  border-radius: calc(var(--radius) - 4px);
  cursor: pointer;
}
.fix-btn:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 1px;
}
</style>
