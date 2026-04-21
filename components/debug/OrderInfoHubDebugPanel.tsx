import { useI18n } from "@/lib/i18n";
import type { OrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";

type Props = {
  policy: OrderInfoHubPolicy;
};

export default function OrderInfoHubDebugPanel({ policy }: Props) {
  const { i18n } = useI18n();
  const hubCopy = i18n.workorder.ui.sections.orderInfo.hub;

  return (
    <div className="mb-3 rounded-2xl border border-stone-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-stone-900">{hubCopy.title}</span>
        <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
          {policy.isInitialWorkOrder ? hubCopy.initialBadge : hubCopy.reorderBadge}
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-xl bg-stone-50 px-3 py-2">
          <div className="text-[11px] font-semibold text-stone-500">{hubCopy.stateLabel}</div>
          <div className="mt-1 text-sm font-medium text-stone-800">
            {policy.stateScope === "draft"
              ? hubCopy.unlockedDraft
              : policy.stateScope === "review_requested_admin"
                ? hubCopy.unlockedReviewAdmin
                : policy.lockedReasonKey === "reviewRequested"
                  ? hubCopy.lockedReviewRequested
                  : hubCopy.lockedOrderedOrLater}
          </div>
        </div>
        <div className="rounded-xl bg-stone-50 px-3 py-2">
          <div className="text-[11px] font-semibold text-stone-500">{hubCopy.kindPolicyLabel}</div>
          <div className="mt-1 text-sm font-medium text-stone-800">
            {policy.isInitialWorkOrder ? hubCopy.kindInitial : hubCopy.kindReorder}
          </div>
        </div>
        <div className="rounded-xl bg-stone-50 px-3 py-2">
          <div className="text-[11px] font-semibold text-stone-500">{hubCopy.scopeLabel}</div>
          <div className="mt-1 text-sm font-medium text-stone-800">
            {policy.canEditOrderEntries ? hubCopy.scopeEditable : hubCopy.scopeLocked}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
        <span className="font-semibold text-stone-500">{hubCopy.impactLabel}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1">{hubCopy.impactTitle}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1">{hubCopy.impactLogs}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1">{hubCopy.impactEntries}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1">{hubCopy.impactAlerts}</span>
      </div>
    </div>
  );
}
