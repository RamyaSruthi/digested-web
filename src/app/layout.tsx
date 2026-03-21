import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { SwRegister } from "@/components/layout/sw-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Digested",
  description: "Save, organize, and digest links that matter",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Digested",
    startupImage: "/icon.svg",
  },
  icons: {
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="bottom-right" />
        <SwRegister />
      </body>
    </html>
  );
}
