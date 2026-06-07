import type { Metadata } from "next";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
import Navbar from "@/components/Navbar";
import Countdown from "@/components/Countdown";

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
        className="antialiased bg-zinc-950 text-zinc-50 min-h-screen flex flex-col"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
