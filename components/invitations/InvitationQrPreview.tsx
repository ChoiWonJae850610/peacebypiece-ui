import type { InvitationQrPreviewModel } from "@/lib/invitations/invitationQrPreview";

interface InvitationQrPreviewProps {
  model: InvitationQrPreviewModel;
  inviteUrl?: string | null;
}

const QR_SIZE = 9;

function isFilledCell(model: InvitationQrPreviewModel, x: number, y: number) {
  return model.cells.some((cell) => cell.x === x && cell.y === y);
}

export default function InvitationQrPreview({
  model,
  inviteUrl,
}: InvitationQrPreviewProps) {
  const displayUrl = inviteUrl || model.inviteUrl;

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">{model.title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{model.description}</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="grid h-44 w-44 grid-cols-9 grid-rows-9 gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-3">
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
        <div className="min-w-0">
          <p className="text-xs font-medium text-stone-500">초대 링크</p>
          <p className="mt-1 truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
            {displayUrl}
          </p>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            QR 이미지는 실제 라이브러리 연결 전까지 링크 표시 영역으로만 사용합니다.
          </p>
        </div>
      </div>
    </article>
  );
}
