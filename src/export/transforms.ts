/**
 * Transforms propias DTCG → archivos por target (PLAN §7, ADR-004).
 * NO usamos Style Dictionary (decisión firme; ver ADR-004).
 *
 * Targets:
 *   - css-vars:  variables CSS nativas; los alias se preservan como var(--…)
 *                para que la cascada semántica siga viva.
 *   - tailwind:  tailwind.config.js con valores concretos (alias resueltos).
 *   - dtcg-json: el propio árbol DTCG (fuente de verdad), alias intactos.
 *
 * Casing (PLAN §7): CSS en `--kebab-case`.
 */
import {
  aliasPath,
  flatten,
  isAlias,
  materialize,
  type DtcgGroup,
} from './dtcg'

export type ExportTarget = 'css-vars' | 'tailwind' | 'dtcg-json'

/** Nombre de variable CSS a partir de un path: ["color","brand","500"] → --color-brand-500. */
function cssVarName(path: string[]): string {
  return `--${path.join('-').toLowerCase()}`
}

/**
 * Variables CSS nativas. Un alias `{color.brand.500}` se emite como
 * `var(--color-brand-500)`, preservando la capa semántica en la cascada.
 */
export function toCssVars(tree: DtcgGroup): string {
  const lines = flatten(tree).map(({ path, token }) => {
    const value = isAlias(token.$value)
      ? `var(${cssVarName(aliasPath(token.$value))})`
      : token.$value
    return `  ${cssVarName(path)}: ${value};`
  })
  return `:root {\n${lines.join('\n')}\n}\n`
}

/** Serializa un objeto (materializado) a literal JS indentado para el config. */
function toJsObject(obj: unknown, indent = 2): string {
  const pad = ' '.repeat(indent)
  if (typeof obj === 'string') return JSON.stringify(obj)
  const entries = Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
    // Claves no-identificador (p. ej. "500", "0-5") van entre comillas.
    const key = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)
    return `${pad}${key}: ${toJsObject(v, indent + 2)}`
  })
  return `{\n${entries.join(',\n')}\n${' '.repeat(indent - 2)}}`
}

/**
 * tailwind.config.js con `theme.extend`: colores, espaciado y tamaños de
 * fuente. Los alias se resuelven a valores concretos (Tailwind quiere
 * valores, no referencias). Se anida igual que el árbol → clases como
 * `bg-brand-500`, `bg-button-primary-background`.
 */
export function toTailwindConfig(tree: DtcgGroup): string {
  const colors = materialize(tree, tree.color as DtcgGroup)
  // Componente de color (button.*) también es útil como color de Tailwind.
  if (tree.button) {
    ;(colors as Record<string, unknown>).button = materialize(tree, tree.button as DtcgGroup)
  }
  const spacing = materialize(tree, tree.spacing as DtcgGroup)
  const fontSize = materialize(tree, tree['font-size'] as DtcgGroup)

  const theme = {
    colors,
    spacing,
    fontSize,
  }

  return (
    `/** Generado por Design System Generator. */\n` +
    `/** @type {import('tailwindcss').Config} */\n` +
    `export default {\n` +
    `  theme: {\n` +
    `    extend: ${toJsObject(theme, 6)},\n` +
    `  },\n` +
    `}\n`
  )
}

/** El árbol DTCG serializado (fuente de verdad), con alias intactos. */
export function toDtcgJson(tree: DtcgGroup): string {
  return JSON.stringify(tree, null, 2) + '\n'
}

/** Ruta de archivo (dentro del zip) para cada target. */
export const TARGET_FILES: Record<ExportTarget, string> = {
  'css-vars': 'css/variables.css',
  tailwind: 'tailwind/tailwind.config.js',
  'dtcg-json': 'tokens/tokens.json',
}

/**
 * Transforma el árbol DTCG a los archivos de texto de cada target pedido.
 * Devuelve un mapa { ruta → contenido }.
 */
export function transformTokens(
  tree: DtcgGroup,
  targets: ExportTarget[],
): Record<string, string> {
  const files: Record<string, string> = {}
  for (const target of targets) {
    const path = TARGET_FILES[target]
    switch (target) {
      case 'css-vars':
        files[path] = toCssVars(tree)
        break
      case 'tailwind':
        files[path] = toTailwindConfig(tree)
        break
      case 'dtcg-json':
        files[path] = toDtcgJson(tree)
        break
    }
  }
  return files
}
