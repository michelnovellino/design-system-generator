import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// base configurable por entorno:
//  - Sin BASE_PATH (local, y Cloudflare Pages en dominio raíz) → '/'.
//  - GitHub Pages (project site bajo /<repo>/) → el workflow inyecta
//    BASE_PATH con la salida de actions/configure-pages (p. ej. "/repo").
//    Ver .github/workflows/deploy.yml y ADR-005.
// Vite exige que `base` termine en '/', así que la normalizamos aquí.
const rawBase = process.env.BASE_PATH || '/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [vue()],
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
