import { StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WaflDecisionOption } from "@/domain/waflDecisionPolicy";
import { WaflOptionReel } from "@/features/inputs/reel-picker/WaflOptionReel";

export type WaflDecisionChoiceState = {
  readonly title: string;
  readonly helper: string;
  readonly safeLabel: string;
  readonly actionLabel: string;
  readonly destructive?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export default function WaflDecisionChoiceBody(props: {
  readonly decision: WaflDecisionChoiceState;
  readonly onSelect: (value: WaflDecisionOption) => void;
  readonly selected: WaflDecisionOption;
  readonly testID?: string;
}) {
  return <View style={styles.body} testID={props.testID ?? "wafl-decision-choice-body"}>
    <Text style={styles.label}>{props.decision.title}</Text>
    {props.decision.helper ? <Text style={styles.helper}>{props.decision.helper}</Text> : null}
    <WaflOptionReel
      accessibilityLabel={`${props.decision.title} 선택 릴`}
      onSelect={(value) => props.onSelect(value === "action" ? "action" : "safe")}
      options={[
        { key: "decision-safe", label: props.decision.safeLabel, value: "safe" },
        { key: "decision-action", label: props.decision.actionLabel, value: "action" },
      ]}
      selectedValue={props.selected}
    />
  </View>;
}

const styles = StyleSheet.create({
  body: { gap: WAFL_THEME.spacing.sm, paddingTop: WAFL_THEME.spacing.sm },
  label: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 15, lineHeight: 22, textAlign: "center" },
  helper: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, textAlign: "center" },
});
