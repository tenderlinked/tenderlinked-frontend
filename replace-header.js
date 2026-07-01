const fs = require('fs');

let pageTsx = fs.readFileSync('app/page.tsx', 'utf8');

// The old header starts with <header className="w-full top-0 sticky z-50 bg-surface
// and ends with </header>
// Let's replace it.
const oldHeaderRegex = /<header[\s\S]*?<\/header>/;

if (oldHeaderRegex.test(pageTsx)) {
    pageTsx = pageTsx.replace(oldHeaderRegex, '<Header />');
}

// Add the import at the top
if (!pageTsx.includes('import Header from')) {
    // Add import right after the first import or at the top if no imports
    if (pageTsx.includes('import')) {
        pageTsx = pageTsx.replace(/import(.*?)\n/, "import$1\nimport Header from '../components/Header';\n");
    } else {
        pageTsx = "import Header from '../components/Header';\n" + pageTsx;
    }
}

// Ensure "use client" is the very first line if present
if (pageTsx.includes("'use client';")) {
    pageTsx = pageTsx.replace("'use client';\n", "");
    pageTsx = "'use client';\n" + pageTsx;
}

// Also wait, I removed the scroll event listener from page.tsx for the old header, but it's not strictly necessary as it targets `document.querySelector('header')` which will now target the new header. But the new header has its own scroll logic. We should probably remove the old scroll logic from page.tsx to avoid conflicts.
const oldScrollLogic = /const handleScroll[\s\S]*?window\.addEventListener\('scroll', handleScroll\);[\s\S]*?return \(\) => window\.removeEventListener\('scroll', handleScroll\);/g;

pageTsx = pageTsx.replace(oldScrollLogic, '');

fs.writeFileSync('app/page.tsx', pageTsx);
console.log('Updated app/page.tsx to use the new Header component');
