export type WorkflowState =
  | "작성중"
  | "검토요청"
  | "발주요청"
  | "생산중"
  | "입고대기"
  | "검수중"
  | "완료";

export type DisplayStage = WorkflowState;

export type WorkflowAction = {
  label: string;
  nextState: WorkflowState;
};

export type HistoryCategory = "work" | "inventory" | "attachment";
export type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type HistoryFilter = "all" | "work" | "inventory" | "attachment";

export const DISPLAY_STAGES: DisplayStage[] = [
  "작성중",
  "검토요청",
  "발주요청",
  "생산중",
  "입고대기",
  "검수중",
  "완료",
];
