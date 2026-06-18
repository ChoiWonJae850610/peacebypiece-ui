"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, TestTube2 } from "lucide-react";

import {
  WaflBadge,
  WaflButton,
  WaflInput,
  WaflSurface,
} from "@/components/common/ui";
import {
  WAFL_AUTOMATION_STATUS_LABELS,
  WAFL_FUNCTION_CATEGORY_LABELS,
  type WaflAutomationStatus,
  type WaflFunctionCategory,
  type WaflFunctionItem,
} from "@/lib/functions/catalog";

const ALL = "all";

function statusTone(status: WaflAutomationStatus) {
  if (status === "automated") return "success" as const;
  if (status === "partial") return "info" as const;
  if (status === "decision-required") return "warning" as const;
  if (status === "manual") return "neutral" as const;
  return "brand" as const;
}

export default function FunctionsCatalogClient({
  appVersion,
  runtimeMode,
  catalog,
}: {
  appVersion: string;
  runtimeMode: string;
  catalog: WaflFunctionItem[];
}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? "");

  const areas = useMemo(() => Array.from(new Set(catalog.map((entry) => entry.area))), [catalog]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return catalog.filter((entry) => {
      if (area !== ALL && entry.area !== area) return false;
      if (category !== ALL && entry.category !== category) return false;
      if (status !== ALL && entry.automationStatus !== status) return false;
      if (!keyword) return true;
      return [entry.id, entry.order, entry.area, entry.route, entry.title, entry.description]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [area, catalog, category, query, status]);

  const selected = filtered.find((entry) => entry.id === selectedId) ?? filtered[0] ?? null;
  const automatedCount = catalog.filter((entry) => entry.automationStatus === "automated").length;
  const decisionCount = catalog.filter((entry) => entry.automationStatus === "decision-required").length;
  const blockingCount = catalog.filter((entry) => entry.releaseBlocking).length;

  return (
    <main className="min-h-screen bg-[var(--pbp-bg)] px-4 py-5 text-[var(--pbp-text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <WaflSurface className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--pbp-brand-primary)]">
                <TestTube2 className="h-4 w-4" /> WAFL 내부 기능 카탈로그
              </div>
              <h1 className="mt-2 text-2xl font-bold">/functions</h1>
              <p className="mt-2 max-w-3xl text-sm text-[var(--pbp-text-secondary)]">
                화면별 기능, 정상·예외·권한·DB·회사 격리·반응형·성능·PDF 시나리오와 자동화 상태를 관리합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <WaflBadge tone="brand" size="sm">v{appVersion}</WaflBadge>
              <WaflBadge tone="info" size="sm">runtime: {runtimeMode}</WaflBadge>
              <WaflBadge tone="success" size="sm"><ShieldCheck className="h-3 w-3" /> production 차단</WaflBadge>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["전체 기능", catalog.length], ["자동화 완료", automatedCount], ["정책 결정 필요", decisionCount], ["출시 차단", blockingCount],
            ].map(([label, value]) => (
              <WaflSurface key={String(label)} tone="muted" shape="control" className="px-4 py-3">
                <div className="text-xs text-[var(--pbp-text-secondary)]">{label}</div>
                <div className="mt-1 text-xl font-bold">{value}</div>
              </WaflSurface>
            ))}
          </div>
        </WaflSurface>

        <WaflSurface className="p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <WaflInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="기능 ID, 화면, 제목 검색" className="xl:col-span-2" />
            <select className="w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm" value={area} onChange={(event) => setArea(event.target.value)}>
              <option value={ALL}>전체 영역</option>{areas.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select className="w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value={ALL}>전체 분류</option>{Object.entries(WAFL_FUNCTION_CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select className="w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={ALL}>전체 자동화 상태</option>{Object.entries(WAFL_AUTOMATION_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </WaflSurface>

        <div className="grid min-h-[620px] gap-4 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.6fr)]">
          <WaflSurface className="min-h-0 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-bold">기능 목록</h2><WaflBadge tone="strong" size="sm">{filtered.length}</WaflBadge>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
              {filtered.map((entry) => (
                <WaflButton key={entry.id} variant={selected?.id === entry.id ? "primary" : "neutral"} width="full" className="h-auto justify-start whitespace-normal px-3 py-3 text-left" onClick={() => setSelectedId(entry.id)}>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-xs"><strong>{entry.order}</strong><span>{entry.id}</span><WaflBadge tone={statusTone(entry.automationStatus)} size="xs">{WAFL_AUTOMATION_STATUS_LABELS[entry.automationStatus]}</WaflBadge></span>
                    <span className="mt-1 block text-sm font-semibold">{entry.title}</span>
                    <span className="mt-1 block text-xs opacity-75">{entry.area} · {entry.route}</span>
                  </span>
                </WaflButton>
              ))}
              {filtered.length === 0 ? <div className="px-3 py-12 text-center text-sm text-[var(--pbp-text-muted)]">조건에 맞는 기능이 없습니다.</div> : null}
            </div>
          </WaflSurface>

          <WaflSurface className="min-w-0 p-5 sm:p-6">
            {selected ? (
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><WaflBadge tone="brand" size="sm">{selected.id}</WaflBadge><WaflBadge tone="info" size="sm">{WAFL_FUNCTION_CATEGORY_LABELS[selected.category]}</WaflBadge>{selected.releaseBlocking ? <WaflBadge tone="danger" size="sm">출시 차단</WaflBadge> : null}</div>
                  <h2 className="mt-3 text-xl font-bold">{selected.order}. {selected.title}</h2>
                  <p className="mt-2 text-sm text-[var(--pbp-text-secondary)]">{selected.description}</p>
                  <div className="mt-3 text-xs text-[var(--pbp-text-muted)]">경로 {selected.route} · 역할 {selected.roles.join(", ")}</div>
                </div>
                <Detail title="전제 조건" values={selected.preconditions} />
                <Detail title="예상 UI 결과" values={selected.expectedUi} />
                <Detail title="예상 API 결과" values={selected.expectedApi} />
                <div className="grid gap-4 xl:grid-cols-2"><Detail title="변경되어야 하는 DB" values={selected.expectedDbChanges} empty="DB 변경 없음" /><Detail title="변경되면 안 되는 DB" values={selected.expectedDbUnchanged} /></div>
                <WaflSurface tone="muted" shape="control" className="px-4 py-3 text-sm">
                  자동화 상태: <strong>{WAFL_AUTOMATION_STATUS_LABELS[selected.automationStatus]}</strong>. 0.23.62에서는 실행 기능 없이 명세와 연결 상태만 제공합니다.
                </WaflSurface>
              </div>
            ) : <div className="flex min-h-[400px] items-center justify-center text-sm text-[var(--pbp-text-muted)]">기능을 선택하세요.</div>}
          </WaflSurface>
        </div>
      </div>
    </main>
  );
}

function Detail({ title, values, empty = "등록된 항목 없음" }: { title: string; values: string[]; empty?: string }) {
  return <section><h3 className="text-sm font-bold">{title}</h3><WaflSurface tone="muted" shape="control" className="mt-2 px-4 py-3"><ul className="space-y-1.5 text-sm text-[var(--pbp-text-secondary)]">{values.length ? values.map((value) => <li key={value}>• {value}</li>) : <li>{empty}</li>}</ul></WaflSurface></section>;
}
