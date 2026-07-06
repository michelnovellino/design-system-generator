/**
 * Modelo de tokens DTCG (W3C Design Tokens Community Group).
 * Taxonomía de tres niveles (PLAN §5):
 *   1. Primitivos (core):   valores brutos — color.brand.500, spacing.4
 *   2. Semánticos (alias):  referencias con significado — color.primary
 *   3. Componente:          nombres de UI — button.primary.background
 *
 * Forma de los valores: usamos la variante STRING de DTCG (`$value: "#3b82f6"`,
 * `"1rem"`) por ser la más consumida por herramientas (Style Dictionary,
 * Tokens Studio, etc.). Ver docs/DECISIONS.md ADR-009.
 *
 * TypeScript puro, sin Vue (capa reutilizable, igual que engines/).
 */
import type { ColorScale } from '@/types'
import type { SpaceStep, TypeStep } from '@/engines/typography'

export type DtcgType = 'color' | 'dimension' | 'fontFamily' | 'number'

/** Un token hoja: tiene `$value`. Puede ser un valor bruto o un alias `{ref}`. */
export interface DtcgToken {
  $value: string
  $type?: DtcgType
  $description?: string
}

/** Un grupo: nodos anidados, con metadatos DTCG opcionales ($ prefijo). */
export interface DtcgGroup {
  $type?: DtcgType
  $description?: string
  [key: string]: DtcgNode | DtcgType | string | undefined
}

export type DtcgNode = DtcgToken | DtcgGroup

/** ¿El nodo es un token hoja (tiene `$value`)? */
export function isToken(node: DtcgNode): node is DtcgToken {
  return typeof node === 'object' && node !== null && '$value' in node
}

/** ¿El valor es un alias DTCG del tipo `{color.brand.500}`? */
export function isAlias(value: string): boolean {
  return /^\{[^{}]+\}$/.test(value)
}

/** Extrae el path de un alias: `{color.brand.500}` → ["color","brand","500"]. */
export function aliasPath(value: string): string[] {
  return value.slice(1, -1).split('.')
}

/** Claves de metadatos DTCG (prefijo `$`), que no son nodos hijos. */
function isMetaKey(key: string): boolean {
  return key.startsWith('$')
}

// ─────────────────────────────────────────────────────────────────────────
// Construcción del árbol a partir del estado de diseño
// ─────────────────────────────────────────────────────────────────────────

export interface TokenSources {
  /** Escala tonal del color de marca (motor de color). */
  brand: ColorScale
  /** Escala de espaciado (motor de tipografía). */
  spacing: SpaceStep[]
  /** Escala tipográfica fluida (motor de tipografía). */
  type: TypeStep[]
}

/** Nombre de token DTCG seguro: sin '.', '{' ni '}'. "0.5" → "0-5". */
function safeName(raw: string): string {
  return raw.replace(/[.{}]/g, '-')
}

/**
 * Ensambla el árbol DTCG completo (primitivos + semánticos + componente)
 * a partir de las escalas generadas por los motores. Los alias demuestran
 * la cadena componente → semántico → primitivo.
 */
