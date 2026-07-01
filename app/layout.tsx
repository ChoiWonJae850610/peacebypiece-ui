import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { CurrentUserProvider } from "@/components/auth/CurrentUserProvider";
import WaflToaster from "@/components/common/WaflToaster";
import { WorkorderRepositoryProvider } from "@/lib/repositories/WorkorderRepositoryProvider";
import { PbpThemeProvider } from "@/lib/theme/PbpThemeProvider";
import { buildPbpThemeRootAttributes } from "@/lib/theme/themeDocument";
import { DEFAULT_PBP_THEME_ID } from "@/lib/theme/themeRegistry";
import "./globals.css";

const baseI18n = getI18n(DEFAULT_LOCALE);
const initialThemeRootAttributes = buildPbpThemeRootAttributes(DEFAULT_PBP_THEME_ID);

// WAFL 공통 컴포넌트 확인용 분홍색 debug outline.
// 모바일/실사용 화면 확인 중에는 false로 두고, 다시 컴포넌트 추적이 필요하면 true로 되돌린다.
const WAFL_COMPONENT_DEBUG_OUTLINE_ENABLED = false;

export const metadata: Metadata = {
  title: "WAFL 0.24.29",
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
      <body className="min-h-full" data-wafl-component-debug={WAFL_COMPONENT_DEBUG_OUTLINE_ENABLED ? "true" : "false"}>
        <PbpThemeProvider initialThemeId={DEFAULT_PBP_THEME_ID}>
          <I18nProvider initialLocale={DEFAULT_LOCALE}>
            <CurrentUserProvider>
              <WorkorderRepositoryProvider>{children}</WorkorderRepositoryProvider>
              <WaflToaster />
              <div id="wafl-modal-portal-root" data-wafl-modal-portal-root="true" />
            </CurrentUserProvider>
          </I18nProvider>
        </PbpThemeProvider>
      </body>
    </html>
  );
}
