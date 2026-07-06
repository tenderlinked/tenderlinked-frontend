const fs = require('fs');
let content = fs.readFileSync('app/page.tsx', 'utf8');
content = content.split("style={{ fontVariationSettings: ''FILL' 1' }}").join("style={{ fontVariationSettings: \\\"'FILL' 1\\\" }}");
fs.writeFileSync('app/page.tsx', content);
console.log('Fixed fontVariationSettings in page.tsx');
