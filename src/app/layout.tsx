import type { Metadata } from "next";
import { Geist_Mono, Exo, Overlock, Brawler } from "next/font/google";
import "./globals.css";

const exo = Exo({
  variable: "--font-exo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const overlock = Overlock({
  variable: "--font-overlock",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const brawler = Brawler({
  variable: "--font-brawler",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synapse | AIESEC Denmark OGX",
  description: "Exchange Participant tracking for AIESEC Denmark OGX",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${exo.variable} ${overlock.variable} ${brawler.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
