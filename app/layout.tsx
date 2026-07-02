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
  title: "Tenderlinked - Tenders & Opportunities Platform",
  description: "Tenderlinked - Advanced Tender Scraping and Business Opportunities Platform",
  metadataBase: new URL("https://tenderlinked.com"),
  openGraph: {
    title: "Tenderlinked - Tenders & Opportunities Platform",
    description: "Tenderlinked - Advanced Tender Scraping and Business Opportunities Platform",
    url: "https://tenderlinked.com",
    siteName: "Tenderlinked",
    images: [
      {
        url: "https://tenderlinked.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tenderlinked Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tenderlinked - Tenders & Opportunities Platform",
    description: "Tenderlinked - Advanced Tender Scraping and Business Opportunities Platform",
    images: ["https://tenderlinked.com/og-image.jpg"],
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
