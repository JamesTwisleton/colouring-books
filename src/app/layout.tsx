import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import AddToHomeScreenModal from "@/components/ui/AddToHomeScreenModal";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coloring Books",
  description:
    "Magical digital coloring books for kids — color, animate, and print!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ColorBooks",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        {children}
        <AddToHomeScreenModal />
      </body>
    </html>
  );
}
