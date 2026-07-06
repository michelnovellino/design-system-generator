<script setup lang="ts">
// UI mínima del motor de color (PLAN §10, paso 3):
// input de color base → escala tonal 50→950 + armonías.
// Toda la matemática vive en engines/color; aquí solo se presenta.
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTokensStore } from '@/stores/tokens'
import { generateScale, harmonies, hexToOklch } from '@/engines/color'
import { t } from '@/i18n'

const store = useTokensStore()
const { brandHex } = storeToRefs(store)

/** Borrador del campo de texto; solo se aplica si es un HEX válido. */
const hexDraft = ref(brandHex.value)
const HEX_RE = /^#?([0-9a-fA-F]{6})$/

function applyDraft() {
  const match = HEX_RE.exec(hexDraft.value.trim())
  if (match?.[1]) {
    store.setBrand(`#${match[1].toLowerCase()}`)
  }
  hexDraft.value = brandHex.value // normaliza o revierte
}

function onPick(event: Event) {
  const value = (event.target as HTMLInputElement).value
  store.setBrand(value)
  hexDraft.value = value
}

const scale = computed(() => generateScale(brandHex.value, 'brand'))
const hasClipped = computed(() => scale.value.steps.some((s) => s.clipped))

const harmonyGroups = computed(() => {
  const h = harmonies(brandHex.value)
  return [
    { label: t('harmony_complementary'), hexes: [h.complementary] },
    { label: t('harmony_analogous'), hexes: [...h.analogous] },
    { label: t('harmony_triadic'), hexes: [...h.triadic] },
    { label: t('harmony_tetradic'), hexes: [...h.tetradic] },
  ]
})

/** Texto legible sobre un swatch según su lightness OKLCH. */
function inkFor(l: number): string {
  return l > 0.6 ? 'oklch(0.22 0.02 265)' : 'oklch(0.97 0.01 265)'
}
function inkForHex(hex: string): string {
  return inkFor(hexToOklch(hex).l)
}

/** Copiar HEX al portapapeles con feedback breve. */
const copiedHex = ref<string | null>(null)
async function copy(hex: string) {
  try {
    await navigator.clipboard.writeText(hex)
    copiedHex.value = hex
    setTimeout(() => {
      if (copiedHex.value === hex) copiedHex.value = null
    }, 1200)
  } catch {
    /* portapapeles no disponible (p. ej. contexto no seguro): sin feedback */
  }
}
</script>

<template>
  <section class="generator" :aria-label="t('escala_tonal')">
    <div class="controls">
      <label class="picker-label">
        <span class="control-caption mono">{{ t('color_base') }}</span>
        <input
          type="color"
          class="picker"
          :value="brandHex"
          :aria-label="t('selector_color_base')"
          @input="onPick"
        />
      </label>
      <label class="hex-label">
        <span class="control-caption mono">{{ t('hex') }}</span>
        <input
          v-model="hexDraft"
          type="text"
          class="hex-input mono"
          spellcheck="false"
          autocomplete="off"
          :aria-label="t('color_base_hex')"
          @change="applyDraft"
          @keydown.enter="applyDraft"
        />
      </label>
      <p class="hue mono">H {{ scale.baseHue.toFixed(1) }}°</p>
    </div>

    <div class="scale" role="list" :aria-label="t('escala_tonal')">
      <button
        v-for="s in scale.steps"
        :key="s.step"
        role="listitem"
        class="swatch"
        :class="{ base: s.step === 500 }"
        :style="{ background: s.hex, color: inkFor(s.oklch.l) }"
        :title="t('copy_hex', { hex: s.hex })"
        @click="copy(s.hex)"
      >
        <span class="swatch-step mono">{{ s.step }}</span>
        <span class="swatch-hex mono">{{ copiedHex === s.hex ? t('copied') : s.hex }}</span>
        <span v-if="s.clipped" class="swatch-clip mono" :title="t('croma_recortado')">▾</span>
      </button>
    </div>
    <p v-if="hasClipped" class="clip-note mono">{{ t('clip_note') }}</p>

    <div class="harmonies">
      <div v-for="g in harmonyGroups" :key="g.label" class="harmony-group">
        <span class="harmony-label mono">{{ g.label }}</span>
        <div class="harmony-swatches">
          <button
            v-for="hex in g.hexes"
            :key="hex"
            class="harmony-swatch mono"
            :style="{ background: hex, color: inkForHex(hex) }"
            :title="t('copy_hex', { hex })"
            @click="copy(hex)"
          >
            {{ copiedHex === hex ? t('copied') : hex }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.generator {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.controls {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.control-caption {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
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

.hex-input {
  width: 7.5rem;
  height: 2.4rem;
  padding: 0 0.75rem;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 4px);
  background: var(--surface-1);
  color: var(--text-strong);
  font-size: 0.9rem;
}
.hex-input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.hue {
  margin: 0 0 0.55rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.scale {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 4px;
}

.swatch {
  appearance: none;
  border: none;
  border-radius: calc(var(--radius) - 5px);
  aspect-ratio: 3 / 4;
  padding: 0.4rem 0.2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  position: relative;
  font-size: 0.62rem;
}
.swatch.base {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.swatch:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.swatch-step {
  font-weight: 600;
}
.swatch-hex {
  opacity: 0.85;
  font-size: 0.56rem;
}
.swatch-clip {
  position: absolute;
  top: 0.15rem;
  right: 0.3rem;
}

.clip-note {
  margin: calc(-1 * var(--space-2)) 0 0;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.harmonies {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--space-2);
  border-top: 1px solid var(--border);
  padding-top: var(--space-2);
}

.harmony-label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}

.harmony-swatches {
  display: flex;
  gap: 4px;
}

.harmony-swatch {
  appearance: none;
  border: none;
  border-radius: calc(var(--radius) - 5px);
  flex: 1;
  height: 2.6rem;
  cursor: pointer;
  font-size: 0.62rem;
}
.harmony-swatch:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .scale {
    grid-template-columns: repeat(6, 1fr);
  }
  .swatch {
    aspect-ratio: 1;
  }
}
</style>
