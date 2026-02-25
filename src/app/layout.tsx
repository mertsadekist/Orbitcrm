import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrbitFlow CRM",
  description: "Multi-tenant SaaS CRM & Lead Generation Platform",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OrbitFlow",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

// Inline polyfill injected into <head> — runs synchronously before ANY
// JavaScript bundle is evaluated, guaranteeing crypto.randomUUID is
// available even on plain HTTP (non-secure) contexts.
const cryptoPolyfillScript = `(function(){
  if(typeof window!=="undefined"&&window.crypto&&typeof window.crypto.randomUUID!=="function"){
    window.crypto.randomUUID=function(){
      var b=new Uint8Array(16);
      window.crypto.getRandomValues(b);
      b[6]=(b[6]&0x0f)|0x40;
      b[8]=(b[8]&0x3f)|0x80;
      var h=Array.from(b,function(x){return x.toString(16).padStart(2,"0")}).join("");
      return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);
    };
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        {/* crypto.randomUUID polyfill — must be first script to run */}
        <script
          // biome-ignore lint: polyfill must run inline before any bundle
          dangerouslySetInnerHTML={{ __html: cryptoPolyfillScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
