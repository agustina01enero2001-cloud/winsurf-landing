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
  title: "Atención online",
  description: "Acompañamiento y alta de usuarios. Usá /?c=tu-cliente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${outfit.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <XPixel />
      </body>
    </html>
  );
}
