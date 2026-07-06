const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');
content = content.replace(/\\\"'FILL' 1\\\"/g, "\"'FILL' 1\"");
fs.writeFileSync('app/page.tsx', content);
console.log('Fixed fontVariationSettings literal backslashes');
