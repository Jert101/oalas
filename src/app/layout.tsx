import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { serviceWorkerManager } from "@/lib/service-worker";
import { RealtimeProvider } from "@/components/realtime-provider";
import { AutoRefresh } from "@/components/auto-refresh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OALAS - Online Application for Leave of Absence System",
  description: "A comprehensive leave of absence management system for educational institutions",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RealtimeProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
              <PerformanceMonitor />
              <AutoRefresh interval={15000} /> {/* Auto-refresh every 15 seconds */}
            </RealtimeProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}


