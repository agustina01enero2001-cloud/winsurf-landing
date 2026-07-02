import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import XPixel from "@/components/XPixel";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Winsurf | Sumate ahora",
  description:
    "Plataforma premium para nuevos integrantes. Activación inmediata por WhatsApp.",
  openGraph: {
    title: "Winsurf | Sumate ahora",
    description:
      "Plataforma premium para nuevos integrantes. Activación inmediata por WhatsApp.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <XPixel />
      </body>
    </html>
  );
}
