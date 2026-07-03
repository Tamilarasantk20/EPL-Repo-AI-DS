#!/usr/bin/env node
/**
 * EPL brand generator — playbook Step 9/10.
 *
 * Reads the brand design profile (extracted from the EPL Figma file via the
 * Figma MCP `get_variable_defs`, node 27-4360 of file I2GdUXZBUMWfKtkarhOS4I)
 * and regenerates the `core` token tier so EPL's values ride on top of the
 * inherited base `semantic`/`base` tiers and headless components.
 *
 * Only the `core` tier is touched. Families with no brand source
 * (green=success, orange=warning) and the radius scale fall back to the
 * base BNTS values and are recorded as `inherited`.
 *
 * Re-run:  node scripts/generate-brand.mjs
 * then:    npm run build
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(ROOT, ...s);
const readJSON = (f) => JSON.parse(readFileSync(p(f), 'utf8'));
const writeJSON = (f, o) => writeFileSync(p(f), JSON.stringify(o, null, 2) + '\n');

/* ---------------------------------------------------------------- profile -- */
// Generated-at is fixed input (kept out of the git-tracked config to avoid
// spurious diffs); override with GENERATED_AT if you want a fresh stamp.
const GENERATED_AT = process.env.GENERATED_AT || '2026-07-03T00:00:00.000Z';

const FIGMA_FILE = 'https://www.figma.com/design/I2GdUXZBUMWfKtkarhOS4I/EPL-AI-DS?node-id=27-4360';

const profile = {
  fonts: {
    // Body/UI copy is set in Epilogue; headings, buttons, labels and tags in Barlow.
    primary: { value: "'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", source: 'Figma: body font (Epilogue)' },
    secondary: { value: "'Barlow', sans-serif", source: 'Figma: UI/label font (Barlow)' },
    display: { value: "'Barlow', sans-serif", source: 'Figma: heading font (Barlow)' },
  },
  // seed = tone 500. corrections pin a real Figma swatch at a specific tone.
  seeds: {
    brand: { seed: '#ED2700', label: 'color/brand (Fired Up seed)', corrections: { 400: { value: '#FE3B1F', name: 'Rojo Red' }, 800: { value: '#6C140F', name: 'Pinto' } } },
    red: { seed: '#FE3B1F', label: 'color/error (Rojo Red seed)' },
    blue: { seed: '#4C919A', label: 'color/info (Aqua seed)' },
  },
  // Neutral ramp is anchored on the real brand greys; gaps are interpolated.
  neutralAnchors: {
    0: { value: '#ffffff', name: 'White' },
    50: { value: '#F8F8F8', name: 'Sugar Skull White' },
    100: { value: '#EFEFE7', name: 'Tortilla' },
    400: { value: '#ACACAC', name: 'Light Grey' },
    600: { value: '#696969', name: 'Dark Grey' },
    900: { value: '#262626', name: 'Charcoal' },
    950: { value: '#222323', name: 'Charcoal deep' },
    1000: { value: '#000000', name: 'Black' },
  },
  inheritColor: ['green', 'orange'], // no brand source -> mirror base
  inheritRadius: true,
};

