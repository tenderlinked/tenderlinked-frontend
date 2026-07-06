const fs = require('fs');

const cssToInsert = `
  --color-on-primary: #ffffff;
  --color-surface-variant: #d3e4fe;
  --color-primary-fixed-dim: #67d9c9;
  --color-on-primary-fixed: #00201c;
  --color-inverse-primary: #67d9c9;
  --color-on-background: #0b1c30;
  --color-surface-tint: #006a60;
  --color-on-surface: #0b1c30;
  --color-surface-container-low: #eff4ff;
  --color-outline-variant: #bcc9c6;
  --color-error-container: #ffdad6;
  --color-on-primary-fixed-variant: #005048;
  --color-on-secondary-fixed: #001a41;
  --color-primary: #00685e;
  --color-surface: #f8f9ff;
  --color-tertiary-fixed-dim: #b5c8e5;
  --color-on-error-container: #93000a;
  --color-primary-container: #008377;
  --color-secondary-fixed-dim: #adc7ff;
  --color-background: #f8f9ff;
  --color-tertiary-container: #637690;
  --color-on-primary-container: #f4fffb;
  --color-secondary-fixed: #d8e2ff;
  --color-on-secondary: #ffffff;
  --color-surface-container-lowest: #ffffff;
  --color-on-tertiary-fixed: #081c32;
  --color-on-surface-variant: #3d4947;
  --color-surface-container: #e5eeff;
  --color-on-tertiary-container: #fdfcff;
  --color-inverse-surface: #213145;
  --color-secondary-container: #0070ea;
  --color-error: #ba1a1a;
  --color-tertiary: #4b5d76;
  --color-outline: #6d7a77;
  --color-surface-container-highest: #d3e4fe;
  --color-on-tertiary: #ffffff;
  --color-on-secondary-fixed-variant: #004493;
  --color-on-tertiary-fixed-variant: #364860;
  --color-inverse-on-surface: #eaf1ff;
  --color-surface-dim: #cbdbf5;
  --color-secondary: #0059bb;
  --color-surface-container-high: #dce9ff;
  --color-tertiary-fixed: #d2e4ff;
  --color-on-error: #ffffff;
  --color-on-secondary-container: #fefcff;
  --color-primary-fixed: #85f6e5;
  --color-surface-bright: #f8f9ff;

  --font-display-lg: "Work Sans", sans-serif;
  --font-headline-lg: "Work Sans", sans-serif;
  --font-headline-md: "Work Sans", sans-serif;
  --font-body-sm: "Inter", sans-serif;
  --font-body-lg: "Inter", sans-serif;
  --font-headline-lg-mobile: "Work Sans", sans-serif;
  --font-body-md: "Inter", sans-serif;
  --font-label-mono: "JetBrains Mono", monospace;

  --spacing-margin-desktop: 64px;
  --spacing-gutter: 24px;
  --spacing-max-width: 1280px;
  --spacing-margin-mobile: 16px;
  --spacing-unit: 4px;

  --text-display-lg: 48px;
  --text-display-lg--line-height: 56px;
  --text-display-lg--letter-spacing: -0.02em;
  --text-display-lg--font-weight: 700;

  --text-headline-lg: 32px;
  --text-headline-lg--line-height: 40px;
  --text-headline-lg--font-weight: 600;

  --text-headline-md: 24px;
  --text-headline-md--line-height: 32px;
  --text-headline-md--font-weight: 600;

  --text-body-sm: 14px;
  --text-body-sm--line-height: 20px;
  --text-body-sm--font-weight: 400;

  --text-body-lg: 18px;
  --text-body-lg--line-height: 28px;
  --text-body-lg--font-weight: 400;

  --text-headline-lg-mobile: 24px;
  --text-headline-lg-mobile--line-height: 32px;
  --text-headline-lg-mobile--font-weight: 600;

  --text-body-md: 16px;
  --text-body-md--line-height: 24px;
  --text-body-md--font-weight: 400;

  --text-label-mono: 12px;
  --text-label-mono--line-height: 16px;
  --text-label-mono--letter-spacing: 0.05em;
  --text-label-mono--font-weight: 500;
`;

let globalsCss = fs.readFileSync('app/globals.css', 'utf8');

if (globalsCss.includes('@theme inline {')) {
    globalsCss = globalsCss.replace('@theme inline {', '@theme inline {' + cssToInsert);
} else {
    globalsCss = '@theme {' + cssToInsert + '\n}\n' + globalsCss;
}

fs.writeFileSync('app/globals.css', globalsCss);
console.log('Added tailwind v4 theme variables to globals.css');
