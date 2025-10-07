import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "FoodSave - Экономь на еде",
  description: "Telegram Mini App для экономии на еде",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#F5F5F5]`}
        style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
