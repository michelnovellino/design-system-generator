# Guía de Compatibilidad con Agentes de IA (Agent-Friendly Guide)

Este proyecto está diseñado para ser interactivo y consultable por agentes de inteligencia artificial (como Claude, Copilot, Antigravity, o scrapers automatizados). 

Para lograr esto de la manera más eficiente, se implementaron tres mecanismos clave:

---

## 1. Puente de JavaScript Global (`window.__DESIGN_SYSTEM__`)

Si ejecutas la aplicación en un entorno de navegador con soporte para evaluar JavaScript (por ejemplo, a través de herramientas de automatización como Puppeteer, Playwright, Chrome DevTools Protocol o subagentes de IA), puedes interactuar directamente con el estado de la aplicación utilizando el objeto global `window.__DESIGN_SYSTEM__`.

### Métodos Disponibles:

* **`window.__DESIGN_SYSTEM__.getTokens()`**: Retorna el árbol completo de tokens en formato compatible con el borrador de especificación de la W3C (DTCG).
* **`window.__DESIGN_SYSTEM__.getRawData()`**: Retorna un objeto con el estado actual del generador:
  ```json
  {
    "brandHex": "#3b82f6",
    "contrastMode": "bridge",
    "typeConfig": {
      "minBasePx": 16,
      "maxBasePx": 18,
      "minRatio": 1.2,
      "maxRatio": 1.25,
      "positiveSteps": 5,
      "negativeSteps": 2,
      "minViewportPx": 360,
      "maxViewportPx": 1280
    },
    "spacingBasePx": 4
  }
  ```
* **`window.__DESIGN_SYSTEM__.setBrand(hex)`**: Cambia el color de marca base y regenera la paleta de colores y contrastes automáticamente.
  * *Ejemplo:* `window.__DESIGN_SYSTEM__.setBrand('#ef4444')`
* **`window.__DESIGN_SYSTEM__.setContrastMode(mode)`**: Cambia el modo de contraste activo.
  * *Modos:* `'wcag2' | 'apca' | 'bridge'`

---

## 2. Bloque de Datos JSON Estático en el DOM

Para agentes o scrapers simples que solo leen el HTML estático de la página (sin ejecutar JavaScript complejo), la aplicación inyecta y actualiza dinámicamente un tag `<pre>` oculto con los tokens estructurados en JSON.

### Cómo extraer la información:
Solo necesitas leer el contenido de texto del elemento con el ID `#design-tokens-data`:
```javascript
const tokens = JSON.parse(document.getElementById('design-tokens-data').textContent);
```

---

## 3. Atributos de DOM Estables (`data-agent`)

Si controlas el navegador simulando interacciones humanas (haciendo clics y escribiendo texto), los siguientes elementos tienen selectores CSS estables e independientes de los cambios en los estilos visuales:

| Elemento | Selector CSS / Atributo | Función |
|---|---|---|
| Selector de Color Base | `input[data-agent="brand-color-picker"]` | Abre el selector nativo de color. |
| Input de Texto HEX | `input[data-agent="brand-color-input"]` | Permite escribir directamente un código hexadecimal (ej. `#3b82f6`). |
| Checkbox Target CSS | `input[data-agent="export-target-css-vars"]` | Activa/Desactiva exportación de CSS variables. |
| Checkbox Target Tailwind | `input[data-agent="export-target-tailwind"]` | Activa/Desactiva exportación de `tailwind.config.js`. |
| Checkbox Target DTCG | `input[data-agent="export-target-dtcg-json"]` | Activa/Desactiva exportación del JSON de W3C. |
| Botón de Descarga | `button[data-agent="download-zip-button"]` | Compila y descarga el archivo `.zip` con los assets. |
