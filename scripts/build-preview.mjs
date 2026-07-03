#!/usr/bin/env node
/**
 * Bundle a single self-contained preview of the EPL design system.
 *
 * Inlines the built token CSS (core/semantic/base) and renders every headless
 * component in an isolated <iframe srcdoc> — so the output has no external
 * paths and opens anywhere without a server. Also renders the colour ramps and
 * type specimens straight from the built core tokens.
 *
 * Run:  npm run build && node scripts/build-preview.mjs
 * Out:  preview/epl-preview.html  (gitignored — regenerate as needed)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const R = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = (f) => readFileSync(join(R, 'build/css', `${f}.css`), 'utf8');
const tokens = ['core', 'semantic', 'base'].map(css).join('\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const comps = readdirSync(join(R, 'components'))
  .filter((d) => existsSync(join(R, 'components', d, `${d}.html`)))
  .sort();

const cards = comps.map((name) => {
  const html = readFileSync(join(R, 'components', name, `${name}.html`), 'utf8');
  const cPath = join(R, 'components', name, `${name}.css`);
  const compCss = existsSync(cPath) ? readFileSync(cPath, 'utf8') : '';
  const pageStyle = (html.match(/<style>([\s\S]*?)<\/style>/i) || [, ''])[1];
  const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, ''])[1];
  const srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${tokens}\n${compCss}\n${pageStyle}\nbody{padding:16px;margin:0}</style></head><body>${body}</body></html>`;
  return `<div class="card"><h2>${name}</h2><iframe loading="lazy" srcdoc="${esc(srcdoc)}"></iframe></div>`;
}).join('\n');

const coreCss = css('core');
const fams = ['brand', 'neutral', 'red', 'blue', 'green', 'orange'];
const tones = ['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950', '1000'];
const val = (f, t) => (coreCss.match(new RegExp(`--ds-color-${f}-${t}:\\s*([^;]+);`)) || [, '#ccc'])[1].trim();
const ramps = fams.map((f) => `<div class="ramp"><div class="rlabel">${f}${['green', 'orange'].includes(f) ? ' <span class=inh>(inherited from base)</span>' : ''}</div><div class="rrow">${tones.map((t) => `<div class="sw" style="background:${val(f, t)}"><span>${t}</span><code>${val(f, t)}</code></div>`).join('')}</div></div>`).join('');

const out = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EPL Design System — preview</title>
<style>${tokens}</style>
<style>
  body{font-family:var(--ds-font-family-primary,sans-serif);background:var(--ds-surface-page,#fff);color:var(--ds-content-text-primary,#111);margin:0;padding:2rem}
  header h1{font-family:var(--ds-font-family-display,sans-serif);font-size:2rem;margin:0 0 .25rem;color:var(--ds-color-brand-500)}
  .sub{color:var(--ds-content-text-secondary);font-size:.9rem;margin-top:0}
  h3{font-family:var(--ds-font-family-display);text-transform:uppercase;letter-spacing:.06em;font-size:.85rem;color:var(--ds-content-text-secondary);margin:2.2rem 0 .8rem;border-bottom:1px solid var(--ds-color-neutral-200);padding-bottom:.4rem}
  .ramp{margin-bottom:.9rem}
  .rlabel{font-weight:700;font-size:.8rem;margin-bottom:.3rem;text-transform:capitalize}
  .inh{font-weight:400;color:var(--ds-content-text-secondary);text-transform:none}
  .rrow{display:flex;gap:4px;flex-wrap:wrap}
  .sw{flex:1;min-width:60px;height:56px;border-radius:6px;border:1px solid #0001;display:flex;flex-direction:column;justify-content:flex-end;padding:4px;box-sizing:border-box}
  .sw span{font:700 10px sans-serif;color:#fff;mix-blend-mode:difference}
  .sw code{font:9px monospace;color:#fff;mix-blend-mode:difference}
  .type-row{display:flex;align-items:baseline;gap:1rem;margin:.4rem 0;flex-wrap:wrap}
  .type-row .meta{font:12px monospace;color:var(--ds-content-text-secondary)}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1rem;margin-top:1rem}
  .card{border:1px solid var(--ds-color-neutral-200);border-radius:10px;overflow:hidden;background:var(--ds-surface-card,#fff)}
  .card h2{font:600 .72rem/1 sans-serif;text-transform:uppercase;letter-spacing:.05em;margin:0;padding:.6rem .9rem;border-bottom:1px solid var(--ds-color-neutral-100);color:var(--ds-content-text-secondary)}
  iframe{width:100%;height:300px;border:0;background:#fff}
</style></head>
<body>
<header>
  <h1>EPL Design System</h1>
  <p class="sub">Generated from Base BNTS DS · warm red / charcoal brand · Barlow + Epilogue · ${comps.length} headless components, unchanged, restyled purely by tokens.</p>
</header>

<h3>Colour foundations (core tier)</h3>
${ramps}

<h3>Typography</h3>
<div class="type-row"><span style="font-family:var(--ds-font-family-display);font-weight:700;font-size:2rem">Barlow Bold</span><span class="meta">font.family.display / heading</span></div>
<div class="type-row"><span style="font-family:var(--ds-font-family-secondary);font-weight:700;font-size:1.1rem">Barlow — buttons, labels, tags</span><span class="meta">font.family.secondary</span></div>
<div class="type-row"><span style="font-family:var(--ds-font-family-primary);font-size:1rem">Epilogue — body copy set in the primary family for comfortable reading.</span><span class="meta">font.family.primary / body</span></div>

<h3>Components (${comps.length})</h3>
<div class="grid">
${cards}
</div>
</body></html>`;

writeFileSync(join(R, 'preview/epl-preview.html'), out);
console.log(`wrote preview/epl-preview.html — ${comps.length} components, ${(out.length / 1024).toFixed(0)} KB`);
