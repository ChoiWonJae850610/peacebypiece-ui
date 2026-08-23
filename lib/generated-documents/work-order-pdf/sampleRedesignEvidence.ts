import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";
import { createPdfPaginationEvidencePreview } from "./samplePaginationEvidence";

export type PdfRedesignEvidenceScenario = "normal" | "rich" | "sparse";

function expandMaterialRows<T extends WorkOrderIssuedPreviewReadModel["materials"]["fabrics"][number]>(rows: readonly T[], count: number): readonly T[] {
  return Array.from({ length: count }, (_, index) => {
    const source = rows[index % rows.length];
    const suffix = String(index + 1).padStart(2, "0");
    return {
      ...source,
      id: `${source.id.slice(0, -2)}${suffix}` as T["id"],
      name: `${source.name} ${suffix}`,
      memo: `${source.memo ?? ""} 항목 ${suffix}의 원단 방향, 재단 위치, 봉제 순서와 최종 마감 상태를 함께 확인합니다.`.trim(),
      displayOrder: index,
    } as T;
  });
}

export function createPdfRedesignEvidencePreview(source: WorkOrderIssuedPreviewReadModel, scenario: PdfRedesignEvidenceScenario): WorkOrderIssuedPreviewReadModel {
  const base: WorkOrderIssuedPreviewReadModel = {
    ...source,
    header: { ...source.header, productTypeCode: "wafl-c1|W|D", itemCode: "셔츠원피스" },
    amounts: {
      ...source.amounts,
      processTotal: "12422907.00" as typeof source.amounts.processTotal,
      estimatedTotal: "12422907.00" as typeof source.amounts.estimatedTotal,
    },
    processes: source.processes.map((process) => process.role === "factory"
      ? {
        ...process,
        unitPrice: "9800.00" as typeof process.unitPrice,
        amount: "1411200.00" as typeof process.amount,
      }
      : process),
  };
  if (scenario === "normal") {
    const basic = base.processes.find((process) => process.role === "factory") ?? base.processes[0];
    return {
      ...base,
      materials: { fabrics: base.materials.fabrics.slice(0, 2), accessories: base.materials.accessories.slice(0, 2) },
      processes: basic ? [basic] : [],
    };
  }
  if (scenario === "rich") {
    const rich = createPdfPaginationEvidencePreview(base, 16);
    return {
      ...rich,
      header: { ...rich.header, identity: { isSample: false, derivationKind: "reorder", reorderRound: 3 } },
      materials: {
        fabrics: expandMaterialRows(rich.materials.fabrics, 22),
        accessories: expandMaterialRows(rich.materials.accessories, 24),
      },
      assets: [
        ...rich.assets,
        { assetType: "attachment", filename: "봉제 디테일.jpg", mimeType: "image/jpeg", displayOrder: 1, isRepresentative: false, includeInDocument: true },
        { assetType: "attachment", filename: "마감 기준.jpg", mimeType: "image/jpeg", displayOrder: 2, isRepresentative: false, includeInDocument: true },
        { assetType: "attachment", filename: "라벨 위치.jpg", mimeType: "image/jpeg", displayOrder: 3, isRepresentative: false, includeInDocument: true },
      ],
    };
  }
  const basic = base.processes.find((process) => process.role === "factory") ?? base.processes[0];
  const firstSize = base.sizeColors.sizes.slice(0, 1);
  const firstColor = base.sizeColors.colors.slice(0, 1);
  const sparseQuantityCells = base.sizeColors.quantityCells
    .filter((cell) => cell.colorId === firstColor[0]?.id && cell.sizeRowId === firstSize[0]?.id);
  const sparseTotal = sparseQuantityCells[0]?.quantity ?? base.sizeColors.matrixTotal;
  return {
    ...base,
    header: { ...base.header, productName: "샘플 티셔츠", totalQuantity: 8, identity: { isSample: true, derivationKind: "original", reorderRound: 0 } },
    materials: { fabrics: [], accessories: [] },
    processes: basic ? [{ ...basic, role: "factory", status: "completed" }] : [],
    assets: base.assets.filter((asset) => asset.assetType === "image" && asset.isRepresentative),
    sizeColors: {
      ...base.sizeColors,
      colors: firstColor,
      sizes: firstSize,
      quantityCells: sparseQuantityCells,
      matrixTotal: sparseTotal,
      expectedTotal: sparseTotal,
      totalsMatch: true,
    },
    sizeSpecifications: {
      ...base.sizeSpecifications,
      sizes: base.sizeSpecifications.sizes.slice(0, 1),
      pomColumns: base.sizeSpecifications.pomColumns.slice(0, 5),
      cells: base.sizeSpecifications.cells.filter((cell) => cell.sizeRowId === base.sizeSpecifications.sizes[0]?.id).slice(0, 5),
    },
  };
}
