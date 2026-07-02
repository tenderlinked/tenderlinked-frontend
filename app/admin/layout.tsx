"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  LineChart, 
  Megaphone,
  CheckCircle2
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const adminLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Tenants", href: "/admin/tenants", icon: Users },
    { name: "Billing", href: "/admin/billing", icon: CreditCard },
  ];

  const growthLinks = [
    { name: "Analytics", href: "/admin/analytics", icon: LineChart },
    { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-gray-950 flex flex-col hidden md:flex shrink-0">
        <div className="p-6">
          <Link href="/admin" className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            TenderLinked<span className="text-teal-700 text-sm align-top ml-1">ADMIN</span>
          </Link>
        </div>

        <div className="px-4 py-2 flex-1 overflow-y-auto space-y-6">
          <div>
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Administration
            </h3>
            <div className="space-y-1">
              {adminLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-teal-700 text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Platform Growth
            </h3>
            <div className="space-y-1">
              {growthLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-teal-700 text-white" 
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Health Widget */}
        <div className="p-4 border-t">
          <div className="bg-blue-50 dark:bg-slate-900 rounded-lg p-3 border border-blue-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">System Health</h4>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <div className="w-2 h-2 rounded-full bg-teal-600"></div>
              All Systems Nominal
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full">
          {children}
        </div>
        
        {/* Simple Footer */}
        <footer className="border-t py-6 px-8 flex justify-between items-center text-sm text-gray-500">
          <div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">TenderLinked</span>
            <br />
            © 2024 TenderLinked. Government Procurement Excellence.
          </div>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-900">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-900">Compliance</Link>
            <Link href="#" className="hover:text-gray-900">Contact Support</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
