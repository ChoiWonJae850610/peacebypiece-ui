"use client";

import { useMemo, useState } from "react";

import MaterialOrderAllocationPanel from "@/features/material-orders/MaterialOrderAllocationPanel";
import MaterialOrderDetailPanel from "@/features/material-orders/MaterialOrderDetailPanel";
import MaterialOrderListPanel from "@/features/material-orders/MaterialOrderListPanel";
import {
  calculateMaterialOrderDraftTotals,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  createMaterialOrderDraftLine,
  draftMaterialOrderList,
  getDefaultSupplierId,
  initialMaterialOrderDraftLines,
  materialOrderSupplierOptions,
} from "@/lib/material-orders/materialOrderDraftWorkspace";
import type { MaterialOrderDraftGuideItem } from "@/lib/material-orders/materialOrderWorkspaceViewModel";

type MaterialOrderDraftEditorProps = {
  guideItems: MaterialOrderDraftGuideItem[];
};

const MATERIAL_ORDER_PANEL_GRID_STYLE = {
  gridTemplateColumns: "minmax(220px, 0.7fr) minmax(640px, 1fr) minmax(220px, 0.7fr)",
} as const;

export default function MaterialOrderDraftEditor({ guideItems }: MaterialOrderDraftEditorProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(draftMaterialOrderList[0]?.id ?? "");
  const [materialType, setMaterialType] = useState<MaterialOrderDraftType>("fabric");
  const [supplierId, setSupplierId] = useState(getDefaultSupplierId("fabric"));
  const [destinationMemo, setDestinationMemo] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [lines, setLines] = useState<MaterialOrderDraftLine[]>(initialMaterialOrderDraftLines);

  const selectedSupplier = useMemo(
    () => materialOrderSupplierOptions.find((supplier) => supplier.id === supplierId),
    [supplierId],
  );
  const totals = useMemo(() => calculateMaterialOrderDraftTotals(lines), [lines]);

  function updateMaterialType(nextMaterialType: MaterialOrderDraftType) {
    setMaterialType(nextMaterialType);
    setSupplierId(getDefaultSupplierId(nextMaterialType));
  }

  function updateLine(lineId: string, patch: Partial<MaterialOrderDraftLine>) {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, createMaterialOrderDraftLine(current.length + 1)]);
  }

  function removeLine(lineId: string) {
    setLines((current) => current.length > 1 ? current.filter((line) => line.id !== lineId) : current);
  }

  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
      <div
        className="grid h-full min-h-0 min-w-[1080px] gap-3"
        style={MATERIAL_ORDER_PANEL_GRID_STYLE}
      >
        <MaterialOrderListPanel
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
        />
        <MaterialOrderDetailPanel
          materialType={materialType}
          supplierId={supplierId}
          destinationMemo={destinationMemo}
          orderNote={orderNote}
          lines={lines}
          totals={totals}
          selectedSupplier={selectedSupplier}
          onChangeMaterialType={updateMaterialType}
          onChangeSupplierId={setSupplierId}
          onChangeDestinationMemo={setDestinationMemo}
          onChangeOrderNote={setOrderNote}
          onChangeLine={updateLine}
          onAddLine={addLine}
          onRemoveLine={removeLine}
        />
        <MaterialOrderAllocationPanel guideItems={guideItems} />
      </div>
    </div>
  );
}
