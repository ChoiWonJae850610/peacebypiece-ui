import { useMemo, useState } from "react";

import { createWaflDecisionGuard, resolveWaflDecisionOpeningValue, type WaflDecisionOption } from "@/domain/waflDecisionPolicy";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import type { WaflActionConfirmationState } from "./WaflActionConfirmationCard";
import WaflDecisionChoiceBody from "./WaflDecisionChoiceBody";

export default function WaflDecisionSheet(props: {
  readonly decision: WaflActionConfirmationState | null;
  readonly testID?: string;
}) {
  if (!props.decision) return null;
  return <WaflDecisionSession decision={props.decision} testID={props.testID} />;
}

function WaflDecisionSession(props: { readonly decision: WaflActionConfirmationState; readonly testID?: string }) {
  const [selected, setSelected] = useState<WaflDecisionOption>(resolveWaflDecisionOpeningValue());
  const decision = props.decision;
  const guard = useMemo(() => createWaflDecisionGuard(decision.onCancel, decision.onConfirm), [decision]);

  const safeLabel = decision?.safeOptionLabel ?? "취소";
  const actionLabel = decision?.actionOptionLabel ?? (decision?.destructive ? "삭제" : "확정");
  return <WaflInputSheet
    adaptiveMinimumBodyHeight={226}
    bodyScrollable={false}
    confirmAccessibilityLabel={`${actionLabel} 선택 적용`}
    onCancel={() => { guard.dismiss(); }}
    onConfirm={() => { guard.apply(selected); }}
    showCancelAction={false}
    sizing="reelAdaptive"
    title="WAFL INPUT"
    visible
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
