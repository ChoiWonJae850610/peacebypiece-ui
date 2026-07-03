"use client";

import { useMemo, type ReactNode, type RefObject } from "react";

import { WaflMobileWorkspaceFrame, type WaflSegmentedTabItem } from "@/components/common/ui";
import type { WaflSheetPresentation } from "@/components/common/ui/WaflSheet";
import { useI18n } from "@/lib/i18n";

type MobileRelatedSectionKey = "attachment" | "design" | "instruction" | "size";

function AttachmentIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.1 11.2-8.8 8.8a5.2 5.2 0 0 1-7.4-7.4l9.1-9.1a3.5 3.5 0 0 1 5 5l-9.1 9.1a1.8 1.8 0 0 1-2.6-2.6l8.4-8.4" />
    </svg>
  );
}

type WorkOrderMobileWorkspaceShellProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  topBar: ReactNode;
  drawer: ReactNode;
  detail: ReactNode;
  sidePanel: (activeSection: MobileRelatedSectionKey) => ReactNode;
  hasSelection: boolean;
  scrollResetKey: string;
  relatedPresentation?: WaflSheetPresentation;
};

export default function WorkOrderMobileWorkspaceShell({
  appShellRef,
  topBar,
  drawer,
  detail,
  sidePanel,
  hasSelection,
  scrollResetKey,
  relatedPresentation = "sheet",
}: WorkOrderMobileWorkspaceShellProps) {
  const { i18n } = useI18n();
  const mobileCopy = i18n.workorder.ui.layout.mobileDrawer;
  const relatedCopy = mobileCopy.relatedSections;
  const relatedTabs = useMemo<Array<WaflSegmentedTabItem<MobileRelatedSectionKey>>>(() => [
    { key: "design", label: relatedCopy.design },
    { key: "attachment", label: relatedCopy.attachment },
    { key: "instruction", label: "공장 전달사항" },
    { key: "size", label: "사이즈" },
  ], [relatedCopy.attachment, relatedCopy.design]);

  return (
    <WaflMobileWorkspaceFrame
      shellRef={appShellRef}
      topbar={topBar}
      drawer={drawer}
      detail={detail}
      scrollResetKey={scrollResetKey}
      hasSelection={hasSelection}
      actionAriaLabel={relatedCopy.openAria}
      actionTitle={relatedCopy.openTitle}
      actionLabel={relatedCopy.openLabel}
      actionIcon={<AttachmentIcon />}
      toolTitle={(activeSection: MobileRelatedSectionKey) => {
        if (activeSection === "instruction") return "공장 전달사항";
        if (activeSection === "size") return "사이즈 스펙";
        return relatedCopy.titles[activeSection];
      }}
      toolTabs={relatedTabs}
      defaultTool="design"
      toolAriaLabel={relatedCopy.tabsAria}
      renderTool={sidePanel}
      presentation={relatedPresentation}
      sheetContentClassName={relatedPresentation === "modal" ? "px-5 py-5" : undefined}
    />
  );
}
