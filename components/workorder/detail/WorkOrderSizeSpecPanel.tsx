"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  missingItems?: string[];
  error?: string;
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

export default function WorkOrderSizeSpecPanel({
  workOrderId,
  locked = false,
}: {
  workOrderId: string;
  locked?: boolean;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error" | "saving">("loading");
  const [error, setError] = useState<string | null>(null);
  const [spec, setSpec] = useState<SizeSpec | null>(null);
  const [editable, setEditable] = useState(false);
  const [draftValues, setDraftValues] = useState<Map<string, string>>(() => new Map());
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [pdfLink, setPdfLink] = useState<{ href: string; label: string } | null>(null);

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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "치수표를 저장하지 못했습니다.");
      setState("ready");
    }
  };

  const generatePdf = async (kind: "incomplete" | "final") => {
    setPdfStatus(kind === "final" ? "최종 PDF를 생성하는 중입니다." : "미완성 PDF를 생성하는 중입니다.");
    setPdfLink(null);
    try {
      const response = await fetch(`/api/workorders/${encodeURIComponent(workOrderId)}/generated/workorder-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const result = (await response.json().catch(() => null)) as GeneratedPdfResult | null;
      if (!response.ok || !result?.ok || !result.attachment) {
        const missing = Array.isArray(result?.missingItems) && result.missingItems.length > 0
          ? ` 누락: ${result.missingItems.join(", ")}`
          : "";
        throw new Error(`${result?.error ?? "WORKORDER_PDF_CREATE_FAILED"}${missing}`);
      }
      setPdfStatus(kind === "final" ? "최종 PDF가 생성되었습니다." : "미완성 PDF가 생성되었습니다.");
      setPdfLink({
        href: `/api/workorders/${encodeURIComponent(workOrderId)}/generated/workorder-pdf/${encodeURIComponent(result.attachment.id)}/view`,
        label: result.attachment.name,
      });
    } catch (pdfError) {
      setPdfStatus(pdfError instanceof Error ? pdfError.message : "PDF 생성에 실패했습니다.");
    }
  };

  const isActionDisabled = locked || !editable || state === "saving" || !spec;

  return (
    <section className="rounded-lg border border-[var(--pbp-divider)] bg-[var(--pbp-surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pbp-muted)]">Size spec</p>
          <h3 className="text-base font-semibold text-[var(--pbp-text)]">작업지시서 치수표</h3>
          <p className="mt-1 text-sm text-[var(--pbp-muted)]">
            활성 size set과 POM 기준으로 작업지시서별 완성 치수를 저장합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-[var(--pbp-divider)] bg-[var(--pbp-surface)] px-3 py-2 text-sm"
            value={spec?.measurementUnit ?? "cm"}
            disabled={isActionDisabled}
            onChange={(event) => spec ? setSpec({ ...spec, measurementUnit: event.target.value === "inch" ? "inch" : "cm" }) : undefined}
            aria-label="치수 단위"
          >
            <option value="cm">cm</option>
            <option value="inch">inch</option>
          </select>
          <button
            type="button"
            className="rounded-md bg-[var(--pbp-primary)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isActionDisabled}
            onClick={() => void saveSpec()}
          >
            {state === "saving" ? "저장 중" : "치수표 저장"}
          </button>
        </div>
      </div>

      {state === "loading" ? (
        <p className="mt-4 text-sm text-[var(--pbp-muted)]">치수표를 불러오는 중입니다.</p>
      ) : null}

      {state === "error" ? (
        <div className="mt-4 rounded-md border border-[var(--pbp-danger-border)] bg-[var(--pbp-danger-bg)] p-3 text-sm text-[var(--pbp-danger-text)]">
          <p>{error}</p>
          <button type="button" className="mt-2 text-sm font-semibold underline" onClick={() => void loadSpec()}>
            다시 시도
          </button>
        </div>
      ) : null}

      {spec && state !== "loading" && state !== "error" ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b border-[var(--pbp-divider)] bg-[var(--pbp-surface)] px-3 py-2 text-left font-semibold">
                  POM
                </th>
                {spec.sizes.map((size) => (
                  <th key={size.code} className="border-b border-[var(--pbp-divider)] px-3 py-2 text-left font-semibold">
                    {size.displayLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spec.poms.map((pom) => (
                <tr key={pom.code}>
                  <th className="sticky left-0 z-10 border-b border-[var(--pbp-divider)] bg-[var(--pbp-surface)] px-3 py-2 text-left align-top">
                    <span className="block font-semibold">{pom.displayName}</span>
                    <span className="block text-xs font-normal text-[var(--pbp-muted)]">{pom.measurementType}</span>
                    {pom.instruction ? <span className="mt-1 block text-xs font-normal text-[var(--pbp-muted)]">{pom.instruction}</span> : null}
                  </th>
                  {spec.sizes.map((size) => (
                    <td key={`${pom.code}-${size.code}`} className="border-b border-[var(--pbp-divider)] px-2 py-2">
                      <input
                        className="w-24 rounded-md border border-[var(--pbp-divider)] bg-[var(--pbp-surface)] px-2 py-1.5 text-sm disabled:opacity-60"
                        value={draftValues.get(getValueKey(size.code, pom.code)) ?? ""}
                        disabled={locked || !editable}
                        inputMode="decimal"
                        placeholder={spec.measurementUnit === "inch" ? "10 1/8" : "54.5"}
                        onChange={(event) => updateValue(size.code, pom.code, event.target.value)}
                        aria-label={`${pom.displayName} ${size.displayLabel}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {spec.sizes.length === 0 || spec.poms.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--pbp-muted)]">
              활성화된 size set 또는 POM 기준을 찾을 수 없습니다. 회사 카탈로그 설정을 확인해 주세요.
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-[var(--pbp-danger-text)]">{error}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--pbp-divider)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[var(--pbp-text)]">작업지시서 PDF</h4>
          <p className="text-sm text-[var(--pbp-muted)]">
            supplier order-request PDF와 별개로 미완성/최종 작업지시서 PDF를 생성합니다.
          </p>
          {pdfStatus ? <p className="mt-2 text-sm text-[var(--pbp-muted)]">{pdfStatus}</p> : null}
          {pdfLink ? (
            <a className="mt-2 inline-block text-sm font-semibold underline" href={pdfLink.href} target="_blank" rel="noreferrer">
              {pdfLink.label}
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-[var(--pbp-divider)] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={locked}
            onClick={() => void generatePdf("incomplete")}
          >
            미완성 PDF
          </button>
          <button
            type="button"
            className="rounded-md border border-[var(--pbp-divider)] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={locked}
            onClick={() => void generatePdf("final")}
          >
            최종 PDF
          </button>
        </div>
      </div>
    </section>
  );
}
