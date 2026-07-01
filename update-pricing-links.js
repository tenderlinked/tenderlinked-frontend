const fs = require('fs');

let pricingTsx = fs.readFileSync('app/pricing/page.tsx', 'utf8');

// Ensure Link is imported
if (!pricingTsx.includes('import Link from "next/link";')) {
    pricingTsx = pricingTsx.replace('import React from "react";', 'import React from "react";\nimport Link from "next/link";');
}

// 1. Start Trial
pricingTsx = pricingTsx.replace(
  /<button className="w-full py-3 rounded-xl border border-outline-variant text-primary font-medium hover:bg-surface-container-high transition-colors">\s*Start Trial\s*<\/button>/,
  '<Link href="/auth/login" className="block text-center w-full py-3 rounded-xl border border-outline-variant text-primary font-medium hover:bg-surface-container-high transition-colors">\n                Start Trial\n              </Link>'
);

// 2. Get Started Now
pricingTsx = pricingTsx.replace(
  /<button className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-container transition-colors shadow-md">\s*Get Started Now\s*<\/button>/,
  '<Link href="/auth/login" className="block text-center w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-container transition-colors shadow-md">\n                Get Started Now\n              </Link>'
);

// 3. Contact Sales
pricingTsx = pricingTsx.replace(
  /<button className="w-full py-3 rounded-xl border border-outline-variant text-primary font-medium hover:bg-surface-container-high transition-colors">\s*Contact Sales\s*<\/button>/,
  '<Link href="/auth/login" className="block text-center w-full py-3 rounded-xl border border-outline-variant text-primary font-medium hover:bg-surface-container-high transition-colors">\n                Contact Sales\n              </Link>'
);

// 4. Start My Free Trial
pricingTsx = pricingTsx.replace(
  /<button className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-surface transition-colors shadow-md">\s*Start My Free Trial\s*<\/button>/,
  '<Link href="/auth/login" className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-surface transition-colors shadow-md">\n                Start My Free Trial\n              </Link>'
);

// 5. Speak to an Expert
pricingTsx = pricingTsx.replace(
  /<button className="bg-transparent border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white\/10 transition-colors">\s*Speak to an Expert\s*<\/button>/,
  '<Link href="/auth/login" className="inline-block bg-transparent border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">\n                Speak to an Expert\n              </Link>'
);

fs.writeFileSync('app/pricing/page.tsx', pricingTsx);
console.log('Pricing page updated with auth/login links');
