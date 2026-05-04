import { useState } from "react";
import {
  blurActiveEditableElement,
  type EditableCell,
  type EditableSectionKey,
} from "@/components/workorder/detail/shared/detailEditorShared";

export function useWorkOrderEditingSession() {
  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [editingValue, setEditingValue] = useState("");

  const startEdit = (section: EditableSectionKey, rowId: string, field: string, value: string) => {
    setEditingCell({ section, rowId, field });
    setEditingValue(value);
  };

  const cancelEdit = () => {
    blurActiveEditableElement();
    setEditingCell(null);
    setEditingValue("");
  };

  return {
    editingCell,
    editingValue,
    setEditingValue,
    startEdit,
    cancelEdit,
  };
}
