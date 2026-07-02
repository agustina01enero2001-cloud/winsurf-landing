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
  title: "Winsurf | Activar beneficio",
  description:
    "Tu primer ingreso se triplica. 200% extra para nuevos integrantes. Activación inmediata.",
  openGraph: {
    title: "Winsurf | Activar beneficio",
    description: "200% extra para nuevos integrantes. Activación inmediata.",
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
