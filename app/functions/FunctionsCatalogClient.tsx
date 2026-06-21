"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ListChecks, Settings2, ShieldCheck, TestTube2, Workflow } from "lucide-react";

import {
  WaflBadge,
  WaflButton,
  WaflInput,
  WaflSurface,
} from "@/components/common/ui";
import { WAFL_TEST_DATA_CATALOG, WAFL_TEST_DATA_TOTALS } from "@/lib/functions/testDataCatalog";
import {
  WAFL_AUTOMATION_STATUS_LABELS,
  WAFL_FUNCTION_CATEGORY_LABELS,
  WAFL_SCENARIO_DECISION_LABELS,
  type WaflAutomationStatus,
  type WaflFunctionItem,
} from "@/lib/functions/catalog";

const ALL = "all";
type CatalogView = "functions" | "scenarios" | "automation" | "tools";

const VIEW_LABELS: Record<CatalogView, string> = {
  functions: "기능 명세",
  scenarios: "테스트 시나리오",
  automation: "자동화 현황",
  tools: "개발 도구",
};

function attentionTone(status: WaflAutomationStatus) {
  if (status === "decision-required") return "warning" as const;
  if (status === "partial") return "info" as const;
  if (status === "manual") return "neutral" as const;
  if (status === "planned") return "warning" as const;
  return null;
}

function attentionLabel(status: WaflAutomationStatus) {
  if (status === "decision-required") return "정책 미확정";
  if (status === "partial") return "부분 자동화";
  if (status === "manual") return "수동 확인";
  if (status === "planned") return "미자동화";
  return null;
}

function isTool(entry: WaflFunctionItem) {
  return entry.area === "테스트 환경";
}

function catalogForView(catalog: WaflFunctionItem[], view: CatalogView) {
  if (view === "tools") return catalog.filter(isTool);
  if (view === "functions") return catalog.filter((entry) => !isTool(entry));
  return catalog;
}

