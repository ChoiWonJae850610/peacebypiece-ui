import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_VERSION } from "@/lib/constants/app";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: `PeacebyPiece v${APP_VERSION}`,
  description: "작업지시 워크스테이션",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full"><I18nProvider initialLocale={DEFAULT_LOCALE}>{children}</I18nProvider></body>
    </html>
  );
}
