"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ReactNode } from "react";

export default function FrontLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Skip adding global Header/Footer on Dashboard and Auth pages
  // since they handle their own layouts.
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAuth = pathname?.startsWith("/auth");
  const isAppRoute = pathname?.startsWith("/app");
  const isSettings = pathname?.startsWith("/settings");

  if (isDashboard || isAuth || isAppRoute || isSettings) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-[72px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
