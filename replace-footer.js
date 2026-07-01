const fs = require('fs');

let pageTsx = fs.readFileSync('app/page.tsx', 'utf8');

const oldFooterRegex = /<footer[\s\S]*?<\/footer>/;

if (oldFooterRegex.test(pageTsx)) {
    pageTsx = pageTsx.replace(oldFooterRegex, '<Footer />');
}

if (!pageTsx.includes('import Footer from')) {
    pageTsx = pageTsx.replace("import Header from '../components/Header';", "import Header from '../components/Header';\nimport Footer from '../components/Footer';");
}

fs.writeFileSync('app/page.tsx', pageTsx);
console.log('Replaced footer in page.tsx');
