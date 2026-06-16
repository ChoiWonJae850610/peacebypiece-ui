"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import {
  AdminStatusBadge,
  type AdminStatusBadgeTone,
} from "@/components/admin/common/AdminStatusBadge";
import WaflBadge from "@/components/common/ui/WaflBadge";
import { WaflInfoBox } from "@/components/common/ui/WaflForm";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import ToastMessage, { type ToastTone } from "@/components/common/ToastMessage";
import WaflSettingsSectionGroup from "@/components/admin/common/WaflSettingsSectionGroup";
import {
  COMPANY_FILE_TYPES,
  type CompanyFileMetadata,
  type CompanyFileReviewStatus,
  type CompanyFileType,
} from "@/lib/admin/settings/companyFileTypes";
import {
  getCompanyFileAllowedUploadText,
  getCompanyFileInputAccept,
  getCompanyFileKindLabel,
  isAllowedCompanyFileType,
} from "@/lib/admin/settings/companyFileUploadPolicy";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type CompanyFilesPayload = {
  ok?: boolean;
  files?: CompanyFileMetadata[];
  error?: string;
};

type CompanyFileUploadQuota = {
  status?: "allowed" | "warning" | "blocked";
  message?: string;
  storageLimitBytes?: number;
  storageUsedBytes?: number;
  projectedUsedBytes?: number;
  usageRatio?: number;
  warningThresholdRatio?: number;
};

type CompanyFileUploadDiagnostics = {
  requestId?: string;
  workerHost?: string;
  storageKey?: string;
};

type CompanyFileUploadPayload = {
  ok?: boolean;
  error?: string;
  message?: string;
  quota?: CompanyFileUploadQuota;
  diagnostics?: CompanyFileUploadDiagnostics;
  file?: {
    fileType: CompanyFileType;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
  };
  upload?: {
    url: string;
    method: "PUT";
    headers: Record<string, string>;
    expiresInSeconds: number;
  };
};

type CompanyFileSavePayload = {
  ok?: boolean;
  file?: CompanyFileMetadata;
  quota?: CompanyFileUploadQuota;
  error?: string;
  message?: string;
};

type CompanyFileSlotViewModel = {
  fileType: CompanyFileType;
  title: string;
  description: string;
  actionLabel: string;
  emptyLabel: string;
  reviewRequired: boolean;
  accept: string;
  file: CompanyFileMetadata | null;
};

const fileTypeCopy: Record<
  CompanyFileType,
  {
    title: string;
    description: string;
    actionLabel: string;
    emptyLabel: string;
    reviewRequired: boolean;
  }
> = {
  representative_image: {
    title: "대표 이미지",
    description:
      "고객사 프로필, 시스템관리자 검토 화면, 향후 공개 문서에 표시할 회사 대표 이미지를 준비합니다.",
    actionLabel: "대표 이미지 등록/변경",
    emptyLabel: "등록된 대표 이미지 없음",
    reviewRequired: false,
  },
  business_registration: {
    title: "사업자등록증",
    description:
      "고객사 승인, 회사 정보 변경 검토, 운영 확인에 사용할 사업자등록증 파일을 준비합니다.",
    actionLabel: "사업자등록증 등록/변경",
    emptyLabel: "등록된 사업자등록증 없음",
    reviewRequired: true,
  },
};

const reviewStatusCopy: Record<
  CompanyFileReviewStatus,
  { label: string; tone: AdminStatusBadgeTone }
> = {
  not_required: { label: "검토 불필요", tone: "neutral" },
  pending_review: { label: "시스템관리자 검토 필요", tone: "warning" },
  approved: { label: "승인됨", tone: "success" },
  rejected: { label: "반려됨", tone: "danger" },
};

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 B";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatFileDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function findFile(
  files: CompanyFileMetadata[],
  fileType: CompanyFileType,
): CompanyFileMetadata | null {
  return files.find((file) => file.fileType === fileType) ?? null;
}

class CompanyFileUploadError extends Error {
  readonly userMessage: string;
  readonly diagnostics: Record<string, unknown> | null;

  constructor(
    code: string,
    userMessage: string,
    diagnostics: Record<string, unknown> | null = null,
  ) {
    super(code);
    this.name = "CompanyFileUploadError";
    this.userMessage = userMessage;
    this.diagnostics = diagnostics;
  }
}

