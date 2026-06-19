"use client";

import { useEffect, useMemo, useState } from "react";

import { WaflButton, WaflInfoBox, WaflLinkButton, WaflSurface } from "@/components/common/ui";
import MaterialOrderCleanRoomModal from "./MaterialOrderCleanRoomModal";

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
  targetKey: string;
  targetType: "company" | "system";
  companyId: string | null;
  companyName: string | null;
  companyMemberId: string | null;
  role: "company_admin" | "member" | "system_admin";
  email: string;
  name: string;
  roleTemplateCode: string | null;
  onboardingStatus: string | null;
  profileComplete: boolean | null;
};

type DevTestContextOptions = {
  actualSession: SessionSummary;
  effectiveSession: SessionSummary;
  activeTarget: DevTestContextTarget | null;
  targets: DevTestContextTarget[];
};

function formatRole(role: string, roleTemplateCode?: string | null) {
  if (role === "system_admin" || roleTemplateCode === "system_admin") return "시스템관리자";
  if (role === "company_admin" || roleTemplateCode === "company_admin") return "고객사 관리자";
  if (roleTemplateCode === "designer") return "디자이너";
  if (roleTemplateCode === "inspector") return "검수 담당";
  if (roleTemplateCode === "inventory_manager") return "자재 담당";
  if (roleTemplateCode === "viewer") return "조회 전용";
  return role;
}



function formatOnboardingStatus(target: DevTestContextTarget) {
  if (target.targetType === "system") return "시스템관리자";
  if (!target.profileComplete) return "회사정보 미완료";
  if (target.onboardingStatus === "approval_pending") return "승인 대기";
  if (target.onboardingStatus === "rejected") return "보완 필요";
  if (target.onboardingStatus === "active") return "업무 테스트 가능";
  return target.onboardingStatus ?? "상태 미확인";
}

