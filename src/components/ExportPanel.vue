<script setup lang="ts">
// Panel de exportación (PLAN §10, paso 9). Selección de targets → descarga
// de un .zip con los tokens transformados. Todo en el navegador.
// El árbol DTCG viene del store (única fuente de verdad); el empaquetado
// y las transforms viven en src/export.
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTokensStore } from '@/stores/tokens'
import { buildExport, type ExportTarget } from '@/export'
import { t } from '@/i18n'

const store = useTokensStore()
const { brandScale, spacingScale, typeScale, validationErrors } = storeToRefs(store)

const targetDefs: { id: ExportTarget; labelKey: 'export_target_css' | 'export_target_tailwind' | 'export_target_dtcg' }[] = [
  { id: 'css-vars', labelKey: 'export_target_css' },
  { id: 'tailwind', labelKey: 'export_target_tailwind' },
  { id: 'dtcg-json', labelKey: 'export_target_dtcg' },
]

const selected = ref<Record<ExportTarget, boolean>>({
  'css-vars': true,
  tailwind: true,
  'dtcg-json': true,
})

const chosen = computed(() =>
  targetDefs.map((d) => d.id).filter((id) => selected.value[id]),
)

const building = ref(false)
const justDone = ref(false)

async function download() {
  if (chosen.value.length === 0 || building.value) return
  building.value = true
  justDone.value = false
  try {
    const { blob } = await buildExport(
      { brand: brandScale.value, spacing: spacingScale.value, type: typeScale.value },
      chosen.value,
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'design-tokens.zip'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    justDone.value = true
    setTimeout(() => (justDone.value = false), 2000)
  } finally {
    building.value = false
  }
}
</script>

<template>
  <section class="export" :aria-label="t('export_heading')">
    <div class="head">
      <h2 class="heading">{{ t('export_heading') }}</h2>
      <p class="intro">{{ t('export_intro') }}</p>
    </div>

    <div class="targets">
      <label v-for="d in targetDefs" :key="d.id" class="target">
        <input v-model="selected[d.id]" type="checkbox" class="check" :data-agent="'export-target-' + d.id" />
        <span class="mono">{{ t(d.labelKey) }}</span>
      </label>
    </div>

    <div v-if="validationErrors.length" class="errors mono">
      <strong>{{ t('export_errors') }}</strong>
      <span v-for="e in validationErrors" :key="e.path.join('.')">
        {{ e.path.join('.') }} — {{ e.message }}
      </span>
    </div>

    <div class="actions">
      <button
        class="download mono"
        :disabled="chosen.length === 0 || building"
        @click="download"
        data-agent="download-zip-button"
      >
        {{ building ? t('export_building') : justDone ? t('export_done') : t('export_download') }}
      </button>
      <span v-if="chosen.length === 0" class="hint mono">{{ t('export_none') }}</span>
    </div>
  </section>
</template>

<style scoped>
.export {
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

.targets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.target {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: var(--text);
  border: 1px solid var(--border);
  background: var(--surface-1);
  padding: 0.4rem 0.75rem;
  border-radius: calc(var(--radius) - 4px);
  cursor: pointer;
}

.check {
  accent-color: var(--accent);
  cursor: pointer;
}

.errors {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.72rem;
  color: oklch(0.72 0.17 25);
  border: 1px solid oklch(0.55 0.16 25);
  border-radius: calc(var(--radius) - 4px);
  padding: 0.6rem 0.8rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.download {
  appearance: none;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: oklch(0.2 0.02 265);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.55rem 1.2rem;
  border-radius: calc(var(--radius) - 4px);
  cursor: pointer;
}
.download:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.download:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
