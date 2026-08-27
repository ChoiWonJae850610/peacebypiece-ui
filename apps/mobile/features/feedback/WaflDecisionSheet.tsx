import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { createWaflDecisionGuard, resolveWaflDecisionOpeningValue, type WaflDecisionOption } from "@/domain/waflDecisionPolicy";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import { WaflOptionReel } from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import type { WaflActionConfirmationState } from "./WaflActionConfirmationCard";

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
    <View style={styles.body} testID={props.testID ?? "wafl-decision-sheet"}>
      <Text style={styles.label}>{decision.title}</Text>
      {decision.helper ? <Text style={styles.helper}>{decision.helper}</Text> : null}
      <WaflOptionReel
        accessibilityLabel={`${decision.title} 선택 릴`}
        onSelect={(value) => setSelected(value === "action" ? "action" : "safe")}
        options={[
          { key: "decision-safe", label: safeLabel, value: "safe" },
          { key: "decision-action", label: actionLabel, value: "action" },
        ]}
        selectedValue={selected}
      />
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  body: { gap: WAFL_THEME.spacing.sm, paddingTop: WAFL_THEME.spacing.sm },
  label: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 15, lineHeight: 22, textAlign: "center" },
  helper: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, textAlign: "center" },
});
