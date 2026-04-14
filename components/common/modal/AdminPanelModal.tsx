"use client";

import { useRef, useState } from "react";
import StatusToggle from "@/components/common/StatusToggle";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { HISTORY_FILTER_BUTTON_CLASS, HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { useI18n } from "@/lib/i18n";
import { HISTORY_FILTER_OPTIONS, NOTIFICATION_SETTING_META } from "@/lib/constants/workflow";
import { MODAL_EXCEPTION_PRESETS } from "@/components/common/modal/modalPresets";
import type { NotificationSettingKey, NotificationSettings, HistoryFilter } from "@/types/workflow";
import type { HistoryLog } from "@/types/workorder";



function HistoryPreviewItem({ item }: { item: HistoryLog }) {
  const { i18n } = useI18n();
  const ui = i18n.common.ui;
  const common = ui.common;
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${HISTORY_TONE_CLASS[item.tone]}`}>{item.action}</div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>{item.time}</span>
            {hasDetails ? <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">{open ? common.collapse : common.detail}</span> : null}
          </div>
        </div>
        <div className="mt-2 text-sm text-stone-700 break-words">{item.summary}</div>
      </button>

      {hasDetails && open ? (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
          {item.transition ? (
            <div className="rounded-lg bg-stone-50 px-3 py-2 font-medium text-stone-800">
              {item.transition.from} <span className="px-1 text-stone-400">→</span> {item.transition.to}
            </div>
          ) : null}
          {item.detailLines?.map((detail, index) => (
            <div key={`${item.id}-detail-${index}`} className="flex items-start gap-2 leading-5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
              <span>
                {detail.label ? <span className="font-medium text-stone-900">{detail.label}: </span> : null}
                <span className="break-words">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
  historyLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
};

export default function AdminPanelModal({
  open,
  onClose,
  notificationSettings,
  onToggleNotificationSetting,
  historyLogs,
  historyFilter,
  onHistoryFilterChange,
}: AdminPanelModalProps) {
  const { i18n } = useI18n();
  const ui = i18n.common.ui;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="admin-panel-modal-title" maxWidthClassName={MODAL_EXCEPTION_PRESETS.adminPanel.maxWidthClass}>
      <ModalHeader
        titleId="admin-panel-modal-title"
        title={ui.modal.adminPanel.title}
        description={ui.modal.adminPanel.description}
        onClose={onClose}
      />
      <ModalBody className={MODAL_EXCEPTION_PRESETS.adminPanel.bodyClassName}>
        <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{ui.modal.adminPanel.notificationTitle}</div>
              <div className="mt-1 text-xs leading-5 text-stone-500">{ui.modal.adminPanel.notificationDescription}</div>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-700">{ui.modal.adminPanel.testBadge}</span>
          </div>
          <div className="mt-3 space-y-2">
            {NOTIFICATION_SETTING_META.map((item) => {
              const checked = notificationSettings[item.key];
              return (
                <div key={item.key} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 transition hover:border-stone-300 hover:bg-stone-100">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-stone-900">{item.label}</div>
                    <div className="mt-1 break-keep text-xs leading-5 text-stone-500">{item.description}</div>
                  </div>
                  <StatusToggle
                    checked={checked}
                    onChange={() => onToggleNotificationSetting(item.key)}
                    onLabel={ui.modal.adminPanel.toggleOn}
                    offLabel={ui.modal.adminPanel.toggleOff}
                    srLabel={`${item.label} ${checked ? ui.modal.adminPanel.toggleOn : ui.modal.adminPanel.toggleOff}`}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">{ui.modal.adminPanel.historyTitle}</h3>
              <div className="mt-1 text-xs text-stone-500">{ui.modal.adminPanel.historySummaryFormat}</div>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{`${historyLogs.length}${ui.modal.adminPanel.countSuffix}`}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {HISTORY_FILTER_OPTIONS.map(([value, label]) => (
              <button key={value} type="button" onClick={() => onHistoryFilterChange(value)} className={`pbp-touch-target pbp-interactive-button rounded-full px-3 py-1 text-xs font-medium ${historyFilter === value ? HISTORY_FILTER_BUTTON_CLASS.active : HISTORY_FILTER_BUTTON_CLASS.inactive}`}>{label}</button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {historyLogs.length > 0 ? historyLogs.map((item) => <HistoryPreviewItem key={item.id} item={item} />) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">{i18n.workorder.presentation.inventoryLog.empty}</div>}
          </div>
        </section>
      </ModalBody>
    </BaseModal>
  );
}
