import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { TelegramProvider } from "../contexts/TelegramProvider";
import { ErrorBoundary } from "../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "FoodSave - Экономь на еде",
  description: "Telegram Mini App для экономии на еде",
};

export const viewport: Viewport = {
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
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className="font-sans antialiased bg-[#F5F5F5]"
        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <ErrorBoundary>
          <TelegramProvider>
            {children}
          </TelegramProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
