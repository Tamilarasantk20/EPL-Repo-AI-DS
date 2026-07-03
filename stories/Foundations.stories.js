export default { title: 'Foundations/Colour' };

const tones = [{"tone":"0","value":"#ffffff"},{"tone":"50","value":"#ebe6ec"},{"tone":"100","value":"#efe1f2"},{"tone":"200","value":"#dcbde4"},{"tone":"300","value":"#bd8bcb"},{"tone":"400","value":"#8f4fa3"},{"tone":"500","value":"#37003c"},{"tone":"600","value":"#300035"},{"tone":"700","value":"#29002c"},{"tone":"800","value":"#200023"},{"tone":"900","value":"#170019"},{"tone":"950","value":"#0f0011"},{"tone":"1000","value":"#000000"}];

export const BrandRamp = () => {
  const sw = tones
    .map(
      (t) =>
        `<div style="flex:1;min-width:64px"><div style="height:64px;border-radius:8px;background:${t.value};border:1px solid #0001"></div><div style="font:12px sans-serif;margin-top:4px">${t.tone}<br><code>${t.value}</code></div></div>`,
    )
    .join('');
  return `<h3 style="font:600 14px sans-serif">EPL — brand ramp</h3><div style="display:flex;gap:8px;flex-wrap:wrap">${sw}</div>`;
};
