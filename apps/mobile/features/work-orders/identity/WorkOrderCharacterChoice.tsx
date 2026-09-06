import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import WaflChoiceButtons from "@/features/inputs/WaflChoiceButtons";

type WorkOrderCharacter = "production" | "sample";

const OPTIONS = [
  { value: "production", label: "본생산" },
  { value: "sample", label: "샘플" },
] as const;

type Props = {
  readonly disabled?: boolean;
  readonly isSample: boolean;
  readonly onChange: (isSample: boolean) => void;
  readonly presentation?: "form" | "compact";
};

const WorkOrderCharacterChoice = forwardRef<View, Props>(function WorkOrderCharacterChoice(props, ref) {
  const selectedValue: WorkOrderCharacter = props.isSample ? "sample" : "production";
  const compact = props.presentation === "compact";
  return <View collapsable={false} ref={ref} style={[styles.container, compact && styles.containerCompact]}>
    {compact ? null : <Text style={styles.label}>작업 구분</Text>}
    <WaflChoiceButtons
      accessibilityLabel="작업 구분"
      disabled={props.disabled}
      onSelect={(value) => props.onChange(value === "sample")}
      options={OPTIONS}
      presentation={props.presentation}
      selectedValue={selectedValue}
    />
  </View>;
});

export default WorkOrderCharacterChoice;

const styles = StyleSheet.create({
  container: { gap: WAFL_THEME.layout.tightGap },
  containerCompact: { flexShrink: 0, justifyContent: "center", minHeight: WAFL_THEME.touch.minimum },
  label: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.fieldLabel.fontSize, lineHeight: WAFL_THEME.typography.fieldLabel.lineHeight },
});