// Base BNTS values used for inherited families / radius (mirror of base-bnts-ds).
const BASE = {
  green: { '0': '#ffffff', '50': '#ebfbee', '100': '#d3f9d8', '200': '#b2f2bb', '300': '#8ce99a', '400': '#69db7c', '500': '#51cf66', '600': '#40c057', '700': '#37b24d', '800': '#2f9e44', '900': '#2b8a3e', '950': '#165225', '1000': '#000000' },
  orange: { '0': '#ffffff', '50': '#fff4e6', '100': '#ffe8cc', '200': '#ffd8a8', '300': '#ffc078', '400': '#ffa94d', '500': '#ff922b', '600': '#fd7e14', '700': '#f76707', '800': '#e8590c', '900': '#d9480f', '950': '#7d2d08', '1000': '#000000' },
  radius: { none: '0px', '2xs': '2px', xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px', '3xl': '32px', full: '9999px', circle: '50%' },
};

/* ------------------------------------------------------------- ramp math -- */
// Reverse-engineered from the base ramps: tints mix the seed toward white,
// shades scale the seed toward black.
const TINT = { 0: 1.0, 50: 0.9, 100: 0.8, 200: 0.6, 300: 0.4, 400: 0.2 };
const SHADE = { 600: 0.88, 700: 0.74, 800: 0.58, 900: 0.42, 950: 0.28, 1000: 0.0 };
const TONES = ['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '1000'];

const hexToRgb = (h) => { const n = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)); };
const rgbToHex = (rgb) => '#' + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
const tint = (seed, t) => rgbToHex(hexToRgb(seed).map((c) => c + (255 - c) * t));
const shade = (seed, m) => rgbToHex(hexToRgb(seed).map((c) => c * m));

function rampFromSeed(seed) {
  const out = {};
  for (const [tone, t] of Object.entries(TINT)) out[tone] = tint(seed, t);
  out['500'] = seed.toLowerCase();
  for (const [tone, m] of Object.entries(SHADE)) out[tone] = shade(seed, m);
  return out;
}

function neutralRamp(anchors) {
  const known = Object.keys(anchors).map(Number).sort((a, b) => a - b);
  const idx = (tone) => TONES.indexOf(String(tone));
  const out = {};
  for (const tone of TONES) {
    const n = Number(tone);
    if (anchors[n]) { out[tone] = { value: anchors[n].value.toLowerCase(), derived: false, name: anchors[n].name }; continue; }
    // interpolate in RGB between the nearest lower and higher anchors, by tone index
    const lo = [...known].reverse().find((k) => k < n);
    const hi = known.find((k) => k > n);
    const f = (idx(tone) - idx(lo)) / (idx(hi) - idx(lo));
    const c = hexToRgb(anchors[lo].value).map((a, i) => a + (hexToRgb(anchors[hi].value)[i] - a) * f);
    out[tone] = { value: rgbToHex(c), derived: true };
  }
  return out;
}

/* --------------------------------------------------------- build results -- */
const mappings = [];
const push = (param, value, source, confidence, note) => mappings.push({ param, value, source, confidence, ...(note ? { note } : {}) });

const corrections = {};

// brand ramp
const brand = rampFromSeed(profile.seeds.brand.seed);
for (const tone of TONES) {
  const corr = profile.seeds.brand.corrections[tone];
  if (corr) {
    brand[tone] = corr.value.toLowerCase();
    corrections[`color.brand.${tone}`] = corr.value.toLowerCase();
    push(`color.brand.${tone}`, brand[tone], `designer (corrected — ${corr.name})`, 'corrected', 'real brand swatch pinned at this tone');
  } else if (tone === '500') {
    push(`color.brand.${tone}`, brand[tone], `Figma: ${profile.seeds.brand.label}`, 'high', 'the seed swatch');
  } else {
    push(`color.brand.${tone}`, brand[tone], `Figma: ${profile.seeds.brand.label}`, 'derived', 'tinted/shaded from the seed — confirm');
  }
}

// neutral ramp
const neutral = neutralRamp(profile.neutralAnchors);
const neutralValues = {};
for (const tone of TONES) {
  const n = neutral[tone];
  neutralValues[tone] = n.value;
  if (n.derived) push(`color.neutral.${tone}`, n.value, 'Figma: color/neutral (interpolated)', 'derived', 'interpolated between real brand greys — confirm');
  else push(`color.neutral.${tone}`, n.value, `Figma: ${n.name}`, 'high');
}

