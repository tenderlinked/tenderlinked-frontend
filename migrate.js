const fs = require('fs');

// 1. Update tailwind.config.ts
let tailwindConfig = fs.readFileSync('tailwind.config.ts', 'utf8');

const colorsToInsert = `
        'on-primary': '#ffffff',
        'surface-variant': '#d3e4fe',
        'primary-fixed-dim': '#67d9c9',
        'on-primary-fixed': '#00201c',
        'inverse-primary': '#67d9c9',
        'on-background': '#0b1c30',
        'surface-tint': '#006a60',
        'on-surface': '#0b1c30',
        'surface-container-low': '#eff4ff',
        'outline-variant': '#bcc9c6',
        'error-container': '#ffdad6',
        'on-primary-fixed-variant': '#005048',
        'on-secondary-fixed': '#001a41',
        'primary': '#00685e',
        'surface': '#f8f9ff',
        'tertiary-fixed-dim': '#b5c8e5',
        'on-error-container': '#93000a',
        'primary-container': '#008377',
        'secondary-fixed-dim': '#adc7ff',
        'background': '#f8f9ff',
        'tertiary-container': '#637690',
        'on-primary-container': '#f4fffb',
        'secondary-fixed': '#d8e2ff',
        'on-secondary': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'on-tertiary-fixed': '#081c32',
        'on-surface-variant': '#3d4947',
        'surface-container': '#e5eeff',
        'on-tertiary-container': '#fdfcff',
        'inverse-surface': '#213145',
        'secondary-container': '#0070ea',
        'error': '#ba1a1a',
        'tertiary': '#4b5d76',
        'outline': '#6d7a77',
        'surface-container-highest': '#d3e4fe',
        'on-tertiary': '#ffffff',
        'on-secondary-fixed-variant': '#004493',
        'on-tertiary-fixed-variant': '#364860',
        'inverse-on-surface': '#eaf1ff',
        'surface-dim': '#cbdbf5',
        'secondary': '#0059bb',
        'surface-container-high': '#dce9ff',
        'tertiary-fixed': '#d2e4ff',
        'on-error': '#ffffff',
        'on-secondary-container': '#fefcff',
        'primary-fixed': '#85f6e5',
        'surface-bright': '#f8f9ff',
`;

const fontsToInsert = `
        'display-lg': ['Work Sans', 'sans-serif'],
        'headline-lg': ['Work Sans', 'sans-serif'],
        'headline-md': ['Work Sans', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'headline-lg-mobile': ['Work Sans', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'label-mono': ['JetBrains Mono', 'monospace'],
`;

const fontSizesToInsert = `
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-mono': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }],
`;

const spacingToInsert = `
        'margin-desktop': '64px',
        gutter: '24px',
        'max-width': '1280px',
        'margin-mobile': '16px',
        unit: '4px',
`;

tailwindConfig = tailwindConfig.replace(/colors: \{/, 'colors: {\n' + colorsToInsert);
tailwindConfig = tailwindConfig.replace(/fontFamily: \{/, 'fontFamily: {\n' + fontsToInsert);
if (tailwindConfig.includes('spacing: {')) {
    tailwindConfig = tailwindConfig.replace(/spacing: \{/, 'spacing: {\n' + spacingToInsert);
} else {
    tailwindConfig = tailwindConfig.replace(/extend: \{/, 'extend: {\n      spacing: {\n' + spacingToInsert + '      },');
}

if (tailwindConfig.includes('fontSize: {')) {
    tailwindConfig = tailwindConfig.replace(/fontSize: \{/, 'fontSize: {\n' + fontSizesToInsert);
} else {
    tailwindConfig = tailwindConfig.replace(/extend: \{/, 'extend: {\n      fontSize: {\n' + fontSizesToInsert + '      },');
}

fs.writeFileSync('tailwind.config.ts', tailwindConfig);
console.log('tailwind.config.ts updated');


// 2. Generate page.tsx
let html = fs.readFileSync('../screen.html', 'utf8');

const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!bodyMatch) {
    console.error('No body found in screen.html');
    process.exit(1);
}
let bodyHtml = bodyMatch[1];

bodyHtml = bodyHtml.replace(/<script>[\s\S]*?<\/script>/gi, '');

let jsx = bodyHtml
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<input([^>]*?)>/g, (match, p1) => {
        if (p1.endsWith('/')) return match;
        return `<input${p1} />`;
    })
    .replace(/<img([^>]*?)>/g, (match, p1) => {
        if (p1.endsWith('/')) return match;
        return `<img${p1} />`;
    })
    .replace(/<br>/g, '<br />')
    .replace(/style="([^"]*)"/g, (match, styleString) => {
        const styleObj = {};
        styleString.split(';').forEach(style => {
            const parts = style.split(':');
            if (parts.length === 2) {
                const key = parts[0].trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                styleObj[key] = parts[1].trim();
            }
        });
        return `style={{ ${Object.entries(styleObj).map(([k, v]) => `${k}: '${v}'`).join(', ')} }}`;
    })
    .replace(/<!--[\s\S]*?-->/g, ''); // remove html comments

const pageContent = `'use client';
import { useEffect } from 'react';

export default function Home() {
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.stat-card').forEach(el => {
            el.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700');
            observer.observe(el);
        });

        const handleScroll = () => {
            const header = document.querySelector('header');
            if (header) {
                if (window.scrollY > 50) {
                    header.classList.add('h-16', 'shadow-md', 'glass-effect');
                    header.classList.remove('h-20');
                } else {
                    header.classList.remove('h-16', 'shadow-md', 'glass-effect');
                    header.classList.add('h-20');
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-surface text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
            ${jsx}
        </div>
    );
}
`;

fs.writeFileSync('app/page.tsx', pageContent);
console.log('app/page.tsx generated successfully.');

// 3. Update globals.css
let globalsCss = fs.readFileSync('app/globals.css', 'utf8');
const extraCss = `
.material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
.glass-effect {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
.zebra-table tr:nth-child(even) {
    background-color: #f8f9ff;
}
.stat-card:hover {
    box-shadow: 0px 4px 20px rgba(0,0,0,0.05);
}
`;
fs.writeFileSync('app/globals.css', globalsCss + '\n' + extraCss);
console.log('app/globals.css updated successfully.');

// 4. Update layout.tsx
let layoutTsx = fs.readFileSync('app/layout.tsx', 'utf8');
if (!layoutTsx.includes('Material+Symbols+Outlined')) {
    layoutTsx = layoutTsx.replace(
        /<body/g,
        '<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />\n<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&family=JetBrains+Mono:wght@100..900&display=swap" rel="stylesheet" />\n<body'
    );
    fs.writeFileSync('app/layout.tsx', layoutTsx);
    console.log('app/layout.tsx updated successfully.');
}

