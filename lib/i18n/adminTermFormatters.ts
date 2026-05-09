import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminT = ReturnType<typeof useAdminTranslation>;

export type AdminTermCountKind =
  | "item"
  | "workOrder"
  | "document"
  | "design"
  | "memo"
  | "documentDesign"
  | "documentDesignMemo";

const COUNT_KEY_BY_KIND: Record<AdminTermCountKind, string> = {
  item: "terms.count.item",
  workOrder: "terms.count.workOrder",
  document: "terms.count.document",
  design: "terms.count.design",
  memo: "terms.count.memo",
  documentDesign: "terms.count.documentDesign",
  documentDesignMemo: "terms.count.documentDesignMemo",
};

const COUNT_FALLBACK_BY_KIND: Record<AdminTermCountKind, string> = {
  item: "{count}개",
  workOrder: "{count}건",
  document: "문서 {count}개",
  design: "디자인 {count}개",
  memo: "메모 {count}개",
  documentDesign: "문서/디자인 {count}개",
  documentDesignMemo: "문서/디자인/메모 {count}개",
};

export function formatAdminTermCount(
  t: AdminT,
  count: number,
  kind: AdminTermCountKind = "item",
): string {
  return t(COUNT_KEY_BY_KIND[kind], COUNT_FALLBACK_BY_KIND[kind], { count });
}

export function translateAdminFileTypeTerm(
  rawLabel: string | null | undefined,
  t: AdminT,
): string {
  const label = (rawLabel || "").trim();
  const normalized = label.toLowerCase();
  if (label === "문서" || normalized === "document" || normalized === "documents") {
    return t("terms.files.document", "문서");
  }
  if (label === "디자인" || normalized === "design" || normalized === "designs") {
    return t("terms.files.design", "디자인");
  }
  if (label === "작업메모" || label === "메모" || normalized === "memo" || normalized === "memos") {
    return t("terms.files.memo", "메모");
  }
  if (label === "첨부파일" || normalized === "attachment" || normalized === "attachments") {
    return t("terms.files.documentDesignGroup", "문서/디자인");
  }
  return t("terms.files.other", "기타");
}

export function formatAdminDocumentDesignCount(t: AdminT, count: number): string {
  return formatAdminTermCount(t, count, "documentDesign");
}

export function formatAdminMemoCount(t: AdminT, count: number): string {
  return formatAdminTermCount(t, count, "memo");
}
