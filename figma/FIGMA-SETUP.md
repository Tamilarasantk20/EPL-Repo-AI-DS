# EPL — Figma library setup

This brand has its **own** Figma library, separate from the base library.
Code is the source of truth; Figma reads from it (one-directional) via Tokens Studio.

## Steps (mirrors the base's Step 6, scoped to this brand)

1. In a **new Figma file** for EPL, install the **Tokens Studio** plugin.
2. Plugin → **Settings → Sync → Git (GitHub)**. Point it at this brand repo.
3. Set the token source to `figma/tokens.studio.json` (or the `tokens/` folder directly).
4. Pull. Tokens Studio creates Figma **Variables** whose names match the code
   (`color.brand.500`, `radius.md`, `font.family.primary`, ...).
5. Keep it **one-directional**: designers never push token edits from Figma back to
   code. Brand value changes happen in the EPL Figma design file and
   flow through the generator.

> Confirm current Tokens Studio + Figma Variables behaviour against their live docs;
> plugin settings move between versions.
