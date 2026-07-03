export default { title: 'Foundations/Colour' };

const tones = [{"tone":"0","value":"#ffffff"},{"tone":"50","value":"#fde9e6"},{"tone":"100","value":"#fbd4cc"},{"tone":"200","value":"#f8a999"},{"tone":"300","value":"#f47d66"},{"tone":"400","value":"#fe3b1f"},{"tone":"500","value":"#ed2700"},{"tone":"600","value":"#d12200"},{"tone":"700","value":"#af1d00"},{"tone":"800","value":"#6c140f"},{"tone":"900","value":"#641000"},{"tone":"950","value":"#420b00"},{"tone":"1000","value":"#000000"}];

export const BrandRamp = () => {
  const sw = tones
    .map(
      (t) =>
        `<div style="flex:1;min-width:64px"><div style="height:64px;border-radius:8px;background:${t.value};border:1px solid #0001"></div><div style="font:12px sans-serif;margin-top:4px">${t.tone}<br><code>${t.value}</code></div></div>`,
    )
    .join('');
  return `<h3 style="font:600 14px sans-serif">EPL — brand ramp</h3><div style="display:flex;gap:8px;flex-wrap:wrap">${sw}</div>`;
};
