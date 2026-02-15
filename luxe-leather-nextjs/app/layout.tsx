import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import GlobalCart from "@/components/storefront/GlobalCart";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Luxe Leather Co. | Handcrafted Premium Leather Goods",
  description: "Shop premium handcrafted leather wallets, bags, and accessories. Sustainable materials and lifetime warranty on all Luxe Leather products.",
  keywords: ["leather goods", "handcrafted", "premium", "wallets", "bags", "accessories"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Material Symbols Icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${manrope.variable} antialiased`}>
        <ThemeProvider>
          <CartProvider>
            {children}
            <GlobalCart />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

