import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  WaflEmptyCard,
  WaflMobileListDrawer,
  WaflMobileWorkspaceFrame,
  type WaflSegmentedTabItem,
} from "@/components/common/ui";

type MaterialOrderMobileToolKey = "workorders" | "schedule";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m20.2 20.2-4.4-4.4" />
      <circle cx="10.8" cy="10.8" r="6.1" />
    </svg>
  );
}

const MOBILE_TOOL_TABS: Array<WaflSegmentedTabItem<MaterialOrderMobileToolKey>> = [
  { key: "workorders", label: "작업지시서" },
  { key: "schedule", label: "PDF·납기" },
];

export default function MaterialOrderMobileWorkspaceView({
  topbar,
  list,
  detail,
  allocationPanel,
  validationModal,
  workspaceOverlay,
  listDrawerOpen,
  onCloseListDrawer,
  scrollResetKey,
  hasSelection,
  toolOpen,
  onToolOpenChange,
  activeTool,
  onActiveToolChange,
  presentation,
}: {
  topbar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  allocationPanel: ReactNode;
  validationModal: ReactNode;
  workspaceOverlay: ReactNode;
  listDrawerOpen: boolean;
  onCloseListDrawer: () => void;
  scrollResetKey: string | null;
  hasSelection: boolean;
  toolOpen: boolean;
  onToolOpenChange: (open: boolean) => void;
  activeTool: MaterialOrderMobileToolKey;
  onActiveToolChange: Dispatch<SetStateAction<MaterialOrderMobileToolKey>>;
  presentation: "sheet" | "modal";
}) {
  const modalPresentation = presentation === "modal";

  return (
    <>
      {validationModal}
      <WaflMobileWorkspaceFrame
        topbar={topbar}
        drawer={(
          <WaflMobileListDrawer
            open={listDrawerOpen}
            onClose={onCloseListDrawer}
            title="발주서 목록"
            closeLabel="닫기"
            closeOverlayAria="발주서 목록 드로어 닫기"
            titleId="material-order-mobile-drawer-title"
            showHeader={false}
          >
            <div className="min-h-[72dvh] min-w-0">{list}</div>
          </WaflMobileListDrawer>
        )}
        detail={detail}
        workspaceOverlay={workspaceOverlay}
        scrollResetKey={scrollResetKey ?? ""}
        hasSelection={hasSelection}
        actionAriaLabel="발주 대상 선택 열기"
        actionTitle="발주 대상 작업지시서와 자재 선택 도구를 엽니다."
        actionLabel="발주 대상"
        actionIcon={<SearchIcon />}
        toolTitle="발주 대상"
        toolTabs={MOBILE_TOOL_TABS}
        defaultTool="workorders"
        toolAriaLabel="원단·부자재 작업지시서 및 자재 선택 도구"
        toolOpen={toolOpen}
        onToolOpenChange={onToolOpenChange}
        activeTool={activeTool}
        onActiveToolChange={onActiveToolChange}
        presentation={presentation}
        sheetContentClassName={modalPresentation ? "px-5 py-5" : undefined}
        contentClassName="gap-3"
        renderTool={(tool) => (
          <>
            {tool === "workorders" ? (
              <div className={modalPresentation ? "min-h-0 min-w-0" : "min-h-[58dvh] min-w-0"}>
                {allocationPanel}
              </div>
            ) : null}
            {tool === "schedule" ? (
              <WaflEmptyCard
                component="material-order-schedule-empty"
                className="min-h-[42dvh] p-4 text-left"
              >
                <p className="text-sm font-bold pbp-text-primary">PDF·납기</p>
                <p className="mt-2 text-xs leading-5 pbp-text-muted">
                  PDF 생성과 납기 입력 액션은 후속 기능 연결 시 이 탭에 배치합니다.
                </p>
              </WaflEmptyCard>
            ) : null}
          </>
        )}
      />
    </>
  );
}
