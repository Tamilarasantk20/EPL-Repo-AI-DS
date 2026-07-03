// Load the brand token cascade + component styles into every story.
// Run `npm run build` first so build/css/*.css exist.
import '../build/css/core.css';
import '../build/css/semantic.css';
import '../build/css/base.css';

const importAllComponentCss = import.meta.glob('../components/**/*.css', { eager: true });
void importAllComponentCss;

export const parameters = {
  backgrounds: { default: 'page' },
};
