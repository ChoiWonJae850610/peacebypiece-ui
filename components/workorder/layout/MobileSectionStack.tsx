"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

import { AppButton, AppSheet, WaflMobileContentSection, WaflMobileFixedActionBar, WaflMobileShell, WAFL_MOBILE_SAFE_AREA_CLASS_NAMES } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type MobileSectionStackProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  topBar: ReactNode;
  drawer: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  scrollResetKey: string;
};

export default function MobileSectionStack({
  appShellRef,
  topBar,
  drawer,
  detail,
  sidePanel,
  scrollResetKey,
}: MobileSectionStackProps) {
  const { i18n } = useI18n();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const sidePanelTitle = `${i18n.workorder.ui.attachmentPanel.title} · ${i18n.workorder.ui.memo.panelTitle}`;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    setSidePanelOpen(false);
  }, [scrollResetKey]);

  return (
    <WaflMobileShell
      shellRef={appShellRef}
      topBar={topBar}
      drawer={drawer}
      actionBar={
        <WaflMobileFixedActionBar>
          <AppButton className="w-full" size="lg" onClick={() => setSidePanelOpen(true)}>
            {sidePanelTitle}
          </AppButton>
        </WaflMobileFixedActionBar>
      }
    >
      <WaflMobileContentSection>{detail}</WaflMobileContentSection>

      <AppSheet
        open={sidePanelOpen}
        onOpenChange={setSidePanelOpen}
        title={sidePanelTitle}
        description={i18n.workorder.ui.emptyWorkspace.sideDescription}
        side="bottom"
        size="full"
        contentClassName={`px-3 py-3 ${WAFL_MOBILE_SAFE_AREA_CLASS_NAMES.sheetBottomPadding}`}
      >
        {sidePanel}
      </AppSheet>
    </WaflMobileShell>
  );
}
