/**
 * Test de humo de la app completa: monta App + Pinia y renderiza a string
 * con el server-renderer de Vue. Ejecuta el ciclo real store → engine de
 * color → template, sin necesitar navegador. Si el wiring entre capas se
 * rompe (imports, props, stores), esto falla antes de llegar a producción.
 */
import { describe, expect, it } from 'vitest'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { locale } from '@/i18n'

describe('App (smoke)', () => {
  it('monta y renderiza la escala completa del color base por defecto', async () => {
    locale.value = 'es'
    const app = createSSRApp(App)
    app.use(createPinia())
    const html = await renderToString(app)

    // El peldaño 500 muestra el HEX del color base del store (#3b82f6).
    expect(html).toContain('#3b82f6')
    // Los 11 peldaños de la escala están presentes.
    expect(html.match(/swatch-step/g)?.length).toBe(11)
    // Las 4 familias de armonías se renderizan (1+2+2+2 swatches).
    expect(html.match(/harmony-swatch\b/g)?.length).toBe(7)
    // Enlace "Why APCA" vivo (requisito de licencia, PLAN §3).
    expect(html).toContain('git.apcacontrast.com/documentation/WhyAPCA')

    // Panel de contraste: modo default bridge con #767676/blanco → Lc 71.6,
    // ratio perceptual 4.10:1, falla y ofrece auto-fix.
    expect(html).toContain('Lc 71.6')
    expect(html).toContain('4.10:1')
    expect(html).toContain('FALLA')
    expect(html).toContain('auto-fix')
    // Advertencia obligatoria del ratio perceptual de Bridge (PLAN §4).
    expect(html).toContain('equivalente perceptual')

    // Panel de tipografía: 5 titulares + body + 2 pequeños = 8 muestras,
    // cada una con su clamp() fluido aplicado como font-size inline.
    expect(html.match(/class="sample"/g)?.length).toBe(8)
    expect(html).toMatch(/font-size:\s*clamp\(/)
    // Escala de espaciado (16 multiplicadores por defecto).
    expect(html.match(/space-row/g)?.length).toBe(16)
  })
})
