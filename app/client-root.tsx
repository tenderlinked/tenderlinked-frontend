"use client";

import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import ThemeCustomizer from "@/components/theme-customizer/theme-customizer";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";

export function ClientRoot({
  defaultOpen,
  children,
  session,
}: {
  defaultOpen: boolean;
  children: ReactNode;
  session?: Session | null;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    // Pass the server-fetched session so SessionProvider starts as "authenticated"
    // immediately — no cold fetch, no race condition with the unauthenticated redirect
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider defaultOpen={defaultOpen}>
          {isAdmin && <AppSidebar />}
          <main className="dashboard-body-wrapper grow-[1] flex flex-col min-h-screen w-full">
            <Header />
            <div className="dashboard-body bg-neutral-100 dark:bg-[#1e2734] flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </div>
            <Footer />
          </main>
        </SidebarProvider>
        <ThemeCustomizer />
        <Toaster 
          position="top-center" 
          reverseOrder={false} 
          containerStyle={{
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
