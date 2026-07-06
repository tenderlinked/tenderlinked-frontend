const fs = require('fs');
let headerPath = 'components/Header.tsx';
let content = fs.readFileSync(headerPath, 'utf8');

// 1. Remove Search button from desktop
content = content.replace(/\{\/\* Search Shortcut \*\/\}[\s\S]*?<\/button>/, '');

// 2. Remove Search input from mobile
content = content.replace(/\{\/\* Search \*\/\}[\s\S]*?<\/div>/, '');

// 3. Remove Book Demo button from desktop
content = content.replace(/<motion\.button[\s\S]*?>[\s]*Book Demo[\s\S]*?<\/motion\.button>/, '');

// 4. Remove Book Demo button from mobile
content = content.replace(/<button className="w-full text-\[16px\] font-medium text-\[#111827\].*?>[\s]*Book Demo[\s]*<\/button>/, '');

// 5. Remove Authorities from navItems
content = content.replace(/\{\s*name:\s*"Authorities"[^}]*\},\s*/, '');

// 6. Make width wider
content = content.replace(/max-w-\[1280px\]/, 'max-w-[1536px]');

fs.writeFileSync(headerPath, content);
console.log('Header updated successfully');