// error (red) + info (blue) seeded ramps
const seededRamps = {};
for (const fam of ['red', 'blue']) {
  const ramp = rampFromSeed(profile.seeds[fam].seed);
  seededRamps[fam] = ramp;
  for (const tone of TONES) {
    if (tone === '500') push(`color.${fam}.${tone}`, ramp[tone], `Figma: ${profile.seeds[fam].label}`, 'high', 'the seed swatch');
    else push(`color.${fam}.${tone}`, ramp[tone], `Figma: ${profile.seeds[fam].label}`, 'derived', 'tinted/shaded from the seed — confirm');
  }
}

// inherited color families
for (const fam of profile.inheritColor) push(`color.${fam}.*`, '(inherited)', '—', 'inherited', 'no brand source in Figma — inherited from base');

// fonts
for (const [k, v] of Object.entries(profile.fonts)) push(`font.family.${k}`, v.value, `${v.source}`, 'high');

// inherited scales
if (profile.inheritRadius) push('radius.*', '(inherited)', '—', 'inherited', 'no radius variables in Figma — inherited from base');
push('spacing.*', '(inherited)', '—', 'inherited', 'whole scale inherited from base');

/* ------------------------------------------------------ apply to core/*.json */
function setColorFamily(color, fam, values, sources) {
  for (const tone of TONES) {
    const node = color[fam][tone];
    node.$value = values[tone];
    if (sources) node.$extensions = { bnts: sources[tone] };
    else if (node.$extensions) delete node.$extensions;
  }
}

const colorFile = readJSON('tokens/core/color.json');
const color = colorFile.color;

const srcOf = (param) => { const m = mappings.find((x) => x.param === param); return { source: m.source, confidence: m.confidence }; };
const familySources = (fam) => Object.fromEntries(TONES.map((t) => [t, srcOf(`color.${fam}.${t}`)]));

setColorFamily(color, 'brand', brand, familySources('brand'));
setColorFamily(color, 'neutral', neutralValues, familySources('neutral'));
setColorFamily(color, 'red', seededRamps.red, familySources('red'));
setColorFamily(color, 'blue', seededRamps.blue, familySources('blue'));
// inherited: revert to base, drop bnts override marker
setColorFamily(color, 'green', BASE.green, null);
setColorFamily(color, 'orange', BASE.orange, null);
writeJSON('tokens/core/color.json', colorFile);

// typography families
const typo = readJSON('tokens/core/typography.json');
for (const [k, v] of Object.entries(profile.fonts)) {
  typo.font.family[k].$value = v.value;
  typo.font.family[k].$extensions = { bnts: { source: v.source, confidence: 'high' } };
}
writeJSON('tokens/core/typography.json', typo);

// radius: revert to base, drop bnts marker
const radiusFile = readJSON('tokens/core/radius.json');
for (const [k, val] of Object.entries(BASE.radius)) {
  if (radiusFile.radius[k]) { radiusFile.radius[k].$value = val; if (radiusFile.radius[k].$extensions) delete radiusFile.radius[k].$extensions; }
}
writeJSON('tokens/core/radius.json', radiusFile);

/* ------------------------------------------------- figma/tokens.studio.json */
const studio = readJSON('figma/tokens.studio.json');
const setStudioFamily = (fam, values) => { for (const tone of TONES) studio.color[fam][tone] = { $value: values[tone], $type: 'color' }; };
setStudioFamily('brand', brand);
setStudioFamily('neutral', neutralValues);
setStudioFamily('red', seededRamps.red);
setStudioFamily('blue', seededRamps.blue);
setStudioFamily('green', BASE.green);
setStudioFamily('orange', BASE.orange);
for (const [k, val] of Object.entries(BASE.radius)) if (studio.radius[k]) studio.radius[k] = { $value: val, $type: 'dimension' };
for (const [k, v] of Object.entries(profile.fonts)) studio.font.family[k] = { $value: v.value, $type: 'fontFamily' };
writeJSON('figma/tokens.studio.json', studio);