export function buildTokens(src: TokenSources): DtcgGroup {
  // 1. Primitivos de color: color.brand.{50..950}
  const brand: DtcgGroup = { $type: 'color' }
  for (const step of src.brand.steps) {
    brand[String(step.step)] = { $value: step.hex, $type: 'color' }
  }

  // 1. Primitivos de espaciado: spacing.{mult}  (nombres saneados)
  const spacing: DtcgGroup = { $type: 'dimension' }
  for (const s of src.spacing) {
    spacing[safeName(s.label)] = { $value: `${s.rem}rem`, $type: 'dimension' }
  }

  // 1. Tipografía fluida: font-size.{label} con clamp() como valor.
  const fontSize: DtcgGroup = { $type: 'dimension' }
  for (const t of src.type) {
    fontSize[safeName(t.label)] = { $value: t.clamp, $type: 'dimension' }
  }

  return {
    color: {
      $type: 'color',
      brand,
      // 2. Semánticos (alias → primitivos)
      primary: { $value: '{color.brand.500}', $type: 'color' },
      'primary-hover': { $value: '{color.brand.600}', $type: 'color' },
      'primary-active': { $value: '{color.brand.700}', $type: 'color' },
      background: { $value: '{color.brand.50}', $type: 'color' },
      surface: { $value: '{color.brand.100}', $type: 'color' },
      border: { $value: '{color.brand.200}', $type: 'color' },
      text: { $value: '{color.brand.900}', $type: 'color' },
      'text-muted': { $value: '{color.brand.700}', $type: 'color' },
    },
    // 3. Componente (alias → semánticos)
    button: {
      primary: {
        background: { $value: '{color.primary}', $type: 'color' },
        'background-hover': { $value: '{color.primary-hover}', $type: 'color' },
        text: { $value: '{color.background}', $type: 'color' },
      },
    },
    spacing,
    'font-size': fontSize,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Resolución y validación de alias
// ─────────────────────────────────────────────────────────────────────────

/** Un token aplanado con su path completo. */
export interface FlatToken {
  path: string[]
  token: DtcgToken
}

/** Aplana el árbol a una lista de tokens hoja con su path. */
export function flatten(tree: DtcgGroup): FlatToken[] {
  const out: FlatToken[] = []
  const walk = (node: DtcgGroup, path: string[]) => {
    for (const key of Object.keys(node)) {
      if (isMetaKey(key)) continue
      const child = node[key] as DtcgNode
      if (isToken(child)) {
        out.push({ path: [...path, key], token: child })
      } else {
        walk(child, [...path, key])
      }
    }
  }
  walk(tree, [])
  return out
}

/** Busca un token por su path. Devuelve undefined si no existe. */
export function tokenAt(tree: DtcgGroup, path: string[]): DtcgToken | undefined {
  let node: DtcgNode | undefined = tree
  for (const key of path) {
    if (node === undefined || isToken(node)) return undefined
    node = node[key] as DtcgNode | undefined
  }
  return node !== undefined && isToken(node) ? node : undefined
}

export interface ValidationError {
  path: string[]
  message: string
}

/**
 * Resuelve un valor siguiendo la cadena de alias hasta un valor bruto.
 * Lanza si encuentra un alias colgante o un ciclo (usar tras validar,
 * o capturar). Para validación silenciosa, usar `validate`.
 */
export function resolveValue(tree: DtcgGroup, value: string, seen: string[] = []): string {
  if (!isAlias(value)) return value
  const path = aliasPath(value)
  const key = path.join('.')
  if (seen.includes(key)) {
    throw new Error(`Alias circular: ${[...seen, key].join(' → ')}`)
  }
  const target = tokenAt(tree, path)
  if (target === undefined) {
    throw new Error(`Alias colgante: {${key}} no existe`)
  }
  return resolveValue(tree, target.$value, [...seen, key])
}

/**
 * Valida el árbol completo: detecta alias colgantes (apuntan a un token
 * inexistente) y ciclos (A → B → A). Devuelve la lista de errores; vacía
 * si el árbol es consistente.
 */
export function validate(tree: DtcgGroup): ValidationError[] {
  const errors: ValidationError[] = []
  for (const { path, token } of flatten(tree)) {
    if (!isAlias(token.$value)) continue
    try {
      resolveValue(tree, token.$value)
    } catch (e) {
      errors.push({ path, message: e instanceof Error ? e.message : String(e) })
    }
  }
  return errors
}

/**
 * "Materializa" un grupo: devuelve un objeto plano anidado con TODOS los
 * alias resueltos a su valor bruto. Base para las transforms que necesitan
 * valores concretos (p. ej. tailwind.config).
 */
export function materialize(tree: DtcgGroup, group: DtcgGroup): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(group)) {
    if (isMetaKey(key)) continue
    const child = group[key] as DtcgNode
    out[key] = isToken(child)
      ? resolveValue(tree, child.$value)
      : materialize(tree, child)
  }
  return out
}
