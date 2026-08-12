import type { MaterialPartnerOption } from "@/domain/mobileContract";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";

export default function MaterialPartnerPickerSheet(props: {
  readonly visible: boolean;
  readonly items: readonly MaterialPartnerOption[];
  readonly selectedId: string;
  readonly pending?: boolean;
  readonly onCancel: () => void;
  readonly onSelect: (partnerId: string) => void;
}) {
  return <WaflReelPickerSheet
    field="material-partner"
    kind="option"
    label="거래처 선택"
    onCancel={props.onCancel}
    onApply={(partnerId) => props.onSelect(partnerId)}
    optionItems={props.items.length > 0
      ? props.items.map((item) => ({ value: item.id, label: item.name }))
      : [{ value: "", label: "사용 가능한 거래처가 없습니다. 거래처 관리에서 먼저 등록해 주세요." }]}
    pending={props.pending}
    unitCode=""
    value={props.selectedId}
    visible={props.visible}
  />;
}
