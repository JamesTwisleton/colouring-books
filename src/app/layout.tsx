import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import AddToHomeScreenModal from "@/components/ui/AddToHomeScreenModal";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Colouring Books",
  description:
    "Magical digital colouring books for kids — colour, animate, and print!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ColourBooks",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // required for env(safe-area-inset-*) on iPhone notch/Dynamic Island
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`} suppressHydrationWarning>
      <body className="h-full font-sans antialiased">
        <ThemeProvider>
          {children}
          <AddToHomeScreenModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
