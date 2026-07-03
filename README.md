# EPL Design System

Generated from **Base BNTS DS v1.0.0** by the brand generator (playbook Step 9/10).

- **Base is untouched.** This repo inherits the base `semantic` tier, `base` tier,
  and every headless `component` unchanged. Only the `core` tier carries
  EPL's values (55 overridden primitives: the brand red ramp seeded on
  **Fired Up** `#ED2700`, the **Charcoal/Tortilla** neutral ramp, the **Rojo Red**
  error ramp, the **Aqua** info ramp, and the **Barlow**/**Epilogue** fonts).
  Success (green), warning (orange) and the radius scale have no brand source in
  Figma and inherit the base unchanged.
- **Source of truth is still code.** Figma reads from these tokens, not the reverse.
- **To update:** change the EPL Figma file, then re-run the generator
  (`node scripts/generate-brand.mjs && npm run build`).
  Do not hand-edit `tokens/semantic` or `tokens/base` — they belong to the base.

## Build

```bash
npm install
npm run build          # tokens/{core,semantic,base} -> build/css + build/json
open preview/index.html # zero-install component gallery in the brand style
```

## Storybook

```bash
npm run build && npm run storybook
```

## What came from the Figma file

See `MAPPING-REVIEW.md` for the full base-parameter ↔ Figma-value mapping table,
and `brand.config.json` for machine-readable provenance. Every overridden token
also records its origin in `$extensions.bnts.source`.
