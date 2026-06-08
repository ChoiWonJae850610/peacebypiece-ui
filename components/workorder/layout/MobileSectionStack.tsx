"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

import { AppButton, AppSheet, WaflMobileContentSection, WaflMobileFixedActionBar, WaflMobileShell, WAFL_MOBILE_SAFE_AREA_CLASS_NAMES } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type MobileSectionStackMode = "list" | "detail";

type MobileSectionStackProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  mode: MobileSectionStackMode;
  topBar: ReactNode;
  drawer: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  hasSelection: boolean;
  onBackToList: () => void;
  scrollResetKey: string;
};

export default function MobileSectionStack({
  appShellRef,
  mode,
  topBar,
  drawer,
  list,
  detail,
  sidePanel,
  hasSelection,
  onBackToList,
  scrollResetKey,
}: MobileSectionStackProps) {
  const { i18n } = useI18n();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const sidePanelTitle = `${i18n.workorder.ui.attachmentPanel.title} · ${i18n.workorder.ui.memo.panelTitle}`;
  const mobileCopy = i18n.workorder.ui.layout.mobileDrawer;
  const showDetail = mode === "detail";
  const showDetailActionBar = showDetail && hasSelection;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    setSidePanelOpen(false);
  }, [scrollResetKey, mode]);

  return (
    <WaflMobileShell
      shellRef={appShellRef}
      topBar={topBar}
      drawer={drawer}
      actionBar={showDetailActionBar ? (
        <WaflMobileFixedActionBar>
          <div className="grid grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] gap-2">
            <AppButton className="w-full" variant="secondary" size="lg" onClick={onBackToList}>
              {mobileCopy.backToList}
            </AppButton>
            <AppButton className="w-full" size="lg" onClick={() => setSidePanelOpen(true)}>
              {sidePanelTitle}
            </AppButton>
          </div>
        </WaflMobileFixedActionBar>
      ) : undefined}
      contentClassName={showDetailActionBar ? undefined : "pb-[calc(1rem+env(safe-area-inset-bottom))]"}
    >
      {showDetail ? (
        <WaflMobileContentSection>{detail}</WaflMobileContentSection>
      ) : (
        <WaflMobileContentSection className="flex min-h-[calc(100vh-5.5rem)] flex-col">{list}</WaflMobileContentSection>
      )}

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
