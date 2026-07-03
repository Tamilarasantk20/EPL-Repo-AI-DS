export default { title: 'Components/Button' };

const btn = (variant, size, label, extra = '') =>
  `<button class="ds-button ds-button--${variant} ds-button--${size}" ${extra}>${label}</button>`;

export const Primary = () => btn('primary', 'md', 'Primary');
export const Secondary = () => btn('secondary', 'md', 'Secondary');
export const Ghost = () => btn('ghost', 'md', 'Ghost');
export const Destructive = () => btn('destructive', 'md', 'Delete');
export const Sizes = () =>
  `<div style="display:flex;gap:.75rem;align-items:center">${btn('primary', 'sm', 'Small')}${btn('primary', 'md', 'Medium')}${btn('primary', 'lg', 'Large')}</div>`;
export const States = () =>
  `<div style="display:flex;gap:.75rem;align-items:center">${btn('primary', 'md', 'Default')}${btn('primary', 'md', 'Disabled', 'disabled')}</div>`;
