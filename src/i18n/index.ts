import { ref, computed } from 'vue'

export type Locale = 'es' | 'en'

// Default to 'en', or 'es' if browser matches
const defaultLocale: Locale = typeof navigator !== 'undefined' && navigator.language?.startsWith('es') ? 'es' : 'en'
const currentLocale = ref<Locale>(defaultLocale)

export const locale = computed({
  get: () => currentLocale.value,
  set: (val: Locale) => {
    currentLocale.value = val
  }
})

export const translations = {
  en: {
    eyebrow: "100% client-side · serverless · deterministic",
    lede: "Input a brand color and get a perceptual OKLCH scale, WCAG 2, Bridge PCA, and APCA validated contrast, fluid typography, and export-ready DTCG tokens. All calculations occur in your browser.",
    engine_status_active: "active",
    engine_status_pending: "pending",
    engine_color_note: "50→950 tonal scale, harmonies, gamut clipping",
    engine_contrast_note: "WCAG 2 · Bridge PCA (default) · APCA · auto-fix",
    engine_typo_note: "Modular scale + fluid clamp() in rem",
    engine_cvd_note: "CVD matrices via SVG filters (GPU)",
    engine_export_note: "DTCG + custom transforms + JSZip (Web Worker)",
    
    // Color Generator
    color_base: "brand color",
    hex: "hex",
    selector_color_base: "Brand color picker",
    color_base_hex: "Brand color in HEX",
    escala_tonal: "50 to 950 tonal scale",
    copied: "copied",
    copy_hex: "Copy {hex}",
    croma_recortado: "Chroma clipped to sRGB",
    clip_note: "▾ chroma clipped to fit in sRGB (L and H intact)",
    harmony_complementary: "Complementary",
    harmony_analogous: "Analogous",
    harmony_triadic: "Triadic",
    harmony_tetradic: "Tetradic",
    
    // Contrast Checker
    contrast_heading: "Contrast",
    contrast_label_text: "text",
    contrast_label_bg: "background",
    contrast_picker_text: "Text color",
    contrast_picker_bg: "Background color",
    contrast_swap: "Swap text and background",
    pangram: "The quick brown fox jumps over the lazy dog.",
    preview_small: "Small sample text — 14px",
    contrast_passes: "PASS",
    contrast_fails: "FAIL",
    contrast_bridge_note: "⚠ Bridge PCA ratio is a perceptual equivalent, not the literal WCAG 2 calculation",
    autofix_text: "auto-fix: adjust text L to",
    autofix_btn: "Apply",
    autofix_impossible: "auto-fix: unreachable by only adjusting text lightness on this background",
    
    // Typography Scale
    typo_heading: "Fluid typography",
    spacing_heading: "Spacing",
    ratio_minor_second: "Minor second",
    ratio_major_second: "Major second",
    ratio_minor_third: "Minor third",
    ratio_major_third: "Major third",
    ratio_perfect_fourth: "Perfect fourth",
    ratio_golden: "Golden ratio",
    label_ratio_min: "mobile ratio",
    label_ratio_max: "desktop ratio",
    label_body_min: "mobile body (px)",
    label_body_max: "desktop body (px)",
    label_titulares: "headlines",
    copy_clamp: "Copy clamp() for {step}",
    sample_text_typo: "Design system",
    copied_exclamation: "copied!",
    copy_spacing: "Copy {rem}rem",

    // CVD simulation
    cvd_heading: "Color vision",
    cvd_intro: "Your brand scale as seen with each color vision deficiency (Machado 2009).",
    cvd_normal: "Normal vision",
    cvd_protanopia: "Protanopia",
    cvd_deuteranopia: "Deuteranopia",
    cvd_tritanopia: "Tritanopia",
    cvd_achromatopsia: "Achromatopsia",
    cvd_protanopia_desc: "No red cones (~1% of men)",
    cvd_deuteranopia_desc: "No green cones (~1% of men)",
    cvd_tritanopia_desc: "No blue cones (rare)",
    cvd_achromatopsia_desc: "No color at all (very rare)",

    // Export
    export_heading: "Export",
    export_intro: "Pick your targets and download a ready-to-use token bundle. Everything is generated in your browser.",
    export_target_css: "CSS variables",
    export_target_tailwind: "Tailwind config",
    export_target_dtcg: "DTCG tokens.json",
    export_download: "Download .zip",
    export_building: "Building…",
    export_none: "Pick at least one target",
    export_errors: "Token validation issues:",
    export_done: "Downloaded ✓"
  },
  es: {
    eyebrow: "100% cliente · sin servidores · determinista",
    lede: "Introduce un color de marca y obtén una escala perceptual en OKLCH, contraste validado con WCAG 2, Bridge PCA y APCA, tipografía fluida y tokens DTCG listos para exportar. Todo el cálculo ocurre en tu navegador.",
    engine_status_active: "activo",
    engine_status_pending: "pendiente",
    engine_color_note: "Escala tonal 50→950, armonías, gamut clipping",
    engine_contrast_note: "WCAG 2 · Bridge PCA (default) · APCA · auto-fix",
    engine_typo_note: "Escala modular + clamp() fluido en rem",
    engine_cvd_note: "Matrices CVD vía filtros SVG (GPU)",
    engine_export_note: "DTCG + transforms propias + JSZip (Web Worker)",
    
    // Color Generator
    color_base: "color base",
    hex: "hex",
    selector_color_base: "Selector de color base",
    color_base_hex: "Color base en HEX",
    escala_tonal: "Escala tonal 50 a 950",
    copied: "copiado",
    copy_hex: "Copiar {hex}",
    croma_recortado: "Croma recortado a sRGB",
    clip_note: "▾ croma recortado para caber en sRGB (L y H intactos)",
    harmony_complementary: "Complementaria",
    harmony_analogous: "Análogas",
    harmony_triadic: "Triádicas",
    harmony_tetradic: "Tetrádicas",
    
    // Contrast Checker
    contrast_heading: "Contraste",
    contrast_label_text: "texto",
    contrast_label_bg: "fondo",
    contrast_picker_text: "Color del texto",
    contrast_picker_bg: "Color del fondo",
    contrast_swap: "Intercambiar texto y fondo",
    pangram: "El veloz murciélago hindú comía feliz cardillo y kiwi.",
    preview_small: "Texto pequeño de ejemplo — 14px",
    contrast_passes: "PASA",
    contrast_fails: "FALLA",
    contrast_bridge_note: "⚠ el ratio de Bridge PCA es un equivalente perceptual, no el cálculo literal de WCAG 2",
    autofix_text: "auto-fix: ajustar L del texto a",
    autofix_btn: "Aplicar",
    autofix_impossible: "auto-fix: inalcanzable ajustando solo la luminosidad del texto sobre este fondo",
    
    // Typography Scale
    typo_heading: "Tipografía fluida",
    spacing_heading: "Espaciado",
    ratio_minor_second: "Segunda menor",
    ratio_major_second: "Segunda mayor",
    ratio_minor_third: "Tercera menor",
    ratio_major_third: "Tercera mayor",
    ratio_perfect_fourth: "Cuarta",
    ratio_golden: "Áurea",
    label_ratio_min: "ratio móvil",
    label_ratio_max: "ratio escritorio",
    label_body_min: "body móvil (px)",
    label_body_max: "body escritorio (px)",
    label_titulares: "titulares",
    copy_clamp: "Copiar clamp() de {step}",
    sample_text_typo: "Sistema de diseño",
    copied_exclamation: "¡copiado!",
    copy_spacing: "Copiar {rem}rem",

    // CVD simulation
    cvd_heading: "Visión del color",
    cvd_intro: "Tu escala de marca vista con cada deficiencia de visión del color (Machado 2009).",
    cvd_normal: "Visión normal",
    cvd_protanopia: "Protanopía",
    cvd_deuteranopia: "Deuteranopía",
    cvd_tritanopia: "Tritanopía",
    cvd_achromatopsia: "Acromatopsia",
    cvd_protanopia_desc: "Sin conos rojos (~1% de hombres)",
    cvd_deuteranopia_desc: "Sin conos verdes (~1% de hombres)",
    cvd_tritanopia_desc: "Sin conos azules (raro)",
    cvd_achromatopsia_desc: "Sin color alguno (muy raro)",

    // Export
    export_heading: "Exportar",
    export_intro: "Elige tus targets y descarga un paquete de tokens listo para usar. Todo se genera en tu navegador.",
    export_target_css: "Variables CSS",
    export_target_tailwind: "Config de Tailwind",
    export_target_dtcg: "DTCG tokens.json",
    export_download: "Descargar .zip",
    export_building: "Generando…",
    export_none: "Elige al menos un target",
    export_errors: "Problemas de validación de tokens:",
    export_done: "Descargado ✓"
  }
} as const

export type TranslationKey = keyof typeof translations.en

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale.value] || translations.en
  let msg = (dict as any)[key] || (translations.en as any)[key] || String(key)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      msg = msg.replace(new RegExp(`{${k}}`, 'g'), String(v))
    })
  }
  return msg
}
