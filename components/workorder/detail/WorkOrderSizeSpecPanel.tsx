"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  WaflDataTableBody,
  WaflDataTableHeader,
  WaflDataTableRow,
  WaflDataTableShell,
} from "@/components/admin/common/WaflDataTable";
import ModalShell from "@/components/common/modal/ModalShell";
import { WaflButton } from "@/components/common/ui/WaflButton";
import WaflNumberInput from "@/components/common/ui/WaflNumberInput";
import WaflSelect from "@/components/common/ui/WaflSelect";

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; code?: string; message?: string };

type SizeSpecSize = {
  code: string;
  displayLabel: string;
};

type SizeSpecPom = {
  code: string;
  displayName: string;
  measurementType: string;
  instruction: string | null;
};

type SizeSpecValue = {
  sizeCode: string;
  pomCode: string;
  displayValue: string;
};

type SizeSpec = {
  workOrderId: string;
  sizeSetCode: string | null;
  measurementUnit: "cm" | "inch";
  sizes: SizeSpecSize[];
  poms: SizeSpecPom[];
  values: SizeSpecValue[];
};

type SizeSpecResponse = {
  spec: SizeSpec;
  editPolicy: {
    editable: boolean;
    code: string | null;
    message: string | null;
  };
};

type GeneratedPdfResult = {
  ok?: boolean;
  attachment?: {
    id: string;
    name: string;
  } | null;
  documentKind?: "incomplete" | "final";
  missingItems?: string[];
  error?: string;
};

const inchFractions = [
  { label: "0", value: "" },
  { label: "1/8", value: "1/8" },
  { label: "1/4", value: "1/4" },
  { label: "3/8", value: "3/8" },
  { label: "1/2", value: "1/2" },
  { label: "5/8", value: "5/8" },
  { label: "3/4", value: "3/4" },
  { label: "7/8", value: "7/8" },
];

const measurementTypeLabels: Record<string, string> = {
  half_flat: "완성 평면",
  circumference: "둘레",
  quarter_pattern_reference: "패턴 1/4 기준",
  length: "길이",
};

function getValueKey(sizeCode: string, pomCode: string) {
  return `${pomCode}::${sizeCode}`;
}

function toValueMap(values: SizeSpecValue[]) {
  return new Map(values.map((value) => [getValueKey(value.sizeCode, value.pomCode), value.displayValue]));
}

function normalizeInputValue(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 32);
}