function getCompanyFileUploadUserMessage(codeOrMessage: string): string {
  if (
    codeOrMessage === "STORAGE_QUOTA_EXCEEDED" ||
    codeOrMessage.includes("저장공간 한도")
  ) {
    return codeOrMessage.includes("저장공간 한도")
      ? codeOrMessage
      : "저장공간 한도를 초과하여 업로드할 수 없습니다. 요금제·저장공간 상태를 확인해 주세요.";
  }
  if (codeOrMessage === "STORAGE_QUOTA_UNAVAILABLE") {
    return "저장공간 한도 정보를 확인할 수 없어 업로드를 시작하지 못했습니다.";
  }
  if (codeOrMessage === "COMPANY_FILE_UPLOAD_NOT_CONFIGURED") {
    return "파일 업로드 저장소 설정이 완료되지 않았습니다. 시스템관리자에게 문의해 주세요.";
  }
  if (codeOrMessage === "COMPANY_FILE_UPLOAD_PREPARE_FAILED") {
    return "파일 업로드를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (codeOrMessage === "COMPANY_FILE_R2_UPLOAD_FAILED") {
    return "파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (codeOrMessage === "COMPANY_FILE_METADATA_SAVE_FAILED") {
    return "파일은 전송됐지만 등록 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (codeOrMessage.startsWith("COMPANY_FILE_")) {
    return "회사 파일을 처리하지 못했습니다. 파일 형식과 용량을 확인해 주세요.";
  }
  return (
    codeOrMessage ||
    "회사 파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요."
  );
}

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof CompanyFileUploadError) return error.userMessage;
  const message = error instanceof Error ? error.message : String(error || "");
  return getCompanyFileUploadUserMessage(message);
}

function getUploadTargetLabel(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "INVALID_UPLOAD_URL";
  }
}

async function readUploadFailureBody(
  response: Response,
): Promise<string | null> {
  const body = await response.text().catch(() => "");
  const trimmed = body.trim();
  return trimmed ? trimmed.slice(0, 800) : null;
}

function getQuotaWarningMessage(
  quota: CompanyFileUploadQuota | null | undefined,
): string | null {
  if (quota?.status !== "warning") return null;
  return (
    quota.message ||
    "회사 파일을 업로드했습니다. 저장공간 사용량이 80% 이상입니다."
  );
}

function createCompanyFileRouteUrl(
  file: CompanyFileMetadata | null | undefined,
  download = false,
): string {
  const key = String(file?.storageKey ?? "").trim();
  if (!key) return "";

  const params = new URLSearchParams({ key });
  if (download) params.set("download", "1");
  const fileName = String(file?.originalName ?? "").trim();
  if (fileName) params.set("name", fileName);

  return `/api/admin/company-files/file?${params.toString()}`;
}

function isCompanyFileImage(
  file: CompanyFileMetadata | null | undefined,
): boolean {
  return String(file?.mimeType ?? "")
    .toLowerCase()
    .startsWith("image/");
}

function isCompanyFilePdf(
  file: CompanyFileMetadata | null | undefined,
): boolean {
  return String(file?.mimeType ?? "").toLowerCase() === "application/pdf";
}

function getCompanyFileSummary(
  fileType: CompanyFileType,
  file: CompanyFileMetadata,
): string {
  return `${getCompanyFileKindLabel({ fileType, mimeType: file.mimeType })} · ${formatFileSize(file.sizeBytes)} · ${formatFileDate(file.createdAt)}`;
}

function getCompanyFileDenseMetaItems(file: CompanyFileMetadata): string[] {
  return [
    getCompanyFileKindLabel({
      fileType: file.fileType,
      mimeType: file.mimeType,
    }),
    formatFileSize(file.sizeBytes),
    formatFileDate(file.createdAt),
  ];
}

function getCompanyFilePreviewLabel(
  file: CompanyFileMetadata | null | undefined,
): string {
  if (isCompanyFileImage(file)) return "이미지 미리보기";
  if (isCompanyFilePdf(file)) return "PDF 미리보기";
  return "파일 미리보기";
}