/* ---------------------------------------------------- mapping.draft + review */
const overrides = mappings.filter((m) => m.confidence !== 'inherited' && !m.param.endsWith('.*')).length;
const draft = {
  brand: { name: 'EPL', slug: 'epl' },
  source: { tool: 'figma', files: [FIGMA_FILE], note: 'Extracted from the EPL Figma file via the Figma MCP get_variable_defs on node 27-4360.' },
  generatedAt: GENERATED_AT,
  warnings: [],
  mappings,
};
writeJSON('mapping.draft.json', draft);
writeJSON('mapping.corrections.json', { '//': 'Designer review corrections for the EPL brand. Flat map of base.parameter -> corrected value. Pins the real brand swatches (Rojo Red, Pinto) at their nearest tone on the auto-derived brand red ramp.', ...corrections });

const counts = { high: 0, derived: 0, corrected: 0, inherited: 0 };
for (const m of mappings) if (!m.param.endsWith('.*')) counts[m.confidence]++;

const rows = mappings.map((m) => `| \`${m.param}\` | \`${m.value}\` | ${m.source} | ${m.confidence} | ${m.note || ''} |`).join('\n');
const md = `# Brand mapping review — EPL

> Auto-generated draft. **Review and correct before generating.**
> Source Figma file: ${FIGMA_FILE}

The EPL brand is a warm red / charcoal system. The hero red (**Fired Up** \`#ED2700\`)
seeds the brand ramp, with **Rojo Red** and **Pinto** pinned as real swatches.
Neutrals come from the brand greys (**Charcoal**, **Tortilla**, **Sugar Skull White**,
**Light/Dark Grey**). **Aqua** seeds the info ramp and **Rojo Red** the error ramp.
Type is **Barlow** (headings/UI) over **Epilogue** (body). Success (green) and
warning (orange) have no brand source and inherit the base; radius inherits the base.

## Mapping

| Base parameter | Value | From Figma | Confidence | Note |
|---|---|---|---|---|
${rows}

_${counts.high} read directly · ${counts.derived} derived (please check) · ${counts.corrected} corrected · ${profile.inheritColor.length * 13 + Object.keys(BASE.radius).length} inherited from base._

## How to correct
Edit \`mapping.corrections.json\` (a flat \`{ "base.param": "value" }\` map),
then re-run \`node scripts/generate-brand.mjs\`.
`;
writeFileSync(p('MAPPING-REVIEW.md'), md);

/* ------------------------------------------------------------- brand.config */
writeJSON('brand.config.json', {
  brand: 'EPL',
  slug: 'epl',
  generatedFrom: 'base-bnts-ds@1.0.0',
  generatedAt: GENERATED_AT,
  source: { tool: 'figma', files: [FIGMA_FILE], note: 'Design profile extracted from the EPL Figma file via the Figma MCP get_variable_defs (node 27-4360).' },
  overrides,
  warnings: [],
});

/* -------------------------------------------------- stories/Foundations.js  */
const tonesJs = TONES.map((t) => ({ tone: t, value: brand[t] }));
const stories = `export default { title: 'Foundations/Colour' };

const tones = ${JSON.stringify(tonesJs)};

export const BrandRamp = () => {
  const sw = tones
    .map(
      (t) =>
        \`<div style="flex:1;min-width:64px"><div style="height:64px;border-radius:8px;background:\${t.value};border:1px solid #0001"></div><div style="font:12px sans-serif;margin-top:4px">\${t.tone}<br><code>\${t.value}</code></div></div>\`,
    )
    .join('');
  return \`<h3 style="font:600 14px sans-serif">EPL — brand ramp</h3><div style="display:flex;gap:8px;flex-wrap:wrap">\${sw}</div>\`;
};
`;
writeFileSync(p('stories/Foundations.stories.js'), stories);

console.log(`EPL brand generated: ${overrides} core overrides (brand+neutral+red+blue+fonts), green/orange/radius inherited from base.`);
console.log(`Confidence: ${counts.high} high · ${counts.derived} derived · ${counts.corrected} corrected.`);
