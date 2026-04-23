"use client";

import { useState } from "react";
import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";
import { useI18n } from "@/lib/i18n";

function MobileSidePanelAccordionSection({
  title,
  count,
  defaultOpen = false,
  children,
  collapseLabel,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  collapseLabel: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-[22px] border border-stone-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-900">{title}</div>
          {typeof count === "number" ? <div className="mt-0.5 text-[11px] text-stone-500">{count}</div> : null}
        </div>
        <span className="text-sm text-stone-500">{open ? collapseLabel : "+"}</span>
      </button>
      {open ? <div className="border-t border-stone-200 p-2.5">{children}</div> : null}
    </section>
  );
}

export default function WorkOrderSidePanelMobileView(props: WorkOrderSidePanelProps) {
  const { i18n } = useI18n();
  const memoTitle = i18n.workorder.ui.memo.panelTitle;
  const collapseLabel = i18n.common.ui.common.collapse;
  const attachmentCount = props.attachmentSections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50/60 p-2.5">
      <SidePanelSectionStack compact>
        <MobileSidePanelAccordionSection title={memoTitle} defaultOpen collapseLabel={collapseLabel}>
          <WorkOrderMemoPanel
            workOrder={props.workOrder}
            currentUserName={props.currentUserName}
            currentUserRole={props.currentRole}
            onCreateThread={props.onCreateMemoThread}
            onCreateReply={props.onCreateMemoReply}
            canPromoteMemoAttachment={props.canPromoteMemoAttachment}
            onPromoteMemoAttachment={props.onPromoteMemoAttachment}
            onPreviewAttachment={props.onPreviewAttachment}
            variant="mobile"
          />
        </MobileSidePanelAccordionSection>

        {props.attachmentSections.map((section, index) => (
          <MobileSidePanelAccordionSection
            key={section.key}
            title={section.title}
            count={section.items.length}
            defaultOpen={attachmentCount <= 2 && index === 0}
            collapseLabel={collapseLabel}
          >
            <WorkOrderAttachmentPanel
              title={section.title}
              emptyText={section.emptyText}
              addButtonLabel={section.addButtonLabel}
              canSeeAttachments={props.canSeeAttachments}
              canManageAttachments={props.canManageAttachments}
              attachments={section.items}
              onOpenAttachmentPicker={() => props.onOpenAttachmentPicker(section.uploadScope)}
              onPreviewAttachment={props.onPreviewAttachment}
              onDeleteAttachment={props.onDeleteAttachment}
              variant="mobile"
            />
          </MobileSidePanelAccordionSection>
        ))}
      </SidePanelSectionStack>
    </div>
  );
}
