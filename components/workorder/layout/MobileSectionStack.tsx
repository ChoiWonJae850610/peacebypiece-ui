"use client";

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";

import { AppSegmentedTabs, AppSheet, WaflMobileContentSection, WaflMobileFloatingActionButton, WaflMobileShell, WAFL_MOBILE_SAFE_AREA_CLASS_NAMES, type AppSegmentedTabItem } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type MobileRelatedSectionKey = "attachment" | "design" | "memo";

type MobileSectionStackProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  topBar: ReactNode;
  drawer: ReactNode;
  detail: ReactNode;
  sidePanel: (activeSection: MobileRelatedSectionKey) => ReactNode;
  hasSelection: boolean;
  scrollResetKey: string;
};

export default function MobileSectionStack({
  appShellRef,
  topBar,
  drawer,
  detail,
  sidePanel,
  hasSelection,
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
  const showDetailActionBar = hasSelection;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    setSidePanelOpen(false);
  }, [scrollResetKey]);

  return (
    <WaflMobileShell
      shellRef={appShellRef}
      topBar={topBar}
      drawer={drawer}
      actionBar={showDetailActionBar ? (
        <WaflMobileFloatingActionButton
          ariaLabel={relatedCopy.openAria}
          title={relatedCopy.openTitle}
          onClick={() => openRelatedSection(activeRelatedSection)}
        >
          <span aria-hidden="true">＋</span>
          <span>{relatedCopy.openLabel}</span>
        </WaflMobileFloatingActionButton>
      ) : undefined}
      contentClassName={showDetailActionBar ? undefined : "pb-[calc(1rem+env(safe-area-inset-bottom))]"}
    >
      <WaflMobileContentSection>{detail}</WaflMobileContentSection>

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
