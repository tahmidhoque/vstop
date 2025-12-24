import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProviders from '@/components/providers/ThemeProviders';

export const metadata: Metadata = {
  title: "Ordering System",
  description: "Simple ordering system for products",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProviders>
          {children}
        </ThemeProviders>
      </body>
    </html>
  );
}
