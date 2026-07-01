import { LoadingProvider } from "@/contexts/LoadingContext";
import { SessionProvider } from "@/components/providers/session-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import FrontLayoutWrapper from "@/components/FrontLayoutWrapper";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Enfycon - Tailwind & Next.js Admin Dashboard with shadcn UI (Typescript)",
  description: "Enfycon - Admin Dashboard Multipurpose Next.js, TypeScript, ShadCn UI & Tailwind Template",
  metadataBase: new URL("https://enfycon.vercel.app"),
  openGraph: {
    title: "Enfycon - Admin Dashboard UI",
    description: "A modern, responsive admin dashboard template built with Next.js, Tailwind CSS, and ShadCN UI.",
    url: "https://enfycon.vercel.app",
    siteName: "Enfycon",
    images: [
      {
        url: "https://enfycon.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Enfycon Admin Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enfycon - Admin Dashboard UI",
    description: "A modern, responsive admin dashboard template built with Next.js, Tailwind CSS, and ShadCN UI.",
    images: ["https://enfycon.vercel.app/og-image.jpg"],
  },
};
import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100..900&family=JetBrains+Mono:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider session={session}>
          <LoadingProvider>
            <FrontLayoutWrapper>
              {children}
            </FrontLayoutWrapper>
          </LoadingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
