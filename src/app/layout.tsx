import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import Navbar from "@/components/Navbar";
import Countdown from "@/components/Countdown";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cumple Pontevedra",
  description: "Organización viaje de cumpleaños a Pontevedra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-50 min-h-screen flex flex-col`}
      >
        <AuthWrapper>
          <header className="w-full py-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
            <Countdown />
          </header>
          <main className="flex-1 max-w-5xl w-full mx-auto p-4 pb-24">
            {children}
          </main>
          <Navbar />
        </AuthWrapper>
      </body>
    </html>
  );
}
