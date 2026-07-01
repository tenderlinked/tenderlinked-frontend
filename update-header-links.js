const fs = require('fs');

let headerTsx = fs.readFileSync('components/Header.tsx', 'utf8');

// Ensure Link is imported if not already, wait Next.js Link usually imported? Let's check
if (!headerTsx.includes('import Link from "next/link";')) {
    headerTsx = headerTsx.replace('import { usePathname } from "next/navigation";', 'import { usePathname } from "next/navigation";\nimport Link from "next/link";');
}

// Replace desktop login
headerTsx = headerTsx.replace(
  /<a\s*href="#"\s*className="text-\[15px\] font-medium text-\[#111827\] dark:text-gray-200 hover:text-\[#2563EB\] transition-colors"\s*>\s*Login\s*<\/a>/,
  '<Link href="/auth/login" className="text-[15px] font-medium text-[#111827] dark:text-gray-200 hover:text-[#2563EB] transition-colors">\n            Login\n          </Link>'
);

// Replace mobile login
headerTsx = headerTsx.replace(
  /<a\s*href="#"\s*className="text-center text-\[16px\] font-medium text-\[#111827\] dark:text-gray-200 py-3"\s*>\s*Login\s*<\/a>/,
  '<Link href="/auth/login" className="text-center text-[16px] font-medium text-[#111827] dark:text-gray-200 py-3">\n                  Login\n                </Link>'
);

// Start Free is a motion.button. We'll change it to use useRouter
if (!headerTsx.includes('import { usePathname, useRouter } from "next/navigation";')) {
    headerTsx = headerTsx.replace('import { usePathname } from "next/navigation";', 'import { usePathname, useRouter } from "next/navigation";');
}
if (!headerTsx.includes('const router = useRouter();')) {
    headerTsx = headerTsx.replace('const pathname = usePathname();', 'const pathname = usePathname();\n  const router = useRouter();');
}

headerTsx = headerTsx.replace(
  /className="text-\[15px\] font-medium text-white bg-gradient-to-r from-\[#2563EB\] to-\[#1D4ED8\] px-6 py-2\.5 rounded-\[12px\] shadow-sm transition-all"\s*>\s*Start Free\s*<\/motion\.button>/,
  'className="text-[15px] font-medium text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-6 py-2.5 rounded-[12px] shadow-sm transition-all"\n              onClick={() => router.push(\'/auth/login\')}\n            >\n              Start Free\n            </motion.button>'
);

headerTsx = headerTsx.replace(
  /<button className="w-full text-\[16px\] font-medium text-white bg-gradient-to-r from-\[#2563EB\] to-\[#1D4ED8\] py-3 rounded-xl shadow-md">\s*Start Free\s*<\/button>/,
  '<button onClick={() => router.push(\'/auth/login\')} className="w-full text-[16px] font-medium text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] py-3 rounded-xl shadow-md">\n                  Start Free\n                </button>'
);

fs.writeFileSync('components/Header.tsx', headerTsx);
console.log('Header.tsx updated with auth/login links');
