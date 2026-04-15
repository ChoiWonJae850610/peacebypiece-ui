"use client";

import { useEffect, useRef, useState } from "react";
import { loadSectionPreferences, persistSectionPreferences } from "@/lib/repositories/uiPreferencePersistence";
import type { WorkflowAction } from "@/types/workorder";

type UseWorkOrderUIStateOptions = {
  initialAdminPanelOpen?: boolean;
};

export function useWorkOrderUIState({ initialAdminPanelOpen = false }: UseWorkOrderUIStateOptions = {}) {
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [basicInfoOpen, setBasicInfoOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [outsourcingOpen, setOutsourcingOpen] = useState(false);
  const [inventoryEditorOpen, setInventoryEditorOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [createWorkOrderModalOpen, setCreateWorkOrderModalOpen] = useState(false);
  const [managerAssignModalOpen, setManagerAssignModalOpen] = useState(false);
  const [inventoryLogModalOpen, setInventoryLogModalOpen] = useState(false);
  const [adminPanelModalOpen, setAdminPanelModalOpen] = useState(initialAdminPanelOpen);
  const [attachmentPreviewId, setAttachmentPreviewId] = useState<string | null>(null);
  const [orderRequestConfirmOpen, setOrderRequestConfirmOpen] = useState(false);
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<WorkflowAction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const persisted = loadSectionPreferences();
    setBasicInfoOpen(persisted.basicInfoOpen);
    setMaterialOpen(persisted.materialOpen);
    setOutsourcingOpen(persisted.outsourcingOpen);
  }, []);

  useEffect(() => {
    persistSectionPreferences({
      basicInfoOpen,
      materialOpen,
      outsourcingOpen,
    });
  }, [basicInfoOpen, materialOpen, outsourcingOpen]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  return {
    appShellRef,
    attachmentInputRef,
    drawerOpen,
    setDrawerOpen,
    basicInfoOpen,
    setBasicInfoOpen,
    materialOpen,
    setMaterialOpen,
    outsourcingOpen,
    setOutsourcingOpen,
    inventoryEditorOpen,
    setInventoryEditorOpen,
    permissionModalOpen,
    setPermissionModalOpen,
    createWorkOrderModalOpen,
    setCreateWorkOrderModalOpen,
    managerAssignModalOpen,
    setManagerAssignModalOpen,
    inventoryLogModalOpen,
    setInventoryLogModalOpen,
    adminPanelModalOpen,
    setAdminPanelModalOpen,
    attachmentPreviewId,
    setAttachmentPreviewId,
    orderRequestConfirmOpen,
    setOrderRequestConfirmOpen,
    pendingWorkflowAction,
    setPendingWorkflowAction,
    toastMessage,
    setToastMessage,
  };
}
