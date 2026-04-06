export type WorkflowState =
  | "작성중"
  | "검토요청"
  | "검토완료"
  | "발주요청"
  | "생산중"
  | "검수중"
  | "완료";

export type DisplayStage = "작성중" | "검토요청" | "검토완료" | "발주요청" | "검수" | "완료";

export type WorkflowAction = {
  label: string;
  nextState: WorkflowState;
};

export type HistoryCategory = "work" | "inventory" | "attachment";
export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory" | "attachment";

export const DISPLAY_STAGES: DisplayStage[] = ["작성중", "검토요청", "검토완료", "발주요청", "검수", "완료"];
