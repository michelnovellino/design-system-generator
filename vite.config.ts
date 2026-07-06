import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { generateScale } from './src/engines/color'
import { generateSpacingScale, generateTypeScale, DEFAULT_SPACING_MULTIPLIERS } from './src/engines/typography'
import { buildTokens, validate } from './src/export/dtcg'
import { transformTokens } from './src/export/transforms'

// base configurable por entorno:
//  - Sin BASE_PATH (local, y Cloudflare Pages en dominio raíz) → '/'.
//  - GitHub Pages (project site bajo /<repo>/) → el workflow inyecta
//    BASE_PATH con la salida de actions/configure-pages (p. ej. "/repo").
//    Ver .github/workflows/deploy.yml y ADR-005.
// Vite exige que `base` termine en '/', así que la normalizamos aquí.
const rawBase = process.env.BASE_PATH || '/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

function designSystemApiPlugin() {
  return {
    name: 'vite-plugin-design-system-api',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
        if (url.pathname === '/api/tokens') {
          try {
            const params = url.searchParams

            const brand = params.get('brand') || '#3b82f6'
            const brandHex = brand.startsWith('#') ? brand : `#${brand}`

            const contrastMode = (params.get('contrastMode') || 'bridge') as 'wcag2' | 'apca' | 'bridge'

            const minBasePx = parseInt(params.get('minBasePx') || '16', 10)
            const maxBasePx = parseInt(params.get('maxBasePx') || '18', 10)
            const minRatio = parseFloat(params.get('minRatio') || '1.2')
            const maxRatio = parseFloat(params.get('maxRatio') || '1.25')
            const positiveSteps = parseInt(params.get('positiveSteps') || '5', 10)
            const negativeSteps = parseInt(params.get('negativeSteps') || '2', 10)
            const minViewportPx = parseInt(params.get('minViewportPx') || '360', 10)
            const maxViewportPx = parseInt(params.get('maxViewportPx') || '1280', 10)
            const spacingBasePx = parseInt(params.get('spacingBasePx') || '4', 10)

            const brandScale = generateScale(brandHex, 'brand')
            const spacingScale = generateSpacingScale({
              basePx: spacingBasePx,
              multipliers: [...DEFAULT_SPACING_MULTIPLIERS],
            })
            const typeScale = generateTypeScale({
              minBasePx,
              maxBasePx,
              minRatio,
              maxRatio,
              positiveSteps,
              negativeSteps,
              minViewportPx,
              maxViewportPx,
            })

            const tokenTree = buildTokens({
              brand: brandScale,
              spacing: spacingScale,
              type: typeScale,
            })

            const validationErrors = validate(tokenTree)

            const files = transformTokens(tokenTree, ['css-vars', 'tailwind', 'dtcg-json'])

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.end(
              JSON.stringify({
                success: true,
                config: {
                  brandHex,
                  contrastMode,
                  typeConfig: {
                    minBasePx,
                    maxBasePx,
                    minRatio,
                    maxRatio,
                    positiveSteps,
                    negativeSteps,
                    minViewportPx,
                    maxViewportPx,
                  },
                  spacingBasePx,
                },
                tokens: {
                  dtcg: tokenTree,
                  css: files['css/variables.css'],
                  tailwind: files['tailwind/tailwind.config.js'],
                },
                validationErrors,
              }),
            )
          } catch (error) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(
              JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }),
            )
          }
        } else {
          next()
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), designSystemApiPlugin()],
  // El pre-bundler de dependencias NO aplica resolve.alias, así que el
  // import roto de bridge-pca (ver alias abajo) lo tumba en dev. Excluido
  // del pre-bundling, se sirve por el pipeline normal donde el alias sí rige.
  optimizeDeps: {
    exclude: ['bridge-pca'],
  },
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      // bridge-pca@0.1.6 (la última publicada) importa colorparsley con una
      // ruta relativa hardcodeada ('../node_modules/colorparsley/...') que no
      // resuelve bajo pnpm. Este alias la redirige al paquete real SIN
      // modificar el código oficial (requisito de licencia, ADR-003).
      {
        find: /^\.\.\/node_modules\/colorparsley\/src\/colorparsley\.js$/,
        replacement: 'colorparsley',
      },
    ],
  },
})
