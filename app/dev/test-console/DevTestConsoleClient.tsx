"use client";

import { useEffect, useMemo, useState } from "react";

import { WaflButton, WaflInfoBox, WaflLinkButton, WaflSurface } from "@/components/common/ui";

type SessionSummary = {
  userId: string;
  email: string;
  name: string;
  role: "company_admin" | "member" | "system_admin";
  companyId: string | null;
  companyMemberId: string | null;
  companyName: string | null;
};

type DevTestContextTarget = {
  userId: string;
  companyId: string;
  companyName: string;
  companyMemberId: string;
  role: "company_admin" | "member" | "system_admin";
  email: string;
  name: string;
  roleTemplateCode: string | null;
};

type DevTestContextOptions = {
  actualSession: SessionSummary;
  effectiveSession: SessionSummary;
  activeTarget: DevTestContextTarget | null;
  targets: DevTestContextTarget[];
};

function formatRole(role: string, roleTemplateCode?: string | null) {
  if (role === "company_admin" || roleTemplateCode === "company_admin") return "고객사 관리자";
  if (roleTemplateCode === "designer") return "디자이너";
  if (roleTemplateCode === "inspector") return "검수 담당";
  if (roleTemplateCode === "inventory_manager") return "자재 담당";
  if (roleTemplateCode === "viewer") return "조회 전용";
  return role;
}

export default function DevTestConsoleClient() {
  const [options, setOptions] = useState<DevTestContextOptions | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const groupedTargets = useMemo(() => {
    const groups = new Map<string, DevTestContextTarget[]>();
    for (const target of options?.targets ?? []) {
      const key = `${target.companyId}__${target.companyName}`;
      groups.set(key, [...(groups.get(key) ?? []), target]);
    }
    return Array.from(groups.entries()).map(([key, targets]) => {
      const [, companyName] = key.split("__");
      return { companyName, targets };
    });
  }, [options?.targets]);

  async function loadOptions() {
    const response = await fetch("/api/dev/test-context/options", { cache: "no-store" });
    if (!response.ok) {
      setMessage(`옵션 조회 실패: ${response.status}`);
      return;
    }

    const nextOptions = (await response.json()) as DevTestContextOptions;
    setOptions(nextOptions);
    setSelectedMemberId(nextOptions.activeTarget?.companyMemberId ?? nextOptions.targets[0]?.companyMemberId ?? "");
  }

  useEffect(() => {
    void loadOptions();
  }, []);

  async function switchContext() {
    if (!selectedMemberId) return;
    setIsBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/dev/test-context/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyMemberId: selectedMemberId }),
      });
      if (!response.ok) {
        setMessage(`전환 실패: ${response.status}`);
        return;
      }
      setMessage("테스트 사용자 컨텍스트를 적용했습니다.");
      await loadOptions();
    } finally {
      setIsBusy(false);
    }
  }

  async function clearContext() {
    setIsBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/dev/test-context/clear", { method: "POST" });
      if (!response.ok) {
        setMessage(`복구 실패: ${response.status}`);
        return;
      }
      setMessage("원래 사용자 컨텍스트로 복구했습니다.");
      await loadOptions();
    } finally {
      setIsBusy(false);
    }
  }

  if (!options) {
    return <WaflInfoBox shape="control" tone="muted" className="p-6 text-sm">테스트 콘솔 정보를 불러오는 중입니다.</WaflInfoBox>;
  }

  const isOverlayActive = options.actualSession.userId !== options.effectiveSession.userId;

  return (
    <main className="min-h-screen bg-[var(--pbp-surface-soft)] px-6 py-8 text-[var(--pbp-text-primary)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <WaflSurface as="header" tone="warning" className="p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pbp-status-warning-fg)]">DEV ONLY</p>
          <h1 className="mt-2 text-2xl font-semibold">개발 전용 테스트 사용자 전환</h1>
          <p className="mt-2 text-sm text-[var(--pbp-status-warning-fg)]">
            실제 Google 로그인은 유지하고, 앱 내부 업무 컨텍스트만 테스트 fixture 사용자로 전환합니다. production에서는 사용할 수 없습니다.
          </p>
        </WaflSurface>

        <section className="grid gap-4 md:grid-cols-2">
          <WaflSurface shape="control" className="p-5 shadow-sm">
            <h2 className="text-base font-semibold">실제 로그인 사용자</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-[var(--pbp-text-muted)]">이름</dt><dd className="font-medium">{options.actualSession.name}</dd></div>
              <div><dt className="text-[var(--pbp-text-muted)]">이메일</dt><dd>{options.actualSession.email}</dd></div>
              <div><dt className="text-[var(--pbp-text-muted)]">역할</dt><dd>{formatRole(options.actualSession.role)}</dd></div>
            </dl>
          </WaflSurface>

          <WaflSurface shape="control" className="p-5 shadow-sm">
            <h2 className="text-base font-semibold">현재 업무 컨텍스트</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-[var(--pbp-text-muted)]">상태</dt><dd className="font-medium">{isOverlayActive ? "테스트 사용자 적용 중" : "원래 사용자"}</dd></div>
              <div><dt className="text-[var(--pbp-text-muted)]">회사</dt><dd>{options.effectiveSession.companyName ?? "-"}</dd></div>
              <div><dt className="text-[var(--pbp-text-muted)]">사용자</dt><dd>{options.effectiveSession.name}</dd></div>
              <div><dt className="text-[var(--pbp-text-muted)]">역할</dt><dd>{formatRole(options.effectiveSession.role, options.activeTarget?.roleTemplateCode)}</dd></div>
            </dl>
          </WaflSurface>
        </section>

        <WaflSurface as="section" shape="control" className="p-5 shadow-sm">
          <h2 className="text-base font-semibold">테스트 사용자 선택</h2>
          <label className="mt-4 block text-sm font-medium text-[var(--pbp-text-muted)]" htmlFor="dev-test-target">전환 대상</label>
          <select
            id="dev-test-target"
            className="mt-2 h-10 w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm text-[var(--pbp-text-primary)] outline-none focus:border-[var(--pbp-selected-border)]"
            value={selectedMemberId}
            onChange={(event) => setSelectedMemberId(event.target.value)}
          >
            {groupedTargets.map((group) => (
              <optgroup key={group.companyName} label={group.companyName}>
                {group.targets.map((target) => (
                  <option key={target.companyMemberId} value={target.companyMemberId}>
                    {target.name} · {formatRole(target.role, target.roleTemplateCode)} · {target.email || target.userId}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="mt-5 flex flex-wrap gap-3">
            <WaflButton onClick={switchContext} disabled={isBusy || !selectedMemberId} variant="primary" size="sm">
              이 사용자로 보기
            </WaflButton>
            <WaflButton onClick={clearContext} disabled={isBusy} variant="secondary" size="sm">
              원래 사용자로 복구
            </WaflButton>
            <WaflLinkButton href="/workspace" variant="secondary" size="sm">
              workspace로 이동
            </WaflLinkButton>
          </div>

          {message ? <p className="mt-4 text-sm text-[var(--pbp-text-muted)]">{message}</p> : null}
        </WaflSurface>
      </div>
    </main>
  );
}
