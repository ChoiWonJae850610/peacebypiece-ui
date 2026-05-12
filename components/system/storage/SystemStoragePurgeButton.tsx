import { AdminLinkButton } from "@/components/admin/common/AdminButton";

export default function SystemStoragePurgeButton() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
      <p className="text-sm font-semibold text-stone-900">R2 실제 삭제 후보 확인</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        고객관리자가 삭제 요청했거나 보관 기간이 지난 파일·작업지시서를 시스템관리자 화면에서 확인하고 Worker 기반 실제 삭제를 처리합니다.
      </p>
      <AdminLinkButton href="/system/storage-usage" variant="primary" className="mt-4">
        삭제 후보 목록 열기
      </AdminLinkButton>
    </div>
  );
}
