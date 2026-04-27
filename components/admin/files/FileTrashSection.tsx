import type { AdminTrashFileItem } from "@/lib/admin/adminFiles.presentation";

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
};

export default function FileTrashSection({ items }: FileTrashSectionProps) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">휴지통</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">삭제 요청된 첨부파일은 실제 삭제 전까지 복구 가능한 상태로 보관합니다.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-400" disabled>
            복구 예정
          </button>
          <button type="button" className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-400" disabled>
            영구 삭제 예정
          </button>
        </div>
      </div>

      <div className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200">
        {items.map((item) => (
          <article key={item.id} className="grid gap-3 p-4 md:grid-cols-[1.3fr_1.3fr_0.8fr_0.8fr_0.8fr] md:items-center">
            <div>
              <p className="text-xs text-stone-400">작지명</p>
              <p className="mt-1 text-sm font-medium text-stone-900">{item.workorderTitle}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-400">파일명</p>
              <p className="mt-1 truncate text-sm text-stone-700">{item.fileName}</p>
              <p className="mt-1 text-xs text-stone-400">{item.deleteReason}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">삭제자</p>
              <p className="mt-1 text-sm text-stone-700">{item.deletedBy}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">삭제일</p>
              <p className="mt-1 text-sm text-stone-700">{item.deletedAt}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">실제 삭제 예정</p>
              <p className="mt-1 text-sm text-stone-700">{item.purgeAfterAt}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
