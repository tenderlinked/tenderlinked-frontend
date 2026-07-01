const fs = require('fs');
let headerPath = 'components/Header.tsx';
let content = fs.readFileSync(headerPath, 'utf8');

content = content.replace(/\{\/\* Trust Badge \*\/\}[\s\S]*?<\/div>/, '');

fs.writeFileSync(headerPath, content);
console.log('Trust badge removed from header');
