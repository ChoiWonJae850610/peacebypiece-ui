"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { WaflDocumentField } from "@/components/common/ui";
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

export type WorkOrderFactoryInstructionPanelProps = {
  workOrderId: string;
  editable: boolean;
  lockMessage?: string;
};

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSaveStatus("idle");
    setErrorMessage(null);
    setInstruction(createEmptyWorkOrderFactoryInstruction(workOrderId));
    setDraft("");

    void fetchWorkOrderFactoryInstruction(workOrderId)
      .then((next) => {
        if (!active) return;
        setInstruction(next);
        setDraft(next.content);
      })
      .catch((error) => {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "공장 전달사항을 불러오지 못했습니다.");
        setSaveStatus("error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [workOrderId]);

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
    if (!editable || !isDirty || saveStatus === "saving") return;
    setSaveStatus("saving");
    setErrorMessage(null);
    try {
      const saved = await patchWorkOrderFactoryInstruction(workOrderId, {
        content: draft,
        includeInFactoryPdf: instruction.includeInFactoryPdf,
      });
      setInstruction(saved);
      setDraft(saved.content);
      setSaveStatus("saved");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "공장 전달사항을 저장하지 못했습니다.");
      setSaveStatus("error");
    }
  }, [draft, editable, instruction.includeInFactoryPdf, isDirty, saveStatus, workOrderId]);

  return (
    <WaflDocumentField
      title="공장 전달사항"
      description="봉제, 원단 방향, 부자재 위치, 포장 등 공장에 전달할 최종 내용을 입력합니다."
      value={draft}
      placeholder="예: 앞판 원단 방향을 맞춰 재단하고, 완성 후 개별 포장해 주세요."
      maxLength={FACTORY_INSTRUCTION_MAX_LENGTH}
      editable={editable}
      loading={loading}
      lockMessage={lockMessage}
      saveStatus={displayStatus}
      saveErrorMessage={errorMessage}
      savedAt={instruction.updatedAt}
      onChange={handleChange}
      onSave={() => void handleSave()}
      onClear={() => handleChange("")}
    />
  );
}
