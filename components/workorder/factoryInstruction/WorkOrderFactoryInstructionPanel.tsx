"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  WAFL_CHANGE_TARGET,
  WaflDocumentField,
  getWaflChangeFeedbackMessage,
  useWaflToastOperation,
} from "@/components/common/ui";
import ToastMessage from "@/components/common/ToastMessage";
import {
  fetchWorkOrderFactoryInstruction,
  patchWorkOrderFactoryInstruction,
} from "@/lib/workorder/factoryInstruction/apiClient";
import {
  FACTORY_INSTRUCTION_MAX_LENGTH,
  createEmptyWorkOrderFactoryInstruction,
  type WorkOrderFactoryInstruction,
} from "@/lib/workorder/factoryInstruction/types";
import type { WaflSaveStatusValue } from "@/components/common/ui";
import { WaflApiError } from "@/lib/api/waflApiTypes";

export type WorkOrderFactoryInstructionPanelProps = {
  workOrderId: string;
  editable: boolean;
  lockMessage?: string;
};

function getSafeFactoryInstructionMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof WaflApiError) {
    if (error.status === 404 || error.code === "WORKORDER_NOT_FOUND") {
      return "작업지시서를 찾을 수 없습니다. 목록에서 다시 선택해 주세요.";
    }
    if (error.status === 403) {
      return "이 작업지시서의 공장 전달사항을 수정할 권한이 없습니다.";
    }
    return fallbackMessage;
  }

  return fallbackMessage;
}

export default function WorkOrderFactoryInstructionPanel({
  workOrderId,
  editable,
  lockMessage,
}: WorkOrderFactoryInstructionPanelProps) {
  const [instruction, setInstruction] = useState<WorkOrderFactoryInstruction>(() =>
    createEmptyWorkOrderFactoryInstruction(workOrderId),
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<WaflSaveStatusValue>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveInFlightRef = useRef(false);
  const { operation, showOperationToast, clearOperationToast } = useWaflToastOperation(
    `workorder-factory-instruction:${workOrderId}`,
  );

  useEffect(() => {
    let active = true;

    const loadFactoryInstruction = async () => {
      setLoading(true);
      setSaveStatus("idle");
      setErrorMessage(null);
      clearOperationToast();
      setInstruction(createEmptyWorkOrderFactoryInstruction(workOrderId));
      setDraft("");

      try {
        const next = await fetchWorkOrderFactoryInstruction(workOrderId);
        if (!active) return;
        setInstruction(next);
        setDraft(next.content);
      } catch (error) {
        if (!active) return;
        setErrorMessage(getSafeFactoryInstructionMessage(error, "공장 전달사항을 불러오지 못했습니다."));
        setSaveStatus("error");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadFactoryInstruction();

    return () => {
      active = false;
    };
  }, [clearOperationToast, workOrderId]);

  const isDirty = draft !== instruction.content;
  const displayStatus = useMemo<WaflSaveStatusValue>(() => {
    if (saveStatus === "saving" || saveStatus === "error") return saveStatus;
    if (isDirty) return "dirty";
    if (saveStatus === "saved") return "saved";
    return "idle";
  }, [isDirty, saveStatus]);

  const handleChange = useCallback((value: string) => {
    setDraft(value);
    setErrorMessage(null);
    setSaveStatus("idle");
  }, []);

  const handleSave = useCallback(async () => {
    if (!editable || !isDirty || saveInFlightRef.current || saveStatus === "saving") return;
    saveInFlightRef.current = true;
    setSaveStatus("saving");
    setErrorMessage(null);
    showOperationToast(
      getWaflChangeFeedbackMessage(WAFL_CHANGE_TARGET.factoryInstruction, "changing"),
      "loading",
    );
    try {
      const saved = await patchWorkOrderFactoryInstruction(workOrderId, {
        content: draft,
        includeInFactoryPdf: instruction.includeInFactoryPdf,
      });
      setInstruction(saved);
      setDraft(saved.content);
      setSaveStatus("saved");
      showOperationToast(
        getWaflChangeFeedbackMessage(WAFL_CHANGE_TARGET.factoryInstruction, "changed"),
        "success",
      );
    } catch (error) {
      const message = getSafeFactoryInstructionMessage(
        error,
        getWaflChangeFeedbackMessage(WAFL_CHANGE_TARGET.factoryInstruction, "error"),
      );
      setErrorMessage(message);
      setSaveStatus("error");
      showOperationToast(message, "danger");
    } finally {
      saveInFlightRef.current = false;
    }
  }, [draft, editable, instruction.includeInFactoryPdf, isDirty, saveStatus, showOperationToast, workOrderId]);

  return (
    <>
      <ToastMessage
        message={operation?.message ?? null}
        tone={operation?.tone}
        eventKey={operation?.revision ?? null}
        toastId={operation?.id ?? null}
      />
      <WaflDocumentField
        title="공장 전달사항"
        value={draft}
        placeholder="예: 앞판 재단 방향을 맞추고, 완성 후 개별 포장해 주세요."
        maxLength={FACTORY_INSTRUCTION_MAX_LENGTH}
        editable={editable}
        loading={loading}
        lockMessage={lockMessage}
        saveStatus={displayStatus}
        saveErrorMessage={errorMessage}
        onChange={handleChange}
        onSave={handleSave}
        onClear={() => handleChange("")}
      />
    </>
  );
}
