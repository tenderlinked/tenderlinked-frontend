const fs = require('fs');

let headerTsx = fs.readFileSync('components/Header.tsx', 'utf8');

if (!headerTsx.includes('import { usePathname }')) {
    headerTsx = headerTsx.replace('import React, { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";\nimport { usePathname } from "next/navigation";');
}

// Add pathname hook
if (!headerTsx.includes('const pathname = usePathname();')) {
    headerTsx = headerTsx.replace('const [activeDropdown, setActiveDropdown] = useState<string | null>(null);', 'const [activeDropdown, setActiveDropdown] = useState<string | null>(null);\n  const pathname = usePathname();');
}

// Update navItems definition
const oldNavItems = /const navItems = \[[\s\S]*?\];/;
const newNavItems = `const navItems = [
    { name: "Tenders", path: "/" },
    { name: "Sectors", path: "/sectors" },
    { name: "Analysis", path: "/analysis" },
    { name: "Pricing", path: "/pricing" },
  ].map(item => ({ ...item, active: pathname === item.path }));`;

headerTsx = headerTsx.replace(oldNavItems, newNavItems);

fs.writeFileSync('components/Header.tsx', headerTsx);
console.log('Header navigation links updated dynamically');
