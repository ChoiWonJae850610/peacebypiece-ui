"use client";

import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";

import { WaflMobileContentSection, WaflMobileFloatingActionButton, WaflMobileShell, WaflMobileTabbedActionSheet, type AppSegmentedTabItem } from "@/components/common/ui";
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
  const openRelatedSection = () => {
    setActiveRelatedSection("attachment");
    setSidePanelOpen(true);
  };
  const handleRelatedSheetOpenChange = (nextOpen: boolean) => {
    setSidePanelOpen(nextOpen);
    if (!nextOpen) {
      setActiveRelatedSection("attachment");
    }
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
          onClick={openRelatedSection}
        >
          <span aria-hidden="true">＋</span>
          <span>{relatedCopy.openLabel}</span>
        </WaflMobileFloatingActionButton>
      ) : undefined}
      contentClassName={showDetailActionBar ? undefined : "pb-[calc(1rem+env(safe-area-inset-bottom))]"}
    >
      <WaflMobileContentSection>{detail}</WaflMobileContentSection>

      <WaflMobileTabbedActionSheet
        open={sidePanelOpen}
        onOpenChange={handleRelatedSheetOpenChange}
        title={relatedTitle}
        description={relatedCopy.description}
        items={relatedTabs}
        value={activeRelatedSection}
        onChange={setActiveRelatedSection}
        ariaLabel={relatedCopy.tabsAria}
      >
        {sidePanel(activeRelatedSection)}
      </WaflMobileTabbedActionSheet>
    </WaflMobileShell>
  );
}
