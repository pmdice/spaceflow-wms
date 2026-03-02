import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "SpaceFlow WMS",
    template: "%s | SpaceFlow WMS",
  },
  description:
    "Portfolio-grade Warehouse Management System dashboard with natural-language logistics filtering and synchronized 2D and 3D warehouse views.",
  applicationName: "SpaceFlow WMS",
  keywords: [
    "warehouse management system",
    "WMS",
    "logistics dashboard",
    "Next.js",
    "React",
    "Three.js",
    "portfolio project",
  ],
  category: "technology",
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
      >
      <SidebarProvider>
        <AppSidebar />
        <TooltipProvider>
          {children}
          <Toaster closeButton position="bottom-right" />
        </TooltipProvider>
      </SidebarProvider>
      </body>
    </html>
  );
}
