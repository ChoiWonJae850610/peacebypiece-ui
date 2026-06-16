"use client";

import { useMemo, type ReactNode, type Ref } from "react";

import { useWorkspaceToolState } from "@/lib/hooks/workspace/useWorkspaceToolState";
import type { AppSheetPresentation } from "./AppSheet";
import type { AppSegmentedTabItem } from "./AppSegmentedTabs";
import {
  WaflMobileContentSection,
  WaflMobileFloatingActionButton,
  WaflMobileShell,
  WaflMobileTabbedActionSheet,
} from "./WaflMobileShell";

type WaflMobileWorkspaceFrameProps<Key extends string> = {
  shellRef?: Ref<HTMLDivElement>;
  topbar: ReactNode;
  drawer: ReactNode;
  detail: ReactNode;
  workspaceOverlay?: ReactNode;
  scrollResetKey: string;
  hasSelection: boolean;
  actionAriaLabel: string;
  actionTitle?: string;
  actionLabel: ReactNode;
  actionIcon?: ReactNode;
  actionDisabled?: boolean;
  toolTitle: ReactNode | ((activeKey: Key) => ReactNode);
  toolTabs: Array<AppSegmentedTabItem<Key>>;
  defaultTool: Key;
  toolAriaLabel: string;
  renderTool: (activeKey: Key) => ReactNode;
  presentation?: AppSheetPresentation;
  sheetContentClassName?: string;
  contentClassName?: string;
  toolOpen?: boolean;
  onToolOpenChange?: (open: boolean) => void;
  activeTool?: Key;
  onActiveToolChange?: (key: Key) => void;
};

export function WaflMobileWorkspaceFrame<Key extends string>({
  shellRef,
  topbar,
  drawer,
  detail,
  workspaceOverlay,
  scrollResetKey,
  hasSelection,
  actionAriaLabel,
  actionTitle,
  actionLabel,
  actionIcon,
  actionDisabled = false,
  toolTitle,
  toolTabs,
  defaultTool,
  toolAriaLabel,
  renderTool,
  presentation = "sheet",
  sheetContentClassName,
  contentClassName,
  toolOpen,
  onToolOpenChange,
  activeTool,
  onActiveToolChange,
}: WaflMobileWorkspaceFrameProps<Key>) {
  const internalToolState = useWorkspaceToolState({
    resetKey: scrollResetKey,
    defaultTool,
  });

  const resolvedOpen = toolOpen ?? internalToolState.open;
  const resolvedActiveTool = activeTool ?? internalToolState.activeTool;
  const resolvedTitle = useMemo(
    () => (typeof toolTitle === "function" ? toolTitle(resolvedActiveTool) : toolTitle),
    [resolvedActiveTool, toolTitle],
  );

  const setOpen = (nextOpen: boolean) => {
    if (toolOpen === undefined) internalToolState.setOpen(nextOpen);
    onToolOpenChange?.(nextOpen);
    if (!nextOpen) {
      if (activeTool === undefined) internalToolState.setActiveTool(defaultTool);
      onActiveToolChange?.(defaultTool);
    }
  };

  const setActive = (nextKey: Key) => {
    if (activeTool === undefined) internalToolState.setActiveTool(nextKey);
    onActiveToolChange?.(nextKey);
  };


  const showAction = hasSelection;

  return (
    <WaflMobileShell
      shellRef={shellRef}
      topBar={topbar}
      drawer={drawer}
      actionBar={showAction ? (
        <WaflMobileFloatingActionButton
          ariaLabel={actionAriaLabel}
          title={actionTitle}
          disabled={actionDisabled}
          onClick={() => setOpen(true)}
        >
          {actionIcon}
          <span>{actionLabel}</span>
        </WaflMobileFloatingActionButton>
      ) : undefined}
      contentClassName={contentClassName ?? (showAction ? undefined : "pb-[calc(1rem+env(safe-area-inset-bottom))]")}
    >
      {workspaceOverlay}
      <WaflMobileContentSection>{detail}</WaflMobileContentSection>
      <WaflMobileTabbedActionSheet
        open={resolvedOpen}
        onOpenChange={setOpen}
        title={resolvedTitle}
        items={toolTabs}
        value={resolvedActiveTool}
        onChange={setActive}
        ariaLabel={toolAriaLabel}
        presentation={presentation}
        contentClassName={sheetContentClassName}
      >
        {renderTool(resolvedActiveTool)}
      </WaflMobileTabbedActionSheet>
    </WaflMobileShell>
  );
}
