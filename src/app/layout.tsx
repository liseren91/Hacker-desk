import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "CHIBA//NET :: anonymous relay",
  description:
    "An anonymous message board on a secure node. No accounts, no names, no logs.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* Scanlines and vignette sit above the UI but never take clicks. */}
        <div className="crt" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
