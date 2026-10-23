import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BCH Call Review • Voice AI & Lead QA",
  description: "Daily mobile voice call review and lead qualification for Bharath Cycle Hub auto-call telephony.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BCH Calls",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 pb-16">
        {children}
      </body>
    </html>
  );
}
