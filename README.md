# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Client logo assets

Logos render in a fixed 5:2 box (80% width, max 64px tall, `object-fit: contain`), so empty space inside the file makes the logo look small.

- **Format:** transparent PNG or SVG (JPG only if the background is pure white).
- **Size:** about 300 × 120 px for wide logos, 200 × 200 px for square crests. Make them at least 2× the display size so they stay sharp.
- **Crop:** tight to the edges of the logo, with no more than about 4px of padding.
- **Re-export these first:** `KDU.jpg` and `UOVT.png` (lots of empty space), `AV Productions.jpg` (logo is tiny inside the frame) and `ADB.jpg` (only about 60px, too low-resolution).
