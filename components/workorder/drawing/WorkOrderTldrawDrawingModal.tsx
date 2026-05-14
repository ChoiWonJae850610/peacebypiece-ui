"use client";

import { createElement, useEffect, useRef, useState, type ComponentType } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  MODAL_CONTENT_BODY_TEXT_CLASS,
  MODAL_CONTENT_MUTED_PANEL_CLASS,
} from "@/components/common/modal/modalContentClassNames";
import { useI18n } from "@/lib/i18n";

type WorkOrderTldrawDrawingModalProps = {
  open: boolean;
  onClose: () => void;
  onSaveDrawing: (file: File) => void;
  variant?: "desktop" | "tablet" | "mobile";
};

type OptionalTldrawEditor = {
  getCurrentPageShapeIds: () => Set<string>;
  toImage: (
    shapeIds: string[],
    options: { format: "png"; background: boolean; pixelRatio: number },
  ) => Promise<{ blob?: Blob } | undefined>;
};

type OptionalTldrawComponentProps = {
  onMount: (editor: OptionalTldrawEditor) => void;
};

type OptionalTldrawModule = {
  Tldraw: ComponentType<OptionalTldrawComponentProps>;
};

const DRAWING_MIME_TYPE = "image/png";
const DRAWING_FILE_EXTENSION = "png";

function createAdvancedDrawingFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `workorder-advanced-drawing-${stamp}.${DRAWING_FILE_EXTENSION}`;
}

async function importOptionalTldraw(): Promise<OptionalTldrawModule> {
  const module = await import("tldraw");
  return { Tldraw: module.Tldraw as ComponentType<OptionalTldrawComponentProps> };
}

export default function WorkOrderTldrawDrawingModal({
  open,
  onClose,
  onSaveDrawing,
  variant = "desktop",
}: WorkOrderTldrawDrawingModalProps) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui.attachmentPanel.advancedDrawingModal;
  const editorRef = useRef<OptionalTldrawEditor | null>(null);
  const [TldrawComponent, setTldrawComponent] = useState<ComponentType<OptionalTldrawComponentProps> | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isMobile = variant === "mobile";

  useEffect(() => {
    if (!open || TldrawComponent) return;
    let cancelled = false;

    importOptionalTldraw()
      .then((module) => {
        if (cancelled) return;
        setTldrawComponent(() => module.Tldraw);
        setErrorMessage("");
      })
      .catch((error) => {
        console.warn("[workorder-advanced-drawing] optional tldraw package is not available", error);
        if (cancelled) return;
        setErrorMessage(ui.packageUnavailableMessage);
      });

    return () => {
      cancelled = true;
    };
  }, [open, TldrawComponent, ui.packageUnavailableMessage]);

  const handleSave = async () => {
    const editor = editorRef.current;
    if (!editor || saving) return;
    const shapeIds = editor.getCurrentPageShapeIds();
    if (shapeIds.size === 0) {
      setErrorMessage(ui.emptyCanvasMessage);
      return;
    }

    setErrorMessage("");
    setSaving(true);
    try {
      const result = await editor.toImage([...shapeIds], {
        format: "png",
        background: true,
        pixelRatio: 2,
      });
      if (!result?.blob) {
        setErrorMessage(ui.exportFailedMessage);
        return;
      }
      const file = new File([result.blob], createAdvancedDrawingFileName(), { type: DRAWING_MIME_TYPE });
      onSaveDrawing(file);
      onClose();
    } catch (error) {
      console.error("[workorder-advanced-drawing] export failed", error);
      setErrorMessage(ui.exportFailedMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title={ui.title}
      description={isMobile ? ui.mobileDescription : ui.description}
      onClose={onClose}
      maxWidthClass="md:max-w-7xl"
      bodyClassName="min-h-0"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">{isMobile ? ui.mobileHint : ui.hint}</p>
            {errorMessage ? <p className="text-xs font-semibold text-[var(--pbp-danger)]">{errorMessage}</p> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="pbp-interactive-button pbp-action-secondary rounded-full px-4 py-2 text-sm font-semibold"
            >
              {ui.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !editorReady}
              className="pbp-interactive-button pbp-action-primary rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? ui.saving : ui.save}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid min-h-0 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} flex flex-col gap-3`}>
          <p className={`${MODAL_CONTENT_BODY_TEXT_CLASS} leading-6`}>{ui.toolHelp}</p>
          <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
            {ui.pocNotice}
          </div>
        </div>
        <div className="min-h-0 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-2 shadow-inner sm:p-3">
          <div className="h-[58dvh] min-h-[420px] overflow-hidden rounded-2xl border border-[var(--pbp-border)] bg-white sm:h-[64dvh]">
            {TldrawComponent ? (
              createElement(TldrawComponent, {
                onMount: (editor: OptionalTldrawEditor) => {
                  editorRef.current = editor;
                  setEditorReady(true);
                },
              })
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-[var(--pbp-text-muted)]">
                {ui.packageLoadingMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
