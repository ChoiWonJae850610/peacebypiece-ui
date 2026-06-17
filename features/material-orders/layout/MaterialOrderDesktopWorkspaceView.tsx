import type { ReactNode } from "react";
import { WaflDesktopWorkspaceFrame } from "@/components/common/ui";

export default function MaterialOrderDesktopWorkspaceView({
  topbar,
  list,
  detail,
  side,
  validationModal,
  workspaceOverlay,
  scrollResetKey,
}: {
  topbar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  side: ReactNode;
  validationModal: ReactNode;
  workspaceOverlay: ReactNode;
  scrollResetKey: string | null;
}) {
  return (
    <>
      {validationModal}
      <WaflDesktopWorkspaceFrame
        topbar={topbar}
        list={list}
        detail={detail}
        side={side}
        scrollResetKey={scrollResetKey ?? ""}
        workspaceOverlay={workspaceOverlay}
      />
    </>
  );
}
