import Link from "next/link";

export default function SystemStoragePurgeButton() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4">
      <p className="text-sm font-semibold text-stone-900">R2 실제 삭제 후보 확인</p>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        고객사 휴지통에서 30일이 지난 파일을 시스템관리자 화면에서 확인합니다. 실제 삭제 실행은 후보 목록 확인 후 다음 단계에서 연결합니다.
      </p>
      <Link
        href="/system/storage-usage"
        className="mt-4 inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
      >
        삭제 후보 목록 열기
      </Link>
    </div>
  );
}
