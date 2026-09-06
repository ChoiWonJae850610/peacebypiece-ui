import { useMemo, useRef, useState } from "react";

import { createWaflDecisionGuard, resolveWaflDecisionOpeningValue, type WaflDecisionOption } from "@/domain/waflDecisionPolicy";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import type { WaflActionConfirmationState } from "./WaflActionConfirmationCard";
import WaflDecisionChoiceBody from "./WaflDecisionChoiceBody";

export default function WaflDecisionSheet(props: {
  readonly decision: WaflActionConfirmationState | null;
  readonly resolveAfterClose?: boolean;
  readonly testID?: string;
}) {
  if (!props.decision) return null;
  return <WaflDecisionSession decision={props.decision} resolveAfterClose={props.resolveAfterClose ?? false} testID={props.testID} />;
}

function WaflDecisionSession(props: { readonly decision: WaflActionConfirmationState; readonly resolveAfterClose: boolean; readonly testID?: string }) {
  const [selected, setSelected] = useState<WaflDecisionOption>(resolveWaflDecisionOpeningValue());
  const [visible, setVisible] = useState(true);
  const pendingResolutionRef = useRef<WaflDecisionOption | null>(null);
  const decision = props.decision;
  const guard = useMemo(() => createWaflDecisionGuard(decision.onCancel, decision.onConfirm), [decision]);

  function requestResolution(value: WaflDecisionOption) {
    if (!props.resolveAfterClose) {
      guard.apply(value);
      return;
    }
    if (pendingResolutionRef.current !== null) return;
    pendingResolutionRef.current = value;
    setVisible(false);
  }

  function resolveAfterSheetClose() {
    const value = pendingResolutionRef.current;
    if (value === null) return;
    pendingResolutionRef.current = null;
    guard.apply(value);
  }

  function cancel() {
    if (!props.resolveAfterClose) {
      guard.dismiss();
      return;
    }
    if (pendingResolutionRef.current === null) pendingResolutionRef.current = "safe";
  }

  const safeLabel = decision?.safeOptionLabel ?? "취소";
  const actionLabel = decision?.actionOptionLabel ?? (decision?.destructive ? "삭제" : "확정");
  return <WaflInputSheet
    adaptiveMinimumBodyHeight={226}
    bodyScrollable={false}
    confirmAccessibilityLabel={`${actionLabel} 선택 적용`}
    onAfterClose={props.resolveAfterClose ? resolveAfterSheetClose : undefined}
    onCancel={cancel}
    onConfirm={() => { requestResolution(selected); }}
    showCancelAction={false}
    sizing="reelAdaptive"
    title="WAFL INPUT"
    visible={visible}
  >
    <WaflDecisionChoiceBody
      decision={{
        actionLabel,
        destructive: decision.destructive,
        helper: decision.helper ?? "",
        onCancel: decision.onCancel,
        onConfirm: decision.onConfirm,
        safeLabel,
        title: decision.title,
      }}
      onSelect={setSelected}
      selected={selected}
      testID={props.testID ?? "wafl-decision-sheet"}
    />
  </WaflInputSheet>;
}
