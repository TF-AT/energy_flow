import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "EnergyFlow | Infrastructure Monitoring",
  description: "Real-time monitoring for Nigerian energy grid infrastructure",
};

import { GridStatusProvider } from "../context/GridStatusContext";
import { NetworkProvider } from "../context/NetworkContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <NetworkProvider>
          <GridStatusProvider>
            {children}
          </GridStatusProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}
