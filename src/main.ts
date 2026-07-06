import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')

// Expose global API for agents
import { useTokensStore } from '@/stores/tokens'
if (typeof window !== 'undefined') {
  (window as any).__DESIGN_SYSTEM__ = {
    getStore: () => useTokensStore(),
    getTokens: () => useTokensStore().tokenTree,
    setBrand: (hex: string) => useTokensStore().setBrand(hex),
    setContrastMode: (mode: any) => useTokensStore().setContrastMode(mode),
  }
}

