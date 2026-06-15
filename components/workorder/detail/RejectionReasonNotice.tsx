import { WAFL_WORKSPACE_SECTION_CARD_CLASS } from "@/components/common/ui";

type RejectionReasonNoticeProps = {
  title: string;
  emptyReasonText: string;
  reason?: string | null;
};

export default function RejectionReasonNotice({ title, emptyReasonText, reason }: RejectionReasonNoticeProps) {
  const normalizedReason = reason?.trim();

  return (
    <div className={`${WAFL_WORKSPACE_SECTION_CARD_CLASS} border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950`}>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">{title}</div>
      <p className="mt-1 whitespace-pre-wrap leading-5">{normalizedReason || emptyReasonText}</p>
    </div>
  );
}