export default function DevTestConsoleClient() {
  const [options, setOptions] = useState<DevTestContextOptions | null>(null);
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [cleanRoomModalOpen, setCleanRoomModalOpen] = useState(false);

  const groupedTargets = useMemo(() => {
    const groups = new Map<string, DevTestContextTarget[]>();
    for (const target of options?.targets ?? []) {
      const key = target.targetType === "system" ? "system__시스템관리자" : `${target.companyId}__${target.companyName ?? "회사 미지정"}`;
      groups.set(key, [...(groups.get(key) ?? []), target]);
    }
    return Array.from(groups.entries()).map(([key, targets]) => {
      const [, companyName] = key.split("__");
      return { companyName, targets };
    });
  }, [options?.targets]);

  const selectedTarget = useMemo(
    () => options?.targets.find((target) => target.targetKey === selectedTargetKey) ?? null,
    [options?.targets, selectedTargetKey],
  );
  const companyTargetCount = groupedTargets.filter((group) => group.companyName !== "시스템관리자").length;
  const roleTargetCount = options?.targets.filter((target) => target.targetType === "company").length ?? 0;

  async function loadOptions() {
    const response = await fetch("/api/dev/test-context/options", { cache: "no-store" });
    if (!response.ok) {
      setMessage(`옵션 조회 실패: ${response.status}`);
      return;
    }

    const nextOptions = (await response.json()) as DevTestContextOptions;
    setOptions(nextOptions);
    setSelectedTargetKey(nextOptions.activeTarget?.targetKey ?? nextOptions.targets[0]?.targetKey ?? "");
  }

  useEffect(() => {
    void loadOptions();
  }, []);

  async function switchContext() {
    if (!selectedTargetKey) return;
    setIsBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/dev/test-context/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetKey: selectedTargetKey }),
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

  const isOverlayActive = Boolean(options.activeTarget) && (options.actualSession.userId !== options.effectiveSession.userId || options.actualSession.role !== options.effectiveSession.role || options.actualSession.companyId !== options.effectiveSession.companyId);

  return (
    <main className="min-h-screen bg-[var(--pbp-surface-soft)] px-6 py-8 text-[var(--pbp-text-primary)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <WaflSurface as="header" tone="warning" className="p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pbp-status-warning-fg)]">DEV ONLY</p>
          <h1 className="mt-2 text-2xl font-semibold">개발 전용 테스트 사용자 전환</h1>
          <p className="mt-2 text-sm text-[var(--pbp-status-warning-fg)]">
            실제 Google 로그인은 유지하고, 앱 내부 업무 컨텍스트만 시스템관리자 또는 테스트 fixture 사용자로 전환합니다. production에서는 사용할 수 없습니다.
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

        <section className="grid gap-4 sm:grid-cols-3">
          <WaflSurface shape="control" className="p-5 shadow-sm">
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">Seed 회사</p>
            <p className="mt-2 text-2xl font-semibold">{companyTargetCount}</p>
            <p className="mt-1 text-xs text-[var(--pbp-text-subtle)]">wafl-fn 회사 기준</p>
          </WaflSurface>
          <WaflSurface shape="control" className="p-5 shadow-sm">
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">전환 가능 역할</p>
            <p className="mt-2 text-2xl font-semibold">{roleTargetCount}</p>
            <p className="mt-1 text-xs text-[var(--pbp-text-subtle)]">승인된 company_members 기준</p>
          </WaflSurface>
          <WaflSurface shape="control" className="p-5 shadow-sm">
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">현재 상태</p>
            <p className="mt-2 text-base font-semibold">{isOverlayActive ? "역할 전환 중" : "시스템관리자 원본"}</p>
            <p className="mt-1 text-xs text-[var(--pbp-text-subtle)]">Google 로그인 세션은 유지됩니다.</p>
          </WaflSurface>
        </section>

        <WaflSurface as="section" shape="control" className="p-5 shadow-sm">
          <h2 className="text-base font-semibold">테스트 사용자 선택</h2>
          <label className="mt-4 block text-sm font-medium text-[var(--pbp-text-muted)]" htmlFor="dev-test-target">전환 대상</label>
          <select
            id="dev-test-target"
            className="mt-2 h-10 w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm text-[var(--pbp-text-primary)] outline-none focus:border-[var(--pbp-selected-border)]"
            value={selectedTargetKey}
            onChange={(event) => setSelectedTargetKey(event.target.value)}
          >
            {groupedTargets.map((group) => (
              <optgroup key={group.companyName} label={group.companyName}>
                {group.targets.map((target) => (
                  <option key={target.targetKey} value={target.targetKey}>
                    {target.name} · {formatRole(target.role, target.roleTemplateCode)} · {formatOnboardingStatus(target)} · {target.email || target.userId}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {selectedTarget ? (
            <WaflInfoBox shape="control" tone="muted" className="mt-4 p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-[var(--pbp-text-muted)]">회사</span><br /><strong>{selectedTarget.companyName ?? "시스템관리자"}</strong></p>
                <p><span className="text-[var(--pbp-text-muted)]">역할</span><br /><strong>{formatRole(selectedTarget.role, selectedTarget.roleTemplateCode)}</strong></p>
                <p><span className="text-[var(--pbp-text-muted)]">사용자</span><br />{selectedTarget.name}</p>
                <p><span className="text-[var(--pbp-text-muted)]">회사 상태</span><br /><strong>{formatOnboardingStatus(selectedTarget)}</strong></p>
                <p><span className="text-[var(--pbp-text-muted)]">대상 키</span><br /><code className="text-xs">{selectedTarget.targetKey}</code></p>
              </div>
            </WaflInfoBox>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <WaflButton onClick={switchContext} disabled={isBusy || !selectedTargetKey} variant="primary" size="sm">
              이 사용자로 보기
            </WaflButton>
            <WaflButton onClick={clearContext} disabled={isBusy} variant="secondary" size="sm">
              원래 사용자로 복구
            </WaflButton>
            <WaflLinkButton href="/workspace" variant="secondary" size="sm">
              workspace로 이동
            </WaflLinkButton>
            <WaflLinkButton href="/worker" variant="secondary" size="sm">
              worker로 이동
            </WaflLinkButton>
            <WaflLinkButton href="/workspace/material-orders" variant="secondary" size="sm">
              발주서로 이동
            </WaflLinkButton>
            <WaflLinkButton href="/system" variant="secondary" size="sm">
              시스템관리자로 이동
            </WaflLinkButton>
          </div>

          {message ? <p className="mt-4 text-sm text-[var(--pbp-text-muted)]">{message}</p> : null}
        </WaflSurface>

        <WaflSurface as="section" shape="control" className="p-5 shadow-sm">
          <h2 className="text-base font-semibold">아이패드 최소 모달 진단</h2>
          <p className="mt-2 text-sm text-[var(--pbp-text-muted)]">
            공통 모달 구조와 분리된 clean-room 모달을 개발 환경에서만 다시 확인할 때 사용합니다.
          </p>
          <div className="mt-4">
            <WaflButton
              variant="secondary"
              size="sm"
              onClick={() => setCleanRoomModalOpen(true)}
            >
              최소 모달 테스트 열기
            </WaflButton>
          </div>
        </WaflSurface>

        <MaterialOrderCleanRoomModal
          open={cleanRoomModalOpen}
          onClose={() => setCleanRoomModalOpen(false)}
        />
      </div>
    </main>
  );
}
