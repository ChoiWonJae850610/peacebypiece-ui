"use client";

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";

import { AppButton, AppSegmentedTabs, AppSheet, WaflMobileContentSection, WaflMobileFixedActionBar, WaflMobileShell, WAFL_MOBILE_SAFE_AREA_CLASS_NAMES, type AppSegmentedTabItem } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type MobileSectionStackMode = "list" | "detail";
type MobileRelatedSectionKey = "attachment" | "design" | "memo";

type MobileSectionStackProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  mode: MobileSectionStackMode;
  topBar: ReactNode;
  drawer: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  sidePanel: (activeSection: MobileRelatedSectionKey) => ReactNode;
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
  const [activeRelatedSection, setActiveRelatedSection] = useState<MobileRelatedSectionKey>("attachment");
  const mobileCopy = i18n.workorder.ui.layout.mobileDrawer;
  const relatedCopy = mobileCopy.relatedSections;
  const relatedTabs = useMemo<Array<AppSegmentedTabItem<MobileRelatedSectionKey>>>(() => [
    { key: "attachment", label: relatedCopy.attachment },
    { key: "design", label: relatedCopy.design },
    { key: "memo", label: relatedCopy.memo },
  ], [relatedCopy.attachment, relatedCopy.design, relatedCopy.memo]);
  const relatedTitle = relatedCopy.titles[activeRelatedSection];
  const openRelatedSection = (section: MobileRelatedSectionKey) => {
    setActiveRelatedSection(section);
    setSidePanelOpen(true);
  };
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
          <div className="grid grid-cols-[minmax(0,0.34fr)_repeat(3,minmax(0,0.22fr))] gap-2">
            <AppButton className="w-full" variant="secondary" size="lg" onClick={onBackToList}>
              {mobileCopy.backToList}
            </AppButton>
            {relatedTabs.map((item) => (
              <AppButton
                key={item.key}
                className="w-full"
                variant="secondary"
                size="lg"
                onClick={() => openRelatedSection(item.key)}
              >
                {item.label}
              </AppButton>
            ))}
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
        title={relatedTitle}
        description={relatedCopy.description}
        side="bottom"
        size="full"
        contentClassName={`px-3 py-3 ${WAFL_MOBILE_SAFE_AREA_CLASS_NAMES.sheetBottomPadding}`}
      >
        <div className="space-y-3">
          <AppSegmentedTabs
            items={relatedTabs}
            value={activeRelatedSection}
            onChange={setActiveRelatedSection}
            ariaLabel={relatedCopy.tabsAria}
            itemClassName="text-xs"
          />
          <div className="min-w-0 overflow-x-hidden">
            {sidePanel(activeRelatedSection)}
          </div>
        </div>
      </AppSheet>
    </WaflMobileShell>
  );
}
