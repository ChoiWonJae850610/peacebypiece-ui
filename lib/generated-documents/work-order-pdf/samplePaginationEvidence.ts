import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";

const ALLOWED_POM_COUNTS = new Set([5, 16, 30]);

export function normalizePdfPaginationEvidencePomCount(input: string | number | null | undefined): 5 | 16 | 30 {
  const parsed = typeof input === "number" ? input : Number(input);
  return ALLOWED_POM_COUNTS.has(parsed) ? parsed as 5 | 16 | 30 : 5;
}

export function createPdfPaginationEvidencePreview(
  source: WorkOrderIssuedPreviewReadModel,
  pomRowCount: 5 | 16 | 30,
): WorkOrderIssuedPreviewReadModel {
  if (pomRowCount === source.sizeSpecifications.pomColumns.length) return source;
  const pomColumns = Array.from({ length: pomRowCount }, (_, index) => ({
    code: `QA_POM_${String(index + 1).padStart(2, "0")}`,
    displayName: `검증 스펙 항목 ${String(index + 1).padStart(2, "0")}`,
    displayOrder: index,
    id: `60000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  }));
  const cells = pomColumns.flatMap((pom, pomIndex) => source.sizeSpecifications.sizes.map((size, sizeIndex) => ({
    decimalValue: String(40 + pomIndex + sizeIndex * 0.5),
    displayValue: String(40 + pomIndex + sizeIndex * 0.5),
    pomColumnId: pom.id,
    sizeRowId: size.id,
  })));
  const withDecimalEvidence = (rows: WorkOrderIssuedPreviewReadModel["materials"]["fabrics"]) => rows.map((row, index) => ({
    ...row,
    allowanceQuantity: index === 0 ? "0.125" : "0.000",
    requiredQuantity: index === 0 ? "1.500" : "1.000",
  }));
  return {
    ...source,
    materials: {
      accessories: withDecimalEvidence(source.materials.accessories),
      fabrics: withDecimalEvidence(source.materials.fabrics),
    },
    processes: source.processes.map((process, index) => ({ ...process, quantity: index === 0 ? "1.250" : "1.000" })),
    sizeSpecifications: { ...source.sizeSpecifications, cells, pomColumns },
  } as unknown as WorkOrderIssuedPreviewReadModel;
}

export type PdfProcessEvidenceScenario = "basic-only" | "basic-additional";

export function createPdfProcessEvidencePreview(
  source: WorkOrderIssuedPreviewReadModel,
  scenario: PdfProcessEvidenceScenario,
): WorkOrderIssuedPreviewReadModel {
  const sourceBasic = source.processes[0];
  if (!sourceBasic) throw new Error("PDF process evidence requires a source process.");
  const basic = {
    ...sourceBasic,
    displayOrder: 0,
    partnerName: "한강 봉제 공장",
    processName: "제작 공장",
    processTypeCode: "production_factory",
    role: "factory" as const,
  };
  const additionalSource = source.processes[1] ?? sourceBasic;
  const additional = {
    ...additionalSource,
    displayOrder: 1,
    partnerName: "성수 나염 업체",
    processName: "나염",
    processTypeCode: "printing",
    role: "additional" as const,
  };
  return {
    ...source,
    processes: scenario === "basic-only" ? [basic] : [basic, additional],
  } as WorkOrderIssuedPreviewReadModel;
}
