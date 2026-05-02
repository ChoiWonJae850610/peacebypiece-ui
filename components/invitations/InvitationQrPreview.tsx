import type { InvitationQrPreviewModel } from "@/lib/invitations/invitationQrPreview";

interface InvitationQrPreviewProps {
  model: InvitationQrPreviewModel;
}

const QR_SIZE = 9;

function isFilledCell(
  model: InvitationQrPreviewModel,
  x: number,
  y: number,
): boolean {
  return model.cells.some((cell) => cell.x === x && cell.y === y);
}

export default function InvitationQrPreview({ model }: InvitationQrPreviewProps) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
        <h2 className="text-lg font-semibold text-stone-950">{model.title}</h2>
        <p className="text-sm leading-6 text-stone-600">{model.description}</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <div
          aria-label={model.title}
          className="grid h-44 w-44 grid-cols-9 grid-rows-9 gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-3"
        >
          {Array.from({ length: QR_SIZE * QR_SIZE }).map((_, index) => {
            const x = index % QR_SIZE;
            const y = Math.floor(index / QR_SIZE);
            const filled = isFilledCell(model, x, y);

            return (
              <span
                key={`${x}-${y}`}
                className={
                  filled
                    ? "rounded-[3px] bg-stone-900"
                    : "rounded-[3px] bg-white"
                }
              />
            );
          })}
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-xs font-medium text-stone-500">미리보기 링크</p>
            <p className="mt-1 truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
              {model.inviteUrl}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400"
            >
              QR 새로고침 준비중
            </button>
            <button
              type="button"
              disabled
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-400"
            >
              링크 복사 준비중
            </button>
          </div>

          <p className="text-xs leading-5 text-stone-500">
            외부 QR 라이브러리를 추가하지 않고, 실제 inviteUrl 연결 전까지 UI 자리와 정책만 고정합니다.
          </p>
        </div>
      </div>
    </article>
  );
}
