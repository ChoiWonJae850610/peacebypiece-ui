import { getPermissionSummary } from "@/lib/constants/roles";
import type { DisplayStage, UserProfile, WorkflowAction, WorkflowState } from "@/types/workorder";

export const STAGE_ORDER: WorkflowState[] = [
  "작성중",
  "검토대기",
  "검토완료",
  "발주요청",
  "발주완료",
  "생산중",
  "입고대기",
  "검수중",
  "부분완료",
  "완료",
  "반려",
  "종결",
];

export const PRIMARY_FLOW: WorkflowState[] = [
  "작성중",
  "검토대기",
  "검토완료",
  "발주요청",
  "발주완료",
  "생산중",
  "입고대기",
  "검수중",
  "부분완료",
  "완료",
  "종결",
];

export const ACTIONS_BY_STATE: Partial<Record<WorkflowState, WorkflowAction[]>> = {
  작성중: [
    {
      id: "saveDraft",
      label: "임시저장",
      nextState: "작성중",
      permission: "createWorkorder",
    },
    {
      id: "requestReview",
      label: "검토요청",
      nextState: "검토대기",
      permission: "reviewRequest",
    },
  ],
  검토대기: [
    {
      id: "approveReview",
      label: "검토승인",
      nextState: "검토완료",
      permission: "reviewApprove",
    },
    {
      id: "rejectReview",
      label: "검토반려",
      nextState: "반려",
      permission: "reviewApprove",
    },
  ],
  검토완료: [
    {
      id: "requestOrder",
      label: "발주요청",
      nextState: "발주요청",
      permission: "orderRequest",
    },
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
  발주요청: [
    {
      id: "confirmOrder",
      label: "발주확정",
      nextState: "발주완료",
      permission: "orderConfirm",
    },
    {
      id: "rejectReview",
      label: "반려",
      nextState: "반려",
      permission: "reviewApprove",
    },
  ],
  발주완료: [
    {
      id: "startProduction",
      label: "생산시작",
      nextState: "생산중",
      permission: "inbound",
    },
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
  생산중: [
    {
      id: "registerInbound",
      label: "입고등록",
      nextState: "입고대기",
      permission: "inbound",
    },
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
  입고대기: [
    {
      id: "startInspection",
      label: "검수시작",
      nextState: "검수중",
      permission: "inspection",
    },
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
  검수중: [
    {
      id: "completeInspection",
      label: "검수완료",
      nextState: "완료",
      permission: "inspection",
    },
    {
      id: "markPartial",
      label: "부분완료",
      nextState: "부분완료",
      permission: "inspection",
    },
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
  부분완료: [
    {
      id: "registerInbound",
      label: "추가입고 등록",
      nextState: "입고대기",
      permission: "inbound",
    },
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
  완료: [
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
  반려: [
    {
      id: "saveDraft",
      label: "수정 후 저장",
      nextState: "작성중",
      permission: "createWorkorder",
    },
    {
      id: "requestReview",
      label: "재검토요청",
      nextState: "검토대기",
      permission: "createWorkorder",
    },
    {
      id: "closeOrder",
      label: "종결처리",
      nextState: "종결",
      permission: "reviewApprove",
    },
  ],
};

export function getStageTone(state: WorkflowState) {
  switch (state) {
    case "완료":
      return "bg-emerald-100 text-emerald-800";
    case "부분완료":
      return "bg-amber-100 text-amber-800";
    case "반려":
      return "bg-rose-100 text-rose-800";
    case "종결":
      return "bg-stone-200 text-stone-700";
    default:
      return "bg-cyan-100 text-cyan-800";
  }
}

export function getDisplayStage(state: WorkflowState): DisplayStage {
  switch (state) {
    case "작성중":
      return "작성중";
    case "검토대기":
    case "검토완료":
      return "검토중";
    case "발주요청":
    case "발주완료":
    case "생산중":
      return "발주대기";
    case "입고대기":
    case "검수중":
    case "부분완료":
      return "입고대기";
    case "완료":
    case "종결":
      return "완료";
    case "반려":
      return "반려";
  }
}

export function getDisplayStageDescription(state: DisplayStage) {
  switch (state) {
    case "작성중":
      return "작업지시서 초안을 작성하거나 수정하는 단계입니다.";
    case "검토중":
      return "검토 요청 이후 승인 또는 반려가 진행되는 단계입니다.";
    case "발주대기":
      return "발주 요청, 확정, 생산 진행까지를 묶어 보여주는 단계입니다.";
    case "입고대기":
      return "입고 등록과 검수 진행 상태를 묶어 보여주는 단계입니다.";
    case "완료":
      return "검수 완료 또는 종결까지 마무리된 단계입니다.";
    case "반려":
      return "수정 후 다시 검토 요청이 필요한 상태입니다.";
  }
}

export function getVisibleStageListByUser(
  user: UserProfile,
  currentState: WorkflowState,
): DisplayStage[] {
  const summary = getPermissionSummary(user);

  if (currentState === "반려") {
    if (summary === "입고/검수") return ["입고대기", "반려"];
    return ["작성중", "검토중", "반려"];
  }

  if (summary === "디자이너") {
    return ["작성중", "검토중", "발주대기", "완료"];
  }

  if (summary === "입고/검수") {
    return ["입고대기", "완료"];
  }

  return ["작성중", "검토중", "발주대기", "입고대기", "완료"];
}
