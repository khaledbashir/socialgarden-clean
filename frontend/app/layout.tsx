import "@/styles/globals.css";
import "@/styles/prosemirror.css";
import 'katex/dist/katex.min.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";

// Load Jakarta Sans font
const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const title = "Social Garden - SOW Generator";
const description =
  "Professional Statement of Work generator powered by AI. Create comprehensive SOWs for marketing automation and CRM projects.";

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      // Use external hosted logo to avoid stale public asset issues
      { url: 'https://i.ibb.co/v47zTJ5P/lightlogo.png', type: 'image/png' }
    ],
    apple: 'https://i.ibb.co/v47zTJ5P/lightlogo.png',
  },
  openGraph: {
    title,
    description,
    images: ['https://i.ibb.co/v47zTJ5P/lightlogo.png'],
  },
  twitter: {
    title,
    description,
    card: "summary_large_image",
    images: ['https://i.ibb.co/v47zTJ5P/lightlogo.png'],
  },
  metadataBase: new URL("https://socialgarden.com.au"),
};

export const viewport: Viewport = {
  themeColor: "#0e2e33",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={jakartaSans.variable}>
      <head>
        {/* Material Symbols font for enhance button icons */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
        />
        <script defer data-domain="sow.qandu.me" src="https://ahmad-plausible.840tjq.easypanel.host/js/script.js"></script>
      </head>
      <body className={jakartaSans.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
