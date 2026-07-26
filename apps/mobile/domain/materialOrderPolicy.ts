export type MaterialOrderOperationalStatus =
  | "editing"
  | "requested"
  | "completed"
  | "cancelled"
  | "unknown";

export type MaterialOrderAction = "request" | "cancel" | "complete";

export type MaterialOrderPolicy = {
  readonly label: "발주 전" | "발주요청" | "발주완료" | "과거 취소" | "상태 확인 필요";
  readonly tone: "editing" | "requested" | "completed" | "legacy-cancelled" | "unknown";
  readonly legacyCancelled: boolean;
  readonly locked: boolean;
  readonly canEdit: boolean;
  readonly canRequest: boolean;
  readonly canCancel: boolean;
  readonly canComplete: boolean;
  readonly actions: readonly MaterialOrderAction[];
};

export function resolveMaterialOrderPolicy(input: {
  readonly status: MaterialOrderOperationalStatus;
  readonly lifecycle: "active" | "archived";
  readonly currentDraft: boolean;
  readonly serverLocked: boolean;
  readonly canUpdate: boolean;
  readonly canRequestOrder: boolean;
  readonly canCompleteOrder: boolean;
}): MaterialOrderPolicy {
  const activeDraft = input.lifecycle === "active" && input.currentDraft;
  const legacyCancelled = input.status === "cancelled";
  const canEdit = (
    activeDraft
    && input.status === "editing"
    && !input.serverLocked
    && input.canUpdate
  );
  const canRequest = (
    activeDraft
    && input.status === "editing"
    && !input.serverLocked
    && input.canRequestOrder
  );
  const canCancel = (
    activeDraft
    && input.status === "requested"
    && input.canRequestOrder
  );
  const canComplete = (
    activeDraft
    && input.status === "requested"
    && input.canCompleteOrder
  );
  const actions: MaterialOrderAction[] = [];
  if (canRequest) actions.push("request");
  if (canComplete) actions.push("complete");
  if (canCancel) actions.push("cancel");

  if (input.status === "editing") {
    return {
      label: "발주 전",
      tone: "editing",
      legacyCancelled,
      locked: !canEdit,
      canEdit,
      canRequest,
      canCancel,
      canComplete,
      actions,
    };
  }
  if (input.status === "requested") {
    return {
      label: "발주요청",
      tone: "requested",
      legacyCancelled,
      locked: true,
      canEdit,
      canRequest,
      canCancel,
      canComplete,
      actions,
    };
  }
  if (input.status === "completed") {
    return {
      label: "발주완료",
      tone: "completed",
      legacyCancelled,
      locked: true,
      canEdit,
      canRequest,
      canCancel,
      canComplete,
      actions,
    };
  }
  if (legacyCancelled) {
    return {
      label: "과거 취소",
      tone: "legacy-cancelled",
      legacyCancelled,
      locked: true,
      canEdit: false,
      canRequest: false,
      canCancel: false,
      canComplete: false,
      actions: [],
    };
  }
  return {
    label: "상태 확인 필요",
    tone: "unknown",
    legacyCancelled: false,
    locked: true,
    canEdit: false,
    canRequest: false,
    canCancel: false,
    canComplete: false,
    actions: [],
  };
}
