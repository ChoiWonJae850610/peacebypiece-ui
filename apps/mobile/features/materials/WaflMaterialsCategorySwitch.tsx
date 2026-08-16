import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { MaterialType } from "@/domain/mobileContract";
import WaflSectionHeaderAction from "@/features/layout/WaflSectionHeaderAction";

type Props = {
  readonly accessoryCount: number;
  readonly canAdd: boolean;
  readonly fabricCount: number;
  readonly onAdd: () => void;
  readonly onSelect: (materialType: MaterialType) => void;
  readonly selected: MaterialType;
};

function CategoryChoice({ count, label, materialType, onSelect, selected }: {
  readonly count: number;
  readonly label: string;
  readonly materialType: MaterialType;
  readonly onSelect: (materialType: MaterialType) => void;
  readonly selected: boolean;
}) {
  const badgeTone = materialType === "fabric" ? WAFL_THEME.badge.fabric : WAFL_THEME.badge.accessory;
  return <Pressable
    accessibilityLabel={`${label} ${count}개`}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={() => onSelect(materialType)}
    style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}
    testID={`material-category-${materialType}`}
  >
    <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    <View style={[styles.badge, { backgroundColor: badgeTone.background, borderColor: badgeTone.border }]}>
      <Text style={[styles.badgeText, { color: badgeTone.foreground }]}>{count}</Text>
    </View>
  </Pressable>;
}

/** Presentation-only switch; Fabric and Accessory remain separate domain/API owners. */
export default function WaflMaterialsCategorySwitch({ accessoryCount, canAdd, fabricCount, onAdd, onSelect, selected }: Props) {
  const selectedLabel = selected === "fabric" ? "원단" : "부자재";
  return <View style={styles.container} testID="materials-category-switch">
    <View style={styles.choices}>
      <CategoryChoice count={fabricCount} label="원단" materialType="fabric" onSelect={onSelect} selected={selected === "fabric"} />
      <CategoryChoice count={accessoryCount} label="부자재" materialType="accessory" onSelect={onSelect} selected={selected === "accessory"} />
    </View>
    {canAdd ? <WaflSectionHeaderAction
      accessibilityLabel={`${selectedLabel} 추가`}
      icon={<Plus color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.standard} strokeWidth={2.4} />}
      onPress={onAdd}
      testID={`material-add-${selected}`}
    /> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { alignItems: "center", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, flexDirection: "row", justifyContent: "space-between", minHeight: WAFL_THEME.touch.minimum, paddingBottom: WAFL_THEME.layout.tightGap },
  choices: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.controlGap },
  choice: { alignItems: "center", borderBottomColor: "transparent", borderBottomWidth: WAFL_THEME.border.active, borderRadius: WAFL_THEME.radius.field, flexDirection: "row", gap: WAFL_THEME.layout.tightGap, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.layout.controlGap },
  choiceSelected: { backgroundColor: WAFL_THEME.color.fabricBeige, borderBottomColor: WAFL_THEME.color.editActive },
  label: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyStrong.fontSize, lineHeight: WAFL_THEME.typography.bodyStrong.lineHeight },
  labelSelected: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold },
  badge: { alignItems: "center", borderRadius: WAFL_THEME.radius.pill, borderWidth: WAFL_THEME.border.hairline, justifyContent: "center", minHeight: 20, minWidth: 20, paddingHorizontal: WAFL_THEME.layout.tightGap },
  badgeText: { fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.badge.fontSize, lineHeight: WAFL_THEME.typography.badge.lineHeight },
  pressed: { opacity: 0.68 },
});
