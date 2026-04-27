import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminActionTile, AdminCard } from "@/components/admin/layout/AdminCard";
import { ADMIN_STANDARD_GROUPS, ADMIN_STANDARD_SUMMARY_CARDS, getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminUnitsPage() {
  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/units")}
      title="기준정보 관리"
      description="단위, 코드, 품목 기준을 운영 화면과 동일한 카드 구조로 정리합니다."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ADMIN_STANDARD_SUMMARY_CARDS.map((card) => (
          <AdminCard key={card.label} className="min-h-[132px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">{card.value}</p>
              </div>
              <span className={`rounded-2xl px-3 py-2 text-xs font-semibold ${card.accent}`}>{card.badge}</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-stone-500">{card.description}</p>
          </AdminCard>
        ))}
      </section>

      <AdminCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">MASTER DATA</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">기준정보 그룹</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">작지 화면에서 반복 사용하는 기준값을 그룹별로 분리해 관리합니다.</p>
          </div>
          <span className="w-fit rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-500">DB 연결 전 UI 고정 단계</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ADMIN_STANDARD_GROUPS.map((group) => (
            <AdminActionTile key={group.label} label={group.label} description={group.description} icon={group.icon} href={group.href} statusLabel={group.statusLabel} />
          ))}
        </div>
      </AdminCard>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">UNIT PREVIEW</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">단위 관리 미리보기</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">기본값</span>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200">
            <div className="grid grid-cols-[1fr_1fr_88px] bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-500">
              <span>구분</span>
              <span>사용 단위</span>
              <span className="text-right">상태</span>
            </div>
            {[
              { category: "길이", units: "yd, m, cm", status: "사용중" },
              { category: "수량", units: "개, 장, 벌, set", status: "사용중" },
              { category: "무게", units: "kg, g", status: "사용중" },
            ].map((row) => (
              <div key={row.category} className="grid grid-cols-[1fr_1fr_88px] border-t border-stone-200 px-4 py-3 text-sm text-stone-700">
                <span className="font-semibold text-stone-900">{row.category}</span>
                <span>{row.units}</span>
                <span className="text-right text-xs font-semibold text-emerald-700">{row.status}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">NEXT STRUCTURE</p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">다음 연결 기준</h2>
          </div>
          <div className="mt-5 space-y-3">
            {[
              "단위/코드/품목은 화면별 개별 state가 아니라 기준정보 selector에서 읽도록 정리",
              "추가/수정/삭제는 AdminModal 공통 스타일 적용 후 DB action으로 연결",
              "사용중/미사용 상태는 토글 실수 방지를 위해 목록에서는 텍스트로 표시",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
                {item}
              </div>
            ))}
          </div>
        </AdminCard>
      </section>
    </AdminShell>
  );
}
