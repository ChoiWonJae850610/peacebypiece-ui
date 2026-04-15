"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { MODAL_EXCEPTION_PRESETS } from "@/components/common/modal/modalPresets";
import AdminPanelNotificationSection from "@/components/common/modal/adminPanel/AdminPanelNotificationSection";
import { useI18n } from "@/lib/i18n";
import type { NotificationSettingKey, NotificationSettings } from "@/types/workflow";

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
};

export default function AdminPanelModal({
  open,
  onClose,
  notificationSettings,
  onToggleNotificationSetting,
}: AdminPanelModalProps) {
  const { i18n } = useI18n();
  const ui = i18n.common.ui;
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="admin-panel-modal-title"
      maxWidthClassName={MODAL_EXCEPTION_PRESETS.adminPanel.maxWidthClass}
    >
      <ModalHeader
        titleId="admin-panel-modal-title"
        title={ui.modal.adminPanel.title}
        description={ui.modal.adminPanel.description}
        onClose={onClose}
      />
      <ModalBody className={MODAL_EXCEPTION_PRESETS.adminPanel.bodyClassName}>
        <AdminPanelNotificationSection
          notificationSettings={notificationSettings}
          onToggleNotificationSetting={onToggleNotificationSetting}
        />
      </ModalBody>
    </BaseModal>
  );
}
