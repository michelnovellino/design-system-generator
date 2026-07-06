<script setup lang="ts">
import { computed } from 'vue'
import { t, locale } from '@/i18n'
import ColorGenerator from '@/components/ColorGenerator.vue'
import ContrastChecker from '@/components/ContrastChecker.vue'
import TypographyScale from '@/components/TypographyScale.vue'

const engines = computed(() => [
  { name: 'Color (OKLCH)', status: t('engine_status_active'), note: t('engine_color_note') },
  { name: 'Contraste', status: t('engine_status_active'), note: t('engine_contrast_note') },
  { name: 'Tipografía', status: t('engine_status_active'), note: t('engine_typo_note') },
  { name: 'Daltonismo', status: t('engine_status_pending'), note: t('engine_cvd_note') },
  { name: 'Exportación', status: t('engine_status_pending'), note: t('engine_export_note') },
])

function toggleLocale() {
  locale.value = locale.value === 'en' ? 'es' : 'en'
}
</script>

<template>
  <main class="shell">
    <header class="hero">
      <p class="eyebrow">{{ t('eyebrow') }}</p>
      <h1 class="title">
        Design System<br />
        <span class="mono accent">Generator</span>
      </h1>
      <p class="lede">
        {{ t('lede') }}
      </p>
    </header>

    <ColorGenerator />

    <ContrastChecker />

    <TypographyScale />

    <section class="engines" :aria-label="locale === 'es' ? 'Estado de los motores' : 'Engine status'">
      <div v-for="e in engines" :key="e.name" class="engine-row">
        <span class="engine-name mono">{{ e.name }}</span>
        <span class="engine-note">{{ e.note }}</span>
        <span class="engine-status mono">{{ e.status }}</span>
      </div>
    </section>

    <footer class="foot">
      <span class="mono">v0.1.0 · Apache-2.0</span>
      <span class="foot-sep">·</span>
      <a href="https://git.apcacontrast.com/documentation/WhyAPCA" target="_blank" rel="noopener">
        Why APCA
      </a>
      <span class="foot-sep">·</span>
      <button class="lang-btn mono" @click="toggleLocale">
        {{ locale === 'en' ? 'Español' : 'English' }}
      </button>
    </footer>
  </main>
</template>

<style scoped>
.shell {
  max-width: 780px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-3);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.mono {
  font-family: var(--font-mono);
}
.accent {
  color: var(--accent);
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin: 0 0 var(--space-2);
}

.title {
  font-size: clamp(2.5rem, 6vw + 1rem, 4.25rem);
  line-height: 1.02;
  letter-spacing: -0.02em;
  font-weight: 680;
  color: var(--text-strong);
  margin: 0 0 var(--space-3);
}

.lede {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text);
  max-width: 58ch;
  margin: 0;
}

.engines {
  border-top: 1px solid var(--border);
}

.engine-row {
  display: grid;
  grid-template-columns: 12rem 1fr auto;
  gap: var(--space-2);
  align-items: baseline;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border);
}

.engine-name {
  font-size: 0.9rem;
  color: var(--text-strong);
}
.engine-note {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.engine-status {
  font-size: 0.72rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.foot {
  margin-top: auto;
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  gap: var(--space-1);
  align-items: center;
  flex-wrap: wrap;
}
.foot-sep {
  opacity: 0.5;
}

.lang-btn {
  appearance: none;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  cursor: pointer;
}
.lang-btn:hover {
  color: var(--text-strong);
  border-color: var(--text-muted);
}

@media (max-width: 560px) {
  .engine-row {
    grid-template-columns: 1fr auto;
  }
  .engine-note {
    grid-column: 1 / -1;
    order: 3;
  }
}
</style>
