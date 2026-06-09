import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { CurrentUserProvider } from "@/components/auth/CurrentUserProvider";
import AppToaster from "@/components/common/AppToaster";
import { WorkorderRepositoryProvider } from "@/lib/repositories/WorkorderRepositoryProvider";
import { PbpThemeProvider } from "@/lib/theme/PbpThemeProvider";
import { buildPbpThemeRootAttributes } from "@/lib/theme/themeDocument";
import { DEFAULT_PBP_THEME_ID } from "@/lib/theme/themeRegistry";
import "./globals.css";
import "tldraw/tldraw.css";

const baseI18n = getI18n(DEFAULT_LOCALE);
const initialThemeRootAttributes = buildPbpThemeRootAttributes(DEFAULT_PBP_THEME_ID);

export const metadata: Metadata = {
  title: "WAFL",
  description: baseI18n.common.metadataDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      data-pbp-theme={initialThemeRootAttributes["data-pbp-theme"]}
      data-pbp-theme-tone={initialThemeRootAttributes["data-pbp-theme-tone"]}
      style={initialThemeRootAttributes.style}
    >
      <body className="min-h-full" data-wafl-component-debug="true">
        <PbpThemeProvider initialThemeId={DEFAULT_PBP_THEME_ID}>
          <I18nProvider initialLocale={DEFAULT_LOCALE}>
            <CurrentUserProvider>
              <WorkorderRepositoryProvider>{children}</WorkorderRepositoryProvider>
              <AppToaster />
            </CurrentUserProvider>
          </I18nProvider>
        </PbpThemeProvider>
      </body>
    </html>
  );
}