export default function FunctionsCatalogClient({
  appVersion,
  runtimeMode,
  isExecutionRuntimeAllowed,
  catalog,
}: {
  appVersion: string;
  runtimeMode: string;
  isExecutionRuntimeAllowed: boolean;
  catalog: WaflFunctionItem[];
}) {
  const [view, setView] = useState<CatalogView>("functions");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? "");

  const baseCatalog = useMemo(() => catalogForView(catalog, view), [catalog, view]);
  const areas = useMemo(() => Array.from(new Set(baseCatalog.map((entry) => entry.area))), [baseCatalog]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return baseCatalog.filter((entry) => {
      if (area !== ALL && entry.area !== area) return false;
      if (category !== ALL && entry.category !== category) return false;
      if (status !== ALL && entry.automationStatus !== status) return false;
      if (!keyword) return true;
      return [entry.id, entry.order, entry.area, entry.route, entry.title, entry.description, ...entry.roles]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [area, baseCatalog, category, query, status]);

  const selected = filtered.find((entry) => entry.id === selectedId) ?? filtered[0] ?? null;
  const attentionCount = catalog.filter((entry) => entry.automationStatus !== "automated").length;
  const failedCount = catalog.filter((entry) => entry.automation.lastResult === "failed" || entry.automation.lastResult === "blocked").length;
  const blockingCount = catalog.filter((entry) => entry.releaseBlocking).length;

  function changeView(nextView: CatalogView) {
    setView(nextView);
    setArea(ALL);
    setCategory(ALL);
    setStatus(ALL);
    setSelectedId("");
  }

  return (
    <main className="min-h-screen bg-[var(--pbp-bg)] px-4 py-5 text-[var(--pbp-text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <WaflSurface className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--pbp-brand-primary)]">
                <ListChecks className="h-4 w-4" /> WAFL 기능·테스트 관리
              </div>
              <h1 className="mt-2 text-2xl font-bold">Functions</h1>
              <p className="mt-2 max-w-3xl text-sm text-[var(--pbp-text-secondary)]">
                제품 기능 명세, 테스트 시나리오, 자동화 연결과 dev/test 도구를 구분해 관리합니다.
              </p>
              <p className="mt-2 text-xs text-[var(--pbp-text-muted)]">
                v{appVersion} · runtime {runtimeMode} · 활성 시스템 관리자 전용 · 조회 가능
              </p>
              <p className="mt-2 text-xs text-[var(--pbp-text-muted)]">
                {isExecutionRuntimeAllowed
                  ? "현재 세션에서는 안전한 조회·dry-run 중심의 개발/테스트 도구를 확인할 수 있습니다."
                  : "실제 Seed, Reset, Cleanup, DB/R2 변경 실행은 confirmation, fingerprint, prefix guard가 있는 별도 경로에서만 허용됩니다."}
              </p>
            </div>
            <div className="grid min-w-[260px] grid-cols-3 gap-2">
              <Summary label="확인 필요" value={attentionCount} />
              <Summary label="실패·차단" value={failedCount} />
              <Summary label="출시 차단" value={blockingCount} />
            </div>
          </div>
        </WaflSurface>

        <WaflSurface className="p-2">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ViewButton active={view === "functions"} icon={<ListChecks className="h-4 w-4" />} label={VIEW_LABELS.functions} onClick={() => changeView("functions")} />
            <ViewButton active={view === "scenarios"} icon={<TestTube2 className="h-4 w-4" />} label={VIEW_LABELS.scenarios} onClick={() => changeView("scenarios")} />
            <ViewButton active={view === "automation"} icon={<Workflow className="h-4 w-4" />} label={VIEW_LABELS.automation} onClick={() => changeView("automation")} />
            <ViewButton active={view === "tools"} icon={<Settings2 className="h-4 w-4" />} label={VIEW_LABELS.tools} onClick={() => changeView("tools")} />
          </div>
        </WaflSurface>

        {view === "tools" ? <ToolSummary /> : null}

        <WaflSurface className="p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <WaflInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="기능 ID, 경로, 역할, 제목 검색" className="xl:col-span-2" />
            <select className="w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm" value={area} onChange={(event) => setArea(event.target.value)}>
              <option value={ALL}>전체 영역</option>{areas.map((value) => <option key={value}>{value}</option>)}
            </select>
            <select className="w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value={ALL}>전체 분류</option>{Object.entries(WAFL_FUNCTION_CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <select className="w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value={ALL}>전체 상태</option>{Object.entries(WAFL_AUTOMATION_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </WaflSurface>

        {view === "automation" ? (
          <AutomationOverview entries={filtered} />
        ) : (
          <div className="grid min-h-[620px] gap-4 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.65fr)]">
            <WaflSurface className="min-h-0 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <h2 className="font-bold">{VIEW_LABELS[view]}</h2>
                  <p className="mt-0.5 text-xs text-[var(--pbp-text-muted)]">정상 항목은 배지 없이 표시합니다.</p>
                </div>
                <span className="text-sm font-semibold">{filtered.length}</span>
              </div>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {filtered.map((entry) => {
                  const tone = attentionTone(entry.automationStatus);
                  const label = attentionLabel(entry.automationStatus);
                  return (
                    <WaflButton key={entry.id} variant={selected?.id === entry.id ? "primary" : "neutral"} width="full" className="h-auto justify-start whitespace-normal px-3 py-3 text-left" onClick={() => setSelectedId(entry.id)}>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-xs">
                          <strong>{entry.order}</strong><span>{entry.id}</span>
                          {tone && label ? <WaflBadge tone={tone} size="xs">{label}</WaflBadge> : null}
                          {entry.automation.lastResult === "failed" ? <WaflBadge tone="danger" size="xs">실패</WaflBadge> : null}
                          {entry.automation.lastResult === "blocked" ? <WaflBadge tone="warning" size="xs">차단</WaflBadge> : null}
                        </span>
                        <span className="mt-1 block text-sm font-semibold">{entry.title}</span>
                        <span className="mt-1 block text-xs opacity-75">{entry.area} · {entry.route}</span>
                      </span>
                    </WaflButton>
                  );
                })}
                {filtered.length === 0 ? <div className="px-3 py-12 text-center text-sm text-[var(--pbp-text-muted)]">조건에 맞는 항목이 없습니다.</div> : null}
              </div>
            </WaflSurface>

            <WaflSurface className="min-w-0 p-5 sm:p-6">
              {selected ? <CatalogDetail selected={selected} view={view} /> : <div className="flex min-h-[400px] items-center justify-center text-sm text-[var(--pbp-text-muted)]">항목을 선택하세요.</div>}
            </WaflSurface>
          </div>
        )}
      </div>
    </main>
  );
}

function CatalogDetail({ selected, view }: { selected: WaflFunctionItem; view: CatalogView }) {
  const tone = attentionTone(selected.automationStatus);
  const label = attentionLabel(selected.automationStatus);
  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <WaflBadge tone="brand" size="sm">{selected.id}</WaflBadge>
          <span className="text-xs text-[var(--pbp-text-muted)]">{WAFL_FUNCTION_CATEGORY_LABELS[selected.category]}</span>
          {tone && label ? <WaflBadge tone={tone} size="sm">{label}</WaflBadge> : null}
          {selected.releaseBlocking ? <WaflBadge tone="danger" size="sm">출시 차단</WaflBadge> : null}
        </div>
        <h2 className="mt-3 text-xl font-bold">{selected.order}. {selected.title}</h2>
        <p className="mt-2 text-sm text-[var(--pbp-text-secondary)]">{selected.description}</p>
      </div>

      <Metadata rows={[
        ["화면·경로", selected.route],
        ["사용자 역할", selected.roles.join(", ")],
        ["자동화 방식", selected.automation.type],
        ["검증 profile", selected.automation.profile ?? "미지정"],
        ["안전 등급", selected.automation.safety],
        ["최근 결과", selected.automation.lastResult],
      ]} />

      {view === "functions" ? (
        <>
          <Detail title="선행 조건" values={selected.preconditions} />
          <Detail title="기대 UI 결과" values={selected.expectedUi} />
          <Detail title="기대 API 결과" values={selected.expectedApi} />
          <div className="grid gap-4 xl:grid-cols-2">
            <Detail title="DB 변경 허용" values={selected.dbContract.allowedChanges} empty="DB 변경 없음" />
            <Detail title="DB 불변 조건" values={selected.dbContract.unchanged} />
          </div>
        </>
      ) : (
        <>
          <ScenarioSteps steps={selected.steps} />
          <div className="grid gap-4 xl:grid-cols-2">
            <Detail title="예외·실패 조건" values={selected.exceptionCases} />
            <Detail title="권한 조건" values={selected.permissionRules} />
          </div>
          <ScenarioContracts selected={selected} />
        </>
      )}

      {selected.decisionState !== "not-required" ? (
        <WaflSurface tone="muted" shape="control" className="px-4 py-3 text-sm">
          정책 상태: <strong>{WAFL_SCENARIO_DECISION_LABELS[selected.decisionState]}</strong>
        </WaflSurface>
      ) : null}

      <WaflSurface tone="muted" shape="control" className="px-4 py-3 text-sm">
        <div className="font-semibold">자동화 연결</div>
        <div className="mt-1 text-[var(--pbp-text-secondary)]">Profile: {selected.automation.profile ?? "미지정"}</div>
        <div className="mt-1 text-[var(--pbp-text-secondary)]">명령: {selected.automation.command ?? "수동 확인"}</div>
        <div className="mt-1 text-[var(--pbp-text-secondary)]">파일: {selected.automation.filePath ?? "미연결"}</div>
        <div className="mt-1 text-[var(--pbp-text-secondary)]">데이터 세트: {selected.automation.testDataSet ?? "미연결"}</div>
        <div className="mt-1 text-[var(--pbp-text-secondary)]">안전장치: {selected.automation.executionNote}</div>
      </WaflSurface>
    </div>
  );
}

function ScenarioContracts({ selected }: { selected: WaflFunctionItem }) {
  return (
    <>
      {selected.tenantContract ? <ContractSection title="회사 격리 계약" rows={[["행위 회사", selected.tenantContract.actorCompany], ["대상 회사", selected.tenantContract.targetCompany]]} values={selected.tenantContract.assertions} /> : null}
      {selected.responsiveContract ? <ContractSection title="반응형 계약" rows={[["기기", selected.responsiveContract.viewports.join(", ")]]} values={selected.responsiveContract.assertions} /> : null}
      {selected.performanceContract ? <ContractSection title="성능 계약" rows={[["데이터 세트", selected.performanceContract.dataSet], ["측정 항목", selected.performanceContract.metrics.join(", ")]]} values={selected.performanceContract.thresholds} /> : null}
      {selected.pdfContract ? <ContractSection title="PDF 계약" rows={[["생성 조건", selected.pdfContract.generationRule]]} values={[...selected.pdfContract.currentImplementation.map((value) => `현재 구현: ${value}`), ...selected.pdfContract.assertions, ...selected.pdfContract.immutableAssertions.map((value) => `불변조건: ${value}`), ...selected.pdfContract.decisionItems.map((value) => `결정 필요: ${value}`)]} /> : null}
    </>
  );
}

function AutomationOverview({ entries }: { entries: WaflFunctionItem[] }) {
  return (
    <WaflSurface className="overflow-hidden">
      <div className="border-b border-[var(--pbp-border)] px-5 py-4">
        <h2 className="font-bold">자동화 연결 현황</h2>
        <p className="mt-1 text-sm text-[var(--pbp-text-secondary)]">정상 여부보다 미연결·부분 자동화·실패 항목을 우선 확인합니다.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--pbp-surface-muted)] text-xs text-[var(--pbp-text-secondary)]">
            <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">기능</th><th className="px-4 py-3">Profile</th><th className="px-4 py-3">안전</th><th className="px-4 py-3">명령</th><th className="px-4 py-3">최근 결과</th><th className="px-4 py-3">상태</th></tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-[var(--pbp-border)]">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{entry.id}</td>
                <td className="px-4 py-3"><div className="font-medium">{entry.title}</div><div className="mt-0.5 text-xs text-[var(--pbp-text-muted)]">{entry.route}</div></td>
                <td className="whitespace-nowrap px-4 py-3">{entry.automation.profile ?? "미지정"}</td>
                <td className="whitespace-nowrap px-4 py-3">{entry.automation.safety}</td>
                <td className="max-w-[360px] truncate px-4 py-3 text-xs">{entry.automation.command ?? entry.automation.filePath ?? "수동"}</td>
                <td className="whitespace-nowrap px-4 py-3">{entry.automation.lastResult}</td>
                <td className="whitespace-nowrap px-4 py-3">{attentionLabel(entry.automationStatus) ?? "연결됨"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WaflSurface>
  );
}

function ToolSummary() {
  return (
    <WaflSurface className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">dev/test fixture</h2>
          <p className="mt-1 text-sm text-[var(--pbp-text-secondary)]">Seed·Reset·Cleanup·환경 감사는 제품 기능과 분리해 표시합니다.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--pbp-text-muted)]">
          <ShieldCheck className="h-4 w-4" /> dry-run·confirmation guard
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
        {[
          ["회사", WAFL_TEST_DATA_TOTALS.companies], ["멤버", WAFL_TEST_DATA_TOTALS.members], ["작업지시서", WAFL_TEST_DATA_TOTALS.workorders],
          ["발주서", WAFL_TEST_DATA_TOTALS.materialOrders], ["거래처", WAFL_TEST_DATA_TOTALS.partners], ["파일", WAFL_TEST_DATA_TOTALS.files], ["알림", WAFL_TEST_DATA_TOTALS.notifications],
        ].map(([label, value]) => <Summary key={String(label)} label={String(label)} value={Number(value)} />)}
      </div>
      <p className="mt-3 text-xs text-[var(--pbp-text-muted)]">fixture v{WAFL_TEST_DATA_CATALOG.schemaVersion} · 역할 {WAFL_TEST_DATA_CATALOG.roles.length}종</p>
    </WaflSurface>
  );
}

function ViewButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <WaflButton variant={active ? "primary" : "neutral"} width="full" onClick={onClick}>{icon}{label}</WaflButton>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <WaflSurface tone="muted" shape="control" className="px-3 py-2"><div className="text-xs text-[var(--pbp-text-secondary)]">{label}</div><div className="mt-1 text-lg font-bold">{value}</div></WaflSurface>;
}

function Metadata({ rows }: { rows: Array<[string, string]> }) {
  return <WaflSurface tone="muted" shape="control" className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-2">{rows.map(([label, value]) => <div key={label}><div className="text-xs text-[var(--pbp-text-muted)]">{label}</div><div className="mt-1 font-medium">{value}</div></div>)}</WaflSurface>;
}

function ScenarioSteps({ steps }: { steps: WaflFunctionItem["steps"] }) {
  return <section><h3 className="text-sm font-bold">실행 절차와 기대 결과</h3><div className="mt-2 space-y-2">{steps.map((step, index) => <WaflSurface key={`${step.id}-${index}`} tone="muted" shape="control" className="px-4 py-3"><div className="text-sm font-semibold">{index + 1}. {step.action}</div><ul className="mt-2 space-y-1 text-sm text-[var(--pbp-text-secondary)]">{step.expected.length ? step.expected.map((value) => <li key={value}>• {value}</li>) : <li>• 별도 기대 결과 없음</li>}</ul></WaflSurface>)}</div></section>;
}

function ContractSection({ title, rows, values }: { title: string; rows: Array<[string, string]>; values: string[] }) {
  return <section><h3 className="text-sm font-bold">{title}</h3><WaflSurface tone="muted" shape="control" className="mt-2 px-4 py-3 text-sm"><dl className="space-y-2">{rows.map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-0.5 text-[var(--pbp-text-secondary)]">{value}</dd></div>)}</dl><ul className="mt-3 space-y-1.5 text-[var(--pbp-text-secondary)]">{values.length ? values.map((value) => <li key={value}>• {value}</li>) : <li>등록된 검증 항목 없음</li>}</ul></WaflSurface></section>;
}

function Detail({ title, values, empty = "등록된 항목 없음" }: { title: string; values: string[]; empty?: string }) {
  return <section><h3 className="text-sm font-bold">{title}</h3><WaflSurface tone="muted" shape="control" className="mt-2 px-4 py-3"><ul className="space-y-1.5 text-sm text-[var(--pbp-text-secondary)]">{values.length ? values.map((value) => <li key={value}>• {value}</li>) : <li>{empty}</li>}</ul></WaflSurface></section>;
}
