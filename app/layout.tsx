import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SmoothScroll } from "@/components/smooth-scroll";
import Navbar from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vaxa",
  description: "AI agent marketplace on Avalanche. Pay per request via x402.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <SmoothScroll>
            <Navbar />
            <main className="flex-1 pt-14">{children}</main>
          </SmoothScroll>
        </Providers>
      </body>
    </html>
  );
}