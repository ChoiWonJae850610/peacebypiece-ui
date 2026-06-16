"use client";

import type { ChangeEvent, ReactNode } from "react";

import { WaflButton } from "./WaflButton";
import { WaflInfoBox, WaflTextarea } from "./WaflForm";
import WaflSaveStatus, { type WaflSaveStatusValue } from "./WaflSaveStatus";
import WaflSection from "./WaflSection";

type WaflDocumentFieldProps = {
  title: ReactNode;
  description?: ReactNode;
  value: string;
  placeholder?: string;
  maxLength?: number;
  editable: boolean;
  loading?: boolean;
  lockMessage?: string;
  saveStatus: WaflSaveStatusValue;
  saveErrorMessage?: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
  onClear?: () => void;
};

export default function WaflDocumentField({
  title,
  description,
  value,
  placeholder,
  maxLength,
  editable,
  loading = false,
  lockMessage,
  saveStatus,
  saveErrorMessage,
  onChange,
  onSave,
  onClear,
}: WaflDocumentFieldProps) {
  const disabled = loading || saveStatus === "saving";
  const statusMessage = saveStatus === "error" ? saveErrorMessage ?? undefined : undefined;

  return (
    <WaflSection
      title={title}
      description={description}
      padding="md"
      bodyClassName="space-y-3"
    >
      {loading ? (
        <WaflInfoBox tone="muted" density="spacious">
          내용을 불러오는 중입니다.
        </WaflInfoBox>
      ) : (
        <>
          <WaflTextarea
            value={value}
            maxLength={maxLength}
            readOnly={!editable}
            disabled={disabled}
            placeholder={placeholder}
            className="min-h-40 text-xs leading-5 placeholder:text-xs placeholder:font-normal"
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
          />
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              {!editable && lockMessage ? (
                <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">{lockMessage}</p>
              ) : null}
              {typeof maxLength === "number" ? (
                <p className="text-xs leading-5 text-[var(--pbp-text-subtle)]">
                  {value.length.toLocaleString()} / {maxLength.toLocaleString()}
                </p>
              ) : null}
            </div>
            {editable ? (
              <div className="flex shrink-0 items-center gap-2">
                {onClear && value ? (
                  <WaflButton size="sm" variant="ghost" disabled={disabled} onClick={onClear}>
                    내용 비우기
                  </WaflButton>
                ) : null}
                <WaflButton size="sm" variant="primary" disabled={disabled || saveStatus === "idle" || saveStatus === "saved"} onClick={onSave}>
                  저장
                </WaflButton>
              </div>
            ) : null}
          </div>
          <WaflSaveStatus
            status={saveStatus}
            message={statusMessage}
            align="left"
          />
        </>
      )}
    </WaflSection>
  );
}