function CompanyFilePreviewModal({
  file,
  fileType,
  title,
  onClose,
}: {
  file: CompanyFileMetadata | null;
  fileType: CompanyFileType | null;
  title: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const open = Boolean(file && fileType);
  const previewUrl = createCompanyFileRouteUrl(file);
  const downloadUrl = createCompanyFileRouteUrl(file, true);

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="company-file-preview-title"
      maxWidthClassName="md:max-w-5xl"
    >
      <ModalHeader
        titleId="company-file-preview-title"
        title={title}
        description={
          file && fileType ? getCompanyFileSummary(fileType, file) : undefined
        }
        onClose={onClose}
      />
      <ModalBody className="space-y-4">
        {file && fileType ? (
          <div className="space-y-4">
            <WaflSurface
              shape="control"
              tone="muted"
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-[var(--pbp-text-muted)]"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-bold text-[var(--pbp-text-secondary)]">
                  {getCompanyFilePreviewLabel(file)}
                </p>
                <p className="break-all">원본 파일명: {file.originalName}</p>
              </div>
              <a
                href={downloadUrl || previewUrl}
                target="_blank"
                rel="noreferrer"
                className="pbp-interactive-button pbp-action-secondary wafl-shape-compact px-3 py-1.5 text-xs font-semibold"
              >
                새 창에서 보기
              </a>
            </WaflSurface>

            {!previewUrl ? (
              <WaflInfoBox
                shape="control"
                tone="empty"
                className="p-6 text-sm text-[var(--pbp-text-muted)]"
              >
                미리보기 주소를 만들 수 없습니다.
              </WaflInfoBox>
            ) : isCompanyFileImage(file) ? (
              <WaflSurface
                shape="control"
                tone="muted"
                className="p-3 shadow-sm"
              >
                <img
                  src={previewUrl}
                  alt={title}
                  className="mx-auto max-h-[70dvh] w-auto wafl-shape-control bg-[var(--pbp-surface)] object-contain"
                />
              </WaflSurface>
            ) : isCompanyFilePdf(file) ? (
              <WaflSurface
                shape="control"
                tone="surface"
                className="overflow-hidden shadow-sm"
              >
                <div className="border-b border-[var(--pbp-border)] px-4 py-3 text-sm font-medium text-[var(--pbp-text-secondary)]">
                  PDF 미리보기
                </div>
                <iframe
                  title={title}
                  src={previewUrl}
                  className="h-[65dvh] w-full bg-[var(--pbp-surface)] md:h-[70dvh]"
                />
              </WaflSurface>
            ) : (
              <WaflInfoBox
                shape="control"
                tone="empty"
                className="p-6 text-sm text-[var(--pbp-text-muted)]"
              >
                이 파일 형식은 화면 안에서 미리볼 수 없습니다. 새 창에서 확인해
                주세요.
              </WaflInfoBox>
            )}
          </div>
        ) : null}
      </ModalBody>
    </BaseModal>
  );
}

