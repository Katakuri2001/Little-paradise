import type { Metadata } from "next";
import "./globals.css";
import AudioEngine from "@/components/player/AudioEngine";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Little Paradise — Your little world of music",
  description: "A premium music-listening environment with synchronized lyrics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AudioEngine />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
