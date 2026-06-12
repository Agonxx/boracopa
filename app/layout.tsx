import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
});

const archivo = Archivo({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "BoraCopa",
  description: "O bolão da firma · Copa 2026",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BoraCopa",
  },
  icons: { apple: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${archivo.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
