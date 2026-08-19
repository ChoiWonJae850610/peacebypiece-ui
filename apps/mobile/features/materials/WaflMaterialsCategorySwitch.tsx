import { Plus } from "lucide-react-native";
import { WAFL_THEME } from "@/constants/theme";
import type { MaterialType } from "@/domain/mobileContract";
import WaflSectionHeaderAction from "@/features/layout/WaflSectionHeaderAction";
import WaflSectionCategorySwitch from "@/features/layout/WaflSectionCategorySwitch";

type Props = {
  readonly accessoryCount: number;
  readonly canAdd: boolean;
  readonly fabricCount: number;
  readonly onAdd: () => void;
  readonly onSelect: (materialType: MaterialType) => void;
  readonly selected: MaterialType;
};

/** Presentation-only switch; Fabric and Accessory remain separate domain/API owners. */
export default function WaflMaterialsCategorySwitch({ accessoryCount, canAdd, fabricCount, onAdd, onSelect, selected }: Props) {
  const selectedLabel = selected === "fabric" ? "원단" : "부자재";
  return <WaflSectionCategorySwitch<MaterialType>
    action={canAdd ? <WaflSectionHeaderAction
      accessibilityLabel={`${selectedLabel} 추가`}
      icon={<Plus color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.standard} strokeWidth={2.4} />}
      onPress={onAdd}
      testID={`material-add-${selected}`}
    /> : undefined}
    onSelect={onSelect}
    optionTestIDPrefix="material-category"
    options={[
      { value: "fabric", label: "원단", count: fabricCount, badgeTone: WAFL_THEME.badge.fabric },
      { value: "accessory", label: "부자재", count: accessoryCount, badgeTone: WAFL_THEME.badge.accessory },
    ]}
    selected={selected}
    testID="materials-category-switch"
  />;
}