export default function AdminCompanyFilesPanel() {
  const t = useAdminTranslation();
  const [files, setFiles] = useState<CompanyFileMetadata[]>([]);
  const [loadState, setLoadState] = useState<
    "idle" | "loading" | "loaded" | "failed"
  >("idle");
  const [uploadingType, setUploadingType] = useState<CompanyFileType | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");
  const [toastEventKey, setToastEventKey] = useState(0);
  const [previewTarget, setPreviewTarget] = useState<{
    fileType: CompanyFileType;
    file: CompanyFileMetadata;
    title: string;
  } | null>(null);
  const inputRefs = useRef<Record<CompanyFileType, HTMLInputElement | null>>({
    representative_image: null,
    business_registration: null,
  });

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    setToastTone(tone);
    setToastEventKey((currentKey) => currentKey + 1);
    setToastMessage(message);
  }, []);

  const loadFiles = useCallback(() => {
    setLoadState("loading");

    fetch("/api/admin/company-files", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response
          .json()
          .catch(() => null)) as CompanyFilesPayload | null;
        if (!response.ok || !payload?.ok || !Array.isArray(payload.files)) {
          throw new Error(payload?.error || "ADMIN_COMPANY_FILES_LIST_FAILED");
        }
        setFiles(payload.files);
        setLoadState("loaded");
      })
      .catch(() => {
        setFiles([]);
        setLoadState("failed");
      });
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const slots = useMemo<CompanyFileSlotViewModel[]>(() => {
    return COMPANY_FILE_TYPES.map((fileType) => ({
      fileType,
      ...fileTypeCopy[fileType],
      accept: getCompanyFileInputAccept(fileType),
      file: findFile(files, fileType),
    }));
  }, [files]);

  const openFilePicker = (fileType: CompanyFileType) => {
    inputRefs.current[fileType]?.click();
  };

  const uploadCompanyFile = async (
    fileType: CompanyFileType,
    selectedFile: File,
  ) => {
    setUploadingType(fileType);
    try {
      const prepareResponse = await fetch("/api/admin/company-files/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileType,
          originalName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
        }),
      });
      const preparePayload = (await prepareResponse
        .json()
        .catch(() => null)) as CompanyFileUploadPayload | null;
      if (
        !prepareResponse.ok ||
        !preparePayload?.ok ||
        !preparePayload.file ||
        !preparePayload.upload
      ) {
        const code =
          preparePayload?.error || "COMPANY_FILE_UPLOAD_PREPARE_FAILED";
        const diagnostics = {
          step: "prepare",
          status: prepareResponse.status,
          statusText: prepareResponse.statusText,
          fileType,
          originalName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
          error: code,
          message: preparePayload?.message ?? null,
        };
        console.warn("[ADMIN_COMPANY_FILE_UPLOAD_PREPARE_FAILED]", diagnostics);
        throw new CompanyFileUploadError(
          code,
          getCompanyFileUploadUserMessage(preparePayload?.message || code),
          diagnostics,
        );
      }

      const uploadResponse = await fetch(preparePayload.upload.url, {
        method: preparePayload.upload.method,
        headers: preparePayload.upload.headers,
        body: selectedFile,
      });
      if (!uploadResponse.ok) {
        const failureBody = await readUploadFailureBody(uploadResponse);
        const diagnostics = {
          step: "r2-put",
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          responseBody: failureBody,
          fileType,
          originalName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
          storageKey: preparePayload.file.storageKey,
          requestId: preparePayload.diagnostics?.requestId ?? null,
          uploadTarget: getUploadTargetLabel(preparePayload.upload.url),
        };
        console.warn("[COMPANY_FILE_R2_UPLOAD_FAILED]", diagnostics);
        throw new CompanyFileUploadError(
          "COMPANY_FILE_R2_UPLOAD_FAILED",
          getCompanyFileUploadUserMessage("COMPANY_FILE_R2_UPLOAD_FAILED"),
          diagnostics,
        );
      }

      const saveResponse = await fetch("/api/admin/company-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparePayload.file),
      });
      const savePayload = (await saveResponse
        .json()
        .catch(() => null)) as CompanyFileSavePayload | null;
      if (!saveResponse.ok || !savePayload?.ok || !savePayload.file) {
        const code = savePayload?.error || "COMPANY_FILE_METADATA_SAVE_FAILED";
        const diagnostics = {
          step: "metadata-save",
          status: saveResponse.status,
          statusText: saveResponse.statusText,
          fileType,
          originalName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
          storageKey: preparePayload.file.storageKey,
          requestId: preparePayload.diagnostics?.requestId ?? null,
          error: code,
          message: savePayload?.message ?? null,
        };
        console.warn("[COMPANY_FILE_METADATA_SAVE_FAILED]", diagnostics);
        throw new CompanyFileUploadError(
          code,
          getCompanyFileUploadUserMessage(savePayload?.message || code),
          diagnostics,
        );
      }

      const quotaWarning =
        getQuotaWarningMessage(savePayload.quota) ||
        getQuotaWarningMessage(preparePayload.quota);
      showToast(
        quotaWarning
          ? `${t("settings.companyFiles.uploadSuccess", "회사 파일을 업로드했습니다.")} ${quotaWarning}`
          : t(
              "settings.companyFiles.uploadSuccess",
              "회사 파일을 업로드했습니다.",
            ),
        quotaWarning ? "warning" : "success",
      );
      loadFiles();
    } catch (error) {
      if (!(error instanceof CompanyFileUploadError)) {
        console.warn("[ADMIN_COMPANY_FILE_UPLOAD_UNEXPECTED_FAILED]", {
          fileType,
          originalName: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          sizeBytes: selectedFile.size,
          error,
        });
      }
      showToast(getUploadErrorMessage(error), "danger");
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileChange = (
    fileType: CompanyFileType,
    selectedFile: File | null,
  ) => {
    if (!selectedFile) return;
    if (
      !isAllowedCompanyFileType({
        fileType,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
      })
    ) {
      showToast(
        `${getCompanyFileAllowedUploadText(fileType)} 형식만 등록할 수 있습니다.`,
        "warning",
      );
      return;
    }
    void uploadCompanyFile(fileType, selectedFile);
  };

  const panelBadgeTone: AdminStatusBadgeTone =
    loadState === "failed" ? "warning" : uploadingType ? "info" : "neutral";
  const panelBadgeLabel = uploadingType
    ? t("common.savingShort", "저장 중")
    : loadState === "loading"
      ? t("common.loadingShort", "조회 중")
      : loadState === "failed"
        ? t("common.loadFailed", "조회 실패")
        : t("settings.companyFiles.badge", "R2 업로드 연결");

  return (
    <WaflSettingsSectionGroup
      eyebrow={t("settings.companyFiles.eyebrow", "회사 파일")}
      title={t("settings.companyFiles.title", "대표 이미지·사업자등록증")}
      description={t(
        "settings.companyFiles.description",
        "현재 등록 상태를 먼저 확인하고 필요한 파일만 등록하거나 변경합니다.",
      )}
      badge={
        <AdminStatusBadge tone={panelBadgeTone} size="xs">
          {panelBadgeLabel}
        </AdminStatusBadge>
      }
      tone="neutral"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {slots.map((slot) => {
          const file = slot.file;
          const status = file ? reviewStatusCopy[file.reviewStatus] : null;
          const isUploading = uploadingType === slot.fileType;
          const isRepresentativeImage =
            slot.fileType === "representative_image";
          const previewTitle = file
            ? t("settings.companyFiles.registered", "등록 완료")
            : slot.emptyLabel;
          const previewDescription = file
            ? getCompanyFileSummary(slot.fileType, file)
            : isRepresentativeImage
              ? t(
                  "settings.companyFiles.representativeEmptyDescription",
                  "대표 이미지를 등록하면 고객사 프로필과 시스템관리자 검토 화면에 표시됩니다.",
                )
              : t(
                  "settings.companyFiles.businessRegistrationEmptyDescription",
                  "사업자등록증을 등록하면 시스템관리자 검토 상태로 표시됩니다.",
                );
          const allowedUploadText = getCompanyFileAllowedUploadText(
            slot.fileType,
          );
          const previewUrl = createCompanyFileRouteUrl(file);
          const denseMetaItems = file ? getCompanyFileDenseMetaItems(file) : [];

          return (
            <WaflSurface
              key={slot.fileType}
              as="article"
              shape="control"
              tone="surface"
              className="p-3.5 shadow-[var(--pbp-shadow-card)] sm:p-4"
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--pbp-text-subtle)]">
                    {isRepresentativeImage
                      ? t(
                          "settings.companyFiles.representativeEyebrow",
                          "대표 이미지",
                        )
                      : t(
                          "settings.companyFiles.businessRegistrationEyebrow",
                          "사업자등록증",
                        )}
                  </p>
                  <h4 className="mt-1.5 break-words text-sm font-black tracking-[-0.02em] text-[var(--pbp-text-primary)]">
                    {previewTitle}
                  </h4>
                  <p className="mt-1 text-xs font-medium text-[var(--pbp-text-muted)]">
                    {allowedUploadText}
                  </p>
                </div>
                {file && status ? (
                  <AdminStatusBadge tone={status.tone} size="xs">
                    {status.label}
                  </AdminStatusBadge>
                ) : (
                  <AdminStatusBadge tone="neutral" size="xs">
                    {t("settings.companyFiles.notRegistered", "미등록")}
                  </AdminStatusBadge>
                )}
              </div>

              <WaflSurface
                shape="control"
                tone="muted"
                className="mt-3 overflow-hidden sm:mt-4" data-wafl-device-density="company-file-preview"
              >
                <div className="flex min-h-[140px] items-center justify-center px-3 py-3.5 text-center sm:min-h-[188px] sm:px-4 sm:py-5 lg:min-h-[216px]">
                  {file ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewTarget({
                          fileType: slot.fileType,
                          file,
                          title: slot.title,
                        })
                      }
                      className="pbp-interactive-button group flex w-full min-w-0 flex-col items-center wafl-shape-control p-1 text-center transition hover:bg-[var(--pbp-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]"
                    >
                      {isCompanyFileImage(file) && previewUrl ? (
                        <div className="flex w-full items-center justify-center wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 shadow-sm">
                          <img
                            src={previewUrl}
                            alt={slot.title}
                            className="h-[108px] w-full wafl-shape-control object-contain sm:h-[148px] lg:h-[168px]"
                          />
                        </div>
                      ) : (
                        <div className="mx-auto flex h-[108px] w-full max-w-[220px] flex-col items-center justify-center wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 text-center shadow-sm sm:h-[148px] lg:h-[168px]">
                          <span className="text-2xl font-black tracking-[-0.04em] text-[var(--pbp-text-subtle)]">
                            {isCompanyFilePdf(file)
                              ? "PDF"
                              : isRepresentativeImage
                                ? "IMG"
                                : "DOC"}
                          </span>
                          <span className="mt-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
                            {getCompanyFilePreviewLabel(file)}
                          </span>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                        {denseMetaItems.map((item) => (
                          <WaflBadge key={item} tone="neutral" size="xs">
                            {item}
                          </WaflBadge>
                        ))}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
                        {previewDescription}
                      </p>
                    </button>
                  ) : (
                    <div className="min-w-0">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center wafl-shape-icon border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] text-xs font-bold text-[var(--pbp-text-subtle)]">
                        {isRepresentativeImage
                          ? t("settings.companyFiles.imagePreview", "이미지")
                          : t("settings.companyFiles.documentPreview", "문서")}
                      </div>
                      <p className="mt-3 text-sm font-bold text-[var(--pbp-text-primary)]">
                        {slot.emptyLabel}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
                        {previewDescription}
                      </p>
                    </div>
                  )}
                </div>
              </WaflSurface>

              {file?.rejectionReason ? (
                <WaflInfoBox
                  shape="control"
                  tone="danger"
                  density="compact"
                  className="mt-3 text-xs font-semibold leading-5 text-[var(--pbp-status-danger-fg)]"
                >
                  {t("settings.companyFiles.rejectionReason", "반려 사유")}:{" "}
                  {file.rejectionReason}
                </WaflInfoBox>
              ) : null}

              <WaflInfoBox
                shape="control"
                tone="muted"
                density="compact"
                className="mt-3 border-dashed text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]"
              >
                업로드 가능: {allowedUploadText}
              </WaflInfoBox>

              <div className="mt-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">
                  {file
                    ? t(
                        "settings.companyFiles.registeredFileHint",
                        "현재 등록된 파일입니다. 원본 파일명은 미리보기에서 확인할 수 있습니다.",
                      )
                    : t(
                        "settings.companyFiles.emptyFileHint",
                        "등록된 파일이 없습니다.",
                      )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {file ? (
                    <AdminButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setPreviewTarget({
                          fileType: slot.fileType,
                          file,
                          title: slot.title,
                        })
                      }
                    >
                      {t("settings.companyFiles.preview", "미리보기")}
                    </AdminButton>
                  ) : null}
                  <input
                    ref={(element) => {
                      inputRefs.current[slot.fileType] = element;
                    }}
                    type="file"
                    className="hidden"
                    accept={slot.accept}
                    disabled={Boolean(uploadingType)}
                    onChange={(event) => {
                      const selectedFile =
                        event.currentTarget.files?.[0] ?? null;
                      event.currentTarget.value = "";
                      handleFileChange(slot.fileType, selectedFile);
                    }}
                  />
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={Boolean(uploadingType)}
                    onClick={() => openFilePicker(slot.fileType)}
                  >
                    {isUploading
                      ? t("common.savingShort", "저장 중")
                      : file
                        ? t("settings.companyFiles.replace", "변경")
                        : t("settings.companyFiles.register", "등록")}
                  </AdminButton>
                </div>
              </div>
            </WaflSurface>
          );
        })}
      </div>

      {loadState === "failed" ? (
        <WaflInfoBox
          shape="control"
          tone="warning"
          density="compact"
          className="mt-3 text-xs font-semibold leading-5 text-[var(--pbp-status-warning-fg)]"
        >
          {t(
            "settings.companyFiles.loadFailedDescription",
            "회사 파일 상태를 불러오지 못했습니다. DB/API 1차 적용 상태와 로그인 회사 범위를 확인해 주세요.",
          )}
        </WaflInfoBox>
      ) : null}

      <CompanyFilePreviewModal
        file={previewTarget?.file ?? null}
        fileType={previewTarget?.fileType ?? null}
        title={
          previewTarget?.title ??
          t("settings.companyFiles.preview", "파일 미리보기")
        }
        onClose={() => setPreviewTarget(null)}
      />

      <ToastMessage
        message={toastMessage}
        tone={toastTone}
        eventKey={toastEventKey}
      />
    </WaflSettingsSectionGroup>
  );
}
