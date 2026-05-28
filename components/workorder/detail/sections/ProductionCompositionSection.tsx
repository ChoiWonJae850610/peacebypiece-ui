import MaterialSection from "@/components/workorder/detail/sections/MaterialSection";
import { type EditableCell, type EditableSectionKey } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Material, Outsourcing } from "@/types/workorder";

export default function ProductionCompositionSection({
  materials,
  outsourcing,
  open,
  onToggle,
  materialOpen,
  outsourcingOpen,
  onToggleMaterial,
  onToggleOutsourcing,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAddMaterial,
  onRemoveMaterial,
  onAddOutsourcing,
  onRemoveOutsourcing,
  materialVendorOptionsById,
  outsourcingVendorOptionsById,
  outsourcingProcessOptions,
  locked = false,
}: {
  materials: Material[];
  outsourcing: Outsourcing[];
  open: boolean;
  onToggle: () => void;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
  onAddOutsourcing: () => void;
  onRemoveOutsourcing: (id: string) => void;
  materialVendorOptionsById: Record<string, string[]>;
  outsourcingVendorOptionsById: Record<string, string[]>;
  outsourcingProcessOptions: string[];
  locked?: boolean;
}) {
  void open;
  void onToggle;
  void outsourcing;
  void outsourcingOpen;
  void onToggleOutsourcing;
  void onAddOutsourcing;
  void onRemoveOutsourcing;
  void materialVendorOptionsById;
  void outsourcingVendorOptionsById;
  void outsourcingProcessOptions;

  return (
    <div className="overflow-hidden rounded-[22px] border border-stone-200 bg-white p-3 shadow-sm xl:p-3.5">
      <MaterialSection
        materials={materials}
        open={materialOpen}
        onToggle={onToggleMaterial}
        editingCell={editingCell}
        editingValue={editingValue}
        onStartEdit={onStartEdit}
        onCommitEdit={onCommitEdit}
        onCancelEdit={onCancelEdit}
        onAdd={onAddMaterial}
        onRemove={onRemoveMaterial}
        locked={locked}
      />
    </div>
  );
}