function valueToNumber(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInchValue(value: string): { whole: string; fraction: string } {
  const [whole = "", fraction = ""] = value.trim().split(/\s+/, 2);
  return {
    whole: whole.replace(/\D/g, "").slice(0, 3),
    fraction: inchFractions.some((item) => item.value === fraction) ? fraction : "",
  };
}

function formatInchValue(whole: string, fraction: string) {
  const normalizedWhole = whole.replace(/\D/g, "").slice(0, 3);
  if (!normalizedWhole && !fraction) return "";
  return [normalizedWhole || "0", fraction].filter(Boolean).join(" ");
}

function getSafePdfMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("WORKORDER_FINAL_PDF_NOT_READY")) {
    return "아직 비어 있는 항목이 있어 미완성 PDF로 만들 수 있습니다.";
  }
  if (message.includes("PDF_OBJECT_MISSING")) {
    return "PDF 파일을 찾을 수 없습니다. 다시 만들어 주세요.";
  }
  return "PDF를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function WorkOrderSizeSpecPanel({
  workOrderId,
  locked = false,
  editorPresentation = "modal",
}: {
  workOrderId: string;
  locked?: boolean;
  editorPresentation?: "modal" | "inline";
}) {
  const [state, setState] = useState<"loading" | "ready" | "error" | "saving">("loading");
  const [error, setError] = useState<string | null>(null);
  const [spec, setSpec] = useState<SizeSpec | null>(null);
  const [editable, setEditable] = useState(false);
  const [draftValues, setDraftValues] = useState<Map<string, string>>(() => new Map());
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [pdfLink, setPdfLink] = useState<{ href: string; label: string; kind: "incomplete" | "final" } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const loadSpec = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const response = await fetch(`/api/workorders/${encodeURIComponent(workOrderId)}/size-spec`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as ApiSuccess<SizeSpecResponse> | ApiFailure | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload && "message" in payload && payload.message ? payload.message : "치수표를 불러오지 못했습니다.");
      }

      setSpec(payload.data.spec);
      setEditable(payload.data.editPolicy.editable);
      setDraftValues(toValueMap(payload.data.spec.values));
      setState("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "치수표를 불러오지 못했습니다.");
      setState("error");
    }
  }, [workOrderId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSpec();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSpec]);

  const values = useMemo(() => {
    if (!spec) return [];
    const result: SizeSpecValue[] = [];
    for (const pom of spec.poms) {
      for (const size of spec.sizes) {
        const displayValue = draftValues.get(getValueKey(size.code, pom.code)) ?? "";
        if (displayValue.trim()) {
          result.push({ pomCode: pom.code, sizeCode: size.code, displayValue: normalizeInputValue(displayValue) });
        }
      }
    }
    return result;
  }, [draftValues, spec]);

  const filledCount = values.length;
  const totalCount = (spec?.sizes.length ?? 0) * (spec?.poms.length ?? 0);
  const completionLabel = totalCount > 0 ? `${filledCount}/${totalCount} 입력` : "치수 기준 없음";
  const sizeRangeLabel = spec?.sizes.length
    ? `${spec.sizes[0]?.displayLabel ?? ""}~${spec.sizes[spec.sizes.length - 1]?.displayLabel ?? ""}`
    : "-";

  const updateValue = (sizeCode: string, pomCode: string, value: string) => {
    const key = getValueKey(sizeCode, pomCode);
    setDraftValues((previous) => {
      const next = new Map(previous);
      next.set(key, value);
      return next;
    });
  };

  const saveSpec = async () => {
    if (!spec || locked || !editable) return;
    setState("saving");
    setError(null);
    try {
      const response = await fetch(`/api/workorders/${encodeURIComponent(workOrderId)}/size-spec`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          measurementUnit: spec.measurementUnit,
          sizeSetCode: spec.sizeSetCode,
          values,
        }),
      });
      const payload = (await response.json().catch(() => null)) as ApiSuccess<SizeSpecResponse> | ApiFailure | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload && "message" in payload && payload.message ? payload.message : "치수표를 저장하지 못했습니다.");
      }
      setSpec(payload.data.spec);
      setDraftValues(toValueMap(payload.data.spec.values));
      setEditable(payload.data.editPolicy.editable);
      setState("ready");
      setIsEditorOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "치수표를 저장하지 못했습니다.");
      setState("ready");
    }
  };

  const generatePdf = async () => {
    setIsPrinting(true);
    setPdfStatus("작업지시서 PDF를 만들고 있습니다.");
    setPdfLink(null);
    try {
      const response = await fetch(`/api/workorders/${encodeURIComponent(workOrderId)}/generated/workorder-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "auto" }),
      });
      const result = (await response.json().catch(() => null)) as GeneratedPdfResult | null;
      if (!response.ok || !result?.ok || !result.attachment) {
        throw new Error(result?.error ?? "WORKORDER_PDF_CREATE_FAILED");
      }
      const kind = result.documentKind === "final" ? "final" : "incomplete";
      setPdfStatus(kind === "final" ? "최종 PDF를 만들었습니다." : "미완성 PDF를 만들었습니다.");
      setPdfLink({
        href: `/api/workorders/${encodeURIComponent(workOrderId)}/generated/workorder-pdf/${encodeURIComponent(result.attachment.id)}/view`,
        label: result.attachment.name,
        kind,
      });
    } catch (pdfError) {
      setPdfStatus(getSafePdfMessage(pdfError));
    } finally {
      setIsPrinting(false);
    }
  };

  const isActionDisabled = locked || !editable || state === "saving" || !spec;
  const gridTemplateColumns = `minmax(180px, 1.4fr) repeat(${Math.max(spec?.sizes.length ?? 1, 1)}, minmax(132px, 1fr))`;

  return (
    <section
      data-workorder-size-panel="side"
      className="wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4 shadow-none"
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pbp-text-subtle)]">사이즈 스펙</p>
          <h3 className="text-base font-semibold text-[var(--pbp-text-primary)]">작업지시서 치수</h3>
          <p className="mt-1 text-sm text-[var(--pbp-text-muted)]">
            {sizeRangeLabel} · 측정 항목 {spec?.poms.length ?? 0}개 · {spec?.measurementUnit ?? "cm"} · {completionLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WaflButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={!spec}
            onClick={() => setIsEditorOpen((open) => editorPresentation === "inline" ? !open : true)}
          >
            치수 입력 및 수정
          </WaflButton>
          <WaflButton
            type="button"
            variant="primary"
            size="sm"
            disabled={locked || isPrinting || !spec}
            onClick={() => void generatePdf()}
            aria-label="작업지시서 출력"
            title="작업지시서 출력"
          >
            {isPrinting ? "출력 중" : "작업지시서 출력"}
          </WaflButton>
        </div>
      </div>

      {state === "loading" ? (
        <p className="mt-4 text-sm text-[var(--pbp-text-muted)]">치수 정보를 불러오고 있습니다.</p>
      ) : null}

      {state === "error" ? (
        <div className="mt-4 wafl-shape-control border border-[var(--pbp-danger-border)] bg-[var(--pbp-danger-bg)] p-3 text-sm text-[var(--pbp-danger-text)]">
          <p>{error}</p>
          <WaflButton type="button" variant="secondary" size="sm" className="mt-2" onClick={() => void loadSpec()}>
            다시 시도
          </WaflButton>
        </div>
      ) : null}

      {spec && state !== "loading" && state !== "error" ? (
        <div className="mt-4 grid gap-2 wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3 text-sm text-[var(--pbp-text-muted)]">
          <p>치수는 이 오른쪽 패널에서 요약만 표시하고, 전체 입력은 공통 모달에서 수정합니다.</p>
          {spec.poms.length > 0 ? (
            <p>{spec.poms.slice(0, 4).map((pom) => pom.displayName).join(", ")}{spec.poms.length > 4 ? " …" : ""}</p>
          ) : (
            <p>사용할 치수 항목이 없습니다. 회사 카탈로그 설정을 확인해 주세요.</p>
          )}
          {error ? <p className="text-[var(--pbp-danger-text)]">{error}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 border-t border-[var(--pbp-border)] pt-4">
        {pdfStatus ? <p className="text-sm text-[var(--pbp-text-muted)]">{pdfStatus}</p> : null}
        {pdfLink ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="wafl-shape-pill border border-[var(--pbp-border)] px-2 py-1 text-xs font-semibold">
              {pdfLink.kind === "final" ? "최종본" : "미완성본"}
            </span>
            <a className="font-semibold underline" href={pdfLink.href} target="_blank" rel="noreferrer">
              {pdfLink.label}
            </a>
          </div>
        ) : null}
      </div>

      {spec && editorPresentation === "inline" && isEditorOpen ? (
        <div
          data-workorder-size-inline-editor="true"
          className="mt-4 grid gap-4 wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--pbp-text-primary)]">단위</span>
            <WaflSelect
              value={spec.measurementUnit}
              disabled={isActionDisabled}
              onValueChange={(value) => setSpec({ ...spec, measurementUnit: value === "inch" ? "inch" : "cm" })}
              ariaLabel="치수 단위"
              options={[
                { value: "cm", label: "cm" },
                { value: "inch", label: "inch" },
              ]}
              size="sm"
              width="auto"
            />
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <WaflDataTableShell>
                <WaflDataTableHeader gridTemplateColumns={gridTemplateColumns}>
                  <div className="font-semibold">측정 항목</div>
                  {spec.sizes.map((size) => (
                    <div key={size.code} className="font-semibold">
                      {size.displayLabel}
                    </div>
                  ))}
                </WaflDataTableHeader>
                <WaflDataTableBody>
                  {spec.poms.map((pom) => (
                    <WaflDataTableRow key={pom.code} gridTemplateColumns={gridTemplateColumns}>
                      <div className="min-w-[180px] text-left">
                        <span className="block font-semibold">{pom.displayName}</span>
                        <span className="block text-xs font-normal text-[var(--pbp-text-muted)]">
                          {measurementTypeLabels[pom.measurementType] ?? pom.measurementType}
                        </span>
                      </div>
                      {spec.sizes.map((size) => {
                        const value = draftValues.get(getValueKey(size.code, pom.code)) ?? "";
                        const inchValue = parseInchValue(value);
                        return (
                          <div key={`${pom.code}-${size.code}`} className="min-w-0">
                            {spec.measurementUnit === "inch" ? (
                              <div className="flex min-w-[148px] gap-1">
                                <WaflNumberInput
                                  className="w-16 border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2 py-1.5 text-sm disabled:opacity-60"
                                  value={valueToNumber(inchValue.whole)}
                                  disabled={locked || !editable}
                                  inputMode="numeric"
                                  onValueChange={(nextValue) => updateValue(size.code, pom.code, formatInchValue(String(Math.trunc(nextValue)), inchValue.fraction))}
                                  ariaLabel={`${pom.displayName} ${size.displayLabel} 정수`}
                                />
                                <WaflSelect
                                  value={inchValue.fraction}
                                  disabled={locked || !editable}
                                  onValueChange={(nextValue) => updateValue(size.code, pom.code, formatInchValue(inchValue.whole, nextValue))}
                                  ariaLabel={`${pom.displayName} ${size.displayLabel} 분수`}
                                  options={inchFractions.map((fraction) => ({ value: fraction.value, label: fraction.label }))}
                                  size="sm"
                                  width="auto"
                                  className="w-20"
                                />
                              </div>
                            ) : (
                              <WaflNumberInput
                                className="w-24 border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2 py-1.5 text-sm disabled:opacity-60"
                                value={valueToNumber(value)}
                                disabled={locked || !editable}
                                inputMode="decimal"
                                onValueChange={(nextValue) => updateValue(size.code, pom.code, String(nextValue))}
                                ariaLabel={`${pom.displayName} ${size.displayLabel}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </WaflDataTableRow>
                  ))}
                </WaflDataTableBody>
              </WaflDataTableShell>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <WaflButton type="button" variant="secondary" onClick={() => setIsEditorOpen(false)}>
              닫기
            </WaflButton>
            <WaflButton type="button" variant="primary" onClick={() => void saveSpec()} disabled={isActionDisabled}>
              {state === "saving" ? "저장 중" : "저장"}
            </WaflButton>
          </div>
        </div>
      ) : null}

      {spec && editorPresentation === "modal" ? (
        <ModalShell
          open={isEditorOpen}
          title="사이즈별 측정값"
          description={completionLabel}
          onClose={() => setIsEditorOpen(false)}
          maxWidthClass="md:max-w-5xl"
          bodyClassName="max-h-[70dvh] overflow-auto"
          footer={(
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <WaflButton type="button" variant="secondary" onClick={() => setIsEditorOpen(false)}>
                취소
              </WaflButton>
              <WaflButton type="button" variant="primary" onClick={() => void saveSpec()} disabled={isActionDisabled}>
                {state === "saving" ? "저장 중" : "저장"}
              </WaflButton>
            </div>
          )}
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--pbp-text-primary)]">단위</span>
            <WaflSelect
              value={spec.measurementUnit}
              disabled={isActionDisabled}
              onValueChange={(value) => setSpec({ ...spec, measurementUnit: value === "inch" ? "inch" : "cm" })}
              ariaLabel="치수 단위"
              options={[
                { value: "cm", label: "cm" },
                { value: "inch", label: "inch" },
              ]}
              size="sm"
              width="auto"
            />
          </div>

          <div className="min-w-[720px]">
            <WaflDataTableShell>
              <WaflDataTableHeader gridTemplateColumns={gridTemplateColumns}>
                <div className="font-semibold">측정 항목</div>
                {spec.sizes.map((size) => (
                  <div key={size.code} className="font-semibold">
                    {size.displayLabel}
                  </div>
                ))}
              </WaflDataTableHeader>
              <WaflDataTableBody>
                {spec.poms.map((pom) => (
                  <WaflDataTableRow key={pom.code} gridTemplateColumns={gridTemplateColumns}>
                    <div className="min-w-[180px] text-left">
                      <span className="block font-semibold">{pom.displayName}</span>
                      <span className="block text-xs font-normal text-[var(--pbp-text-muted)]">
                        {measurementTypeLabels[pom.measurementType] ?? pom.measurementType}
                      </span>
                      {pom.instruction ? (
                        <span className="mt-1 block text-xs font-normal text-[var(--pbp-text-muted)]">{pom.instruction}</span>
                      ) : null}
                    </div>
                    {spec.sizes.map((size) => {
                      const value = draftValues.get(getValueKey(size.code, pom.code)) ?? "";
                      const inchValue = parseInchValue(value);
                      return (
                        <div key={`${pom.code}-${size.code}`} className="min-w-0">
                          {spec.measurementUnit === "inch" ? (
                            <div className="flex min-w-[148px] gap-1">
                              <WaflNumberInput
                                className="w-16 border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2 py-1.5 text-sm disabled:opacity-60"
                                value={valueToNumber(inchValue.whole)}
                                disabled={locked || !editable}
                                inputMode="numeric"
                                onValueChange={(nextValue) => updateValue(size.code, pom.code, formatInchValue(String(Math.trunc(nextValue)), inchValue.fraction))}
                                ariaLabel={`${pom.displayName} ${size.displayLabel} 정수`}
                              />
                              <WaflSelect
                                value={inchValue.fraction}
                                disabled={locked || !editable}
                                onValueChange={(nextValue) => updateValue(size.code, pom.code, formatInchValue(inchValue.whole, nextValue))}
                                ariaLabel={`${pom.displayName} ${size.displayLabel} 분수`}
                                options={inchFractions.map((fraction) => ({ value: fraction.value, label: fraction.label }))}
                                size="sm"
                                width="auto"
                                className="w-20"
                              />
                            </div>
                          ) : (
                            <WaflNumberInput
                              className="w-24 border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2 py-1.5 text-sm disabled:opacity-60"
                              value={valueToNumber(value)}
                              disabled={locked || !editable}
                              inputMode="decimal"
                              onValueChange={(nextValue) => updateValue(size.code, pom.code, String(nextValue))}
                              ariaLabel={`${pom.displayName} ${size.displayLabel}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </WaflDataTableRow>
                ))}
              </WaflDataTableBody>
            </WaflDataTableShell>
          </div>
        </ModalShell>
      ) : null}
    </section>
  );
}
