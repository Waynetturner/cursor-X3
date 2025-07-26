import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X3 Momentum Pro – AI-Powered X3 Resistance Band Tracker",
  description: "Motivation. Progress. Results. The ultimate X3 tracking app with AI coaching and smart analytics.",
  icons: {
    icon: '/x3-avatar.svg',
    shortcut: '/x3-avatar.svg',
    apple: '/x3-avatar.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
