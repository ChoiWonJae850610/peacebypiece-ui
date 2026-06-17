import type { ReactNode } from "react";
import { WaflTabletWorkspaceFrame } from "@/components/common/ui";

export default function MaterialOrderTabletWorkspaceView({
  topbar,
  list,
  detail,
  side,
  validationModal,
  workspaceOverlay,
  listDrawerOpen,
  onCloseListDrawer,
  scrollResetKey,
}: {
  topbar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  side: ReactNode;
  validationModal: ReactNode;
  workspaceOverlay: ReactNode;
  listDrawerOpen: boolean;
  onCloseListDrawer: () => void;
  scrollResetKey: string | null;
}) {
  return (
    <>
      {validationModal}
      <WaflTabletWorkspaceFrame
        topbar={topbar}
        listDrawerOpen={listDrawerOpen}
        onCloseListDrawer={onCloseListDrawer}
        listDrawerTitle="발주서 목록"
        listDrawerTitleId="material-order-tablet-drawer-title"
        listDrawerCloseAria="발주서 목록 드로어 닫기"
        list={list}
        detail={detail}
        side={side}
        scrollResetKey={scrollResetKey ?? ""}
        workspaceOverlay={workspaceOverlay}
      />
    </>
  );
}
