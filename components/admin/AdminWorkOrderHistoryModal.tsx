"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { MODAL_EXCEPTION_PRESETS } from "@/components/common/modal/modalPresets";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import AdminPanelHistorySection from "@/components/common/modal/adminPanel/AdminPanelHistorySection";
import { useI18n } from "@/lib/i18n";
import type { HistoryFilter } from "@/types/workflow";
import type { HistoryLog } from "@/types/workorder";

type AdminWorkOrderHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  historyLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
};

export default function AdminWorkOrderHistoryModal({
  open,
  onClose,
  historyLogs,
  historyFilter,
  onHistoryFilterChange,
}: AdminWorkOrderHistoryModalProps) {
  const { i18n } = useI18n();
  const historyModalText = i18n.admin.historyModal;
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="admin-workorder-history-modal-title"
      maxWidthClassName={MODAL_EXCEPTION_PRESETS.adminPanel.maxWidthClass}
    >
      <ModalHeader
        titleId="admin-workorder-history-modal-title"
        title={historyModalText.title}
        description={historyModalText.description}
        onClose={onClose}
      />
      <ModalBody className={MODAL_EXCEPTION_PRESETS.adminPanel.bodyClassName}>
        <AdminPanelHistorySection
          historyLogs={historyLogs}
          historyFilter={historyFilter}
          onHistoryFilterChange={onHistoryFilterChange}
        />
      </ModalBody>
    </BaseModal>
  );
}
