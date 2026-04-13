import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { WorkorderRepositoryProvider } from "@/lib/repositories/WorkorderRepositoryProvider";
import "./globals.css";

const baseI18n = getI18n(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: "PeaceByPiece",
  description: baseI18n.common.metadataDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full"><I18nProvider initialLocale={DEFAULT_LOCALE}><WorkorderRepositoryProvider>{children}</WorkorderRepositoryProvider></I18nProvider></body>
    </html>
  );
}
