import type { MaterialPartnerOption } from "@/domain/mobileContract";
import WaflInputModeSwitch from "@/features/inputs/WaflInputModeSwitch";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";

export default function MaterialPartnerPickerSheet(props: {
  readonly visible: boolean;
  readonly items: readonly MaterialPartnerOption[];
  readonly selectedId: string;
  readonly allowUnset?: boolean;
  readonly pending?: boolean;
  readonly presentationGeneration?: number;
  readonly onCancel: () => void;
  readonly onAfterClose?: () => void;
  readonly onSelect: (partnerId: string) => void;
  readonly onUnset?: () => void;
  readonly onSwitchToDirectInput?: () => void;
}) {
  return <WaflReelPickerSheet
    field="material-partner"
    kind="option"
    label="거래처 선택"
    onCancel={props.onCancel}
    onAfterClose={props.onAfterClose}
    allowUnset={props.allowUnset}
    footer={props.onSwitchToDirectInput ? <WaflInputModeSwitch mode="picker" onPress={props.onSwitchToDirectInput} /> : undefined}
    onApply={(partnerId) => {
      if (!partnerId) return props.onUnset?.();
      return props.onSelect(partnerId);
    }}
    optionItems={[
      ...props.items.map((item) => ({ value: item.id, label: item.name })),
      ...(!props.allowUnset && props.items.length === 0
        ? [{ value: "", label: "사용 가능한 거래처가 없습니다. 거래처 관리에서 먼저 등록해 주세요." }]
        : []),
    ]}
    pending={props.pending}
    presentationGeneration={props.presentationGeneration}
    unitCode=""
    value={props.selectedId}
    visible={props.visible}
  />;
}
