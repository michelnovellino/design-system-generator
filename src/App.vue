<script setup lang="ts">
import { t, locale } from '@/i18n'
import ColorGenerator from '@/components/ColorGenerator.vue'
import ContrastChecker from '@/components/ContrastChecker.vue'
import TypographyScale from '@/components/TypographyScale.vue'
import CvdSimulation from '@/components/CvdSimulation.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import { useTokensStore } from '@/stores/tokens'

const store = useTokensStore()

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

    <CvdSimulation />

    <ExportPanel />

    <!-- Pre tag for agent scraping and JSON extraction -->
    <pre
      id="design-tokens-data"
      style="display: none;"
      v-text="JSON.stringify(store.tokenTree, null, 2)"
    ></pre>
    <footer class="foot">
      <span class="mono">v0.1.0 · Apache-2.0</span>
      <span class="foot-sep">·</span>
      <a href="https://git.apcacontrast.com/documentation/WhyAPCA" target="_blank" rel="noopener">
        Why APCA
      </a>
      <span class="foot-sep">·</span>
      <a
        href="https://github.com/michelnovellino/design-system-generator"
        target="_blank"
        rel="noopener"
      >
        GitHub
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
</style>
