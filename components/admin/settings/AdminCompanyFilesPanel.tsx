"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import ToastMessage, { type ToastTone } from "@/components/common/ToastMessage";
import WaflSettingCard from "@/components/admin/common/WaflSettingCard";
import WaflSettingsSectionGroup from "@/components/admin/common/WaflSettingsSectionGroup";
import {
  COMPANY_FILE_TYPES,
  type CompanyFileMetadata,
  type CompanyFileReviewStatus,
  type CompanyFileType,
} from "@/lib/admin/settings/companyFileTypes";
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

type CompanyFileUploadPayload = {
  ok?: boolean;
  error?: string;
  message?: string;
  quota?: CompanyFileUploadQuota;
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

const fileTypeCopy: Record<CompanyFileType, { title: string; description: string; actionLabel: string; emptyLabel: string; reviewRequired: boolean; accept: string }> = {
  representative_image: {
    title: "대표 이미지",
    description: "고객사 프로필, 시스템관리자 검토 화면, 향후 공개 문서에 표시할 회사 대표 이미지를 준비합니다.",
    actionLabel: "대표 이미지 등록/변경",
    emptyLabel: "등록된 대표 이미지 없음",
    reviewRequired: false,
    accept: "image/jpeg,image/png,image/webp",
  },
  business_registration: {
    title: "사업자등록증",
    description: "고객사 승인, 회사 정보 변경 검토, 운영 확인에 사용할 사업자등록증 파일을 준비합니다.",
    actionLabel: "사업자등록증 등록/변경",
    emptyLabel: "등록된 사업자등록증 없음",
    reviewRequired: true,
    accept: "image/jpeg,image/png,image/webp,application/pdf",
  },
};

const reviewStatusCopy: Record<CompanyFileReviewStatus, { label: string; tone: AdminStatusBadgeTone }> = {
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

function findFile(files: CompanyFileMetadata[], fileType: CompanyFileType): CompanyFileMetadata | null {
  return files.find((file) => file.fileType === fileType) ?? null;
}

function getUploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "회사 파일 업로드에 실패했습니다.");
  if (message === "STORAGE_QUOTA_EXCEEDED" || message.includes("저장공간 한도")) {
    return message.includes("저장공간 한도")
      ? message
      : "저장공간 한도를 초과하여 업로드할 수 없습니다. 요금제·저장공간 상태를 확인해 주세요.";
  }
  if (message === "STORAGE_QUOTA_UNAVAILABLE") {
    return "저장공간 한도 정보를 확인할 수 없어 업로드를 시작하지 못했습니다.";
  }
  return message;
}

function getQuotaWarningMessage(quota: CompanyFileUploadQuota | null | undefined): string | null {
  if (quota?.status !== "warning") return null;
  return quota.message || "회사 파일을 업로드했습니다. 저장공간 사용량이 80% 이상입니다.";
}

export default function AdminCompanyFilesPanel() {
  const t = useAdminTranslation();
  const [files, setFiles] = useState<CompanyFileMetadata[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [uploadingType, setUploadingType] = useState<CompanyFileType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");
  const [toastEventKey, setToastEventKey] = useState(0);
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
        const payload = (await response.json().catch(() => null)) as CompanyFilesPayload | null;
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
      file: findFile(files, fileType),
    }));
  }, [files]);

  const openFilePicker = (fileType: CompanyFileType) => {
    inputRefs.current[fileType]?.click();
  };

  const uploadCompanyFile = async (fileType: CompanyFileType, selectedFile: File) => {
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
      const preparePayload = (await prepareResponse.json().catch(() => null)) as CompanyFileUploadPayload | null;
      if (!prepareResponse.ok || !preparePayload?.ok || !preparePayload.file || !preparePayload.upload) {
        throw new Error(preparePayload?.message || preparePayload?.error || "COMPANY_FILE_UPLOAD_PREPARE_FAILED");
      }

      const uploadResponse = await fetch(preparePayload.upload.url, {
        method: preparePayload.upload.method,
        headers: preparePayload.upload.headers,
        body: selectedFile,
      });
      if (!uploadResponse.ok) {
        throw new Error("COMPANY_FILE_R2_UPLOAD_FAILED");
      }

      const saveResponse = await fetch("/api/admin/company-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparePayload.file),
      });
      const savePayload = (await saveResponse.json().catch(() => null)) as CompanyFileSavePayload | null;
      if (!saveResponse.ok || !savePayload?.ok || !savePayload.file) {
        throw new Error(savePayload?.message || savePayload?.error || "COMPANY_FILE_METADATA_SAVE_FAILED");
      }

      const quotaWarning = getQuotaWarningMessage(savePayload.quota) || getQuotaWarningMessage(preparePayload.quota);
      showToast(
        quotaWarning
          ? `${t("settings.companyFiles.uploadSuccess", "회사 파일을 업로드했습니다.")} ${quotaWarning}`
          : t("settings.companyFiles.uploadSuccess", "회사 파일을 업로드했습니다."),
        quotaWarning ? "warning" : "success",
      );
      loadFiles();
    } catch (error) {
      showToast(getUploadErrorMessage(error), "danger");
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileChange = (fileType: CompanyFileType, selectedFile: File | null) => {
    if (!selectedFile) return;
    void uploadCompanyFile(fileType, selectedFile);
  };

  const panelBadgeTone: AdminStatusBadgeTone = loadState === "failed" ? "warning" : uploadingType ? "info" : "neutral";
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
      description={t("settings.companyFiles.description", "회사 정보 화면에서 필요한 대표 이미지와 사업자등록증을 업로드하고 현재 등록 상태를 확인합니다.")}
      badge={<AdminStatusBadge tone={panelBadgeTone} size="xs">{panelBadgeLabel}</AdminStatusBadge>}
      tone="info"
      footer={t("settings.companyFiles.footer", "대표 이미지는 검토 없이 저장되고, 사업자등록증은 시스템관리자 검토 필요 상태로 저장됩니다.")}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {slots.map((slot) => {
          const file = slot.file;
          const status = file ? reviewStatusCopy[file.reviewStatus] : null;
          const title = file?.originalName?.trim() || slot.emptyLabel;
          const description = file
            ? `${formatFileSize(file.sizeBytes)} · ${file.mimeType || "파일 형식 미확인"} · 등록일 ${formatFileDate(file.createdAt)}`
            : slot.description;
          const isUploading = uploadingType === slot.fileType;

          return (
            <WaflSettingCard
              key={slot.fileType}
              eyebrow={slot.title}
              title={title}
              description={description}
              badge={
                file && status ? (
                  <AdminStatusBadge tone={status.tone} size="xs">{status.label}</AdminStatusBadge>
                ) : (
                  <AdminStatusBadge tone={slot.reviewRequired ? "warning" : "neutral"} size="xs">
                    {slot.reviewRequired ? t("settings.companyFiles.reviewRequired", "검토 파일") : t("settings.companyFiles.optionalReview", "검토 없음")}
                  </AdminStatusBadge>
                )
              }
              meta={file?.rejectionReason ? `${t("settings.companyFiles.rejectionReason", "반려 사유")}: ${file.rejectionReason}` : undefined}
              tone={file?.reviewStatus === "rejected" ? "danger" : slot.reviewRequired ? "warning" : "info"}
              density="compact"
              actions={
                <>
                  <input
                    ref={(element) => {
                      inputRefs.current[slot.fileType] = element;
                    }}
                    type="file"
                    className="hidden"
                    accept={slot.accept}
                    disabled={Boolean(uploadingType)}
                    onChange={(event) => {
                      const selectedFile = event.currentTarget.files?.[0] ?? null;
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
                    {isUploading ? t("common.savingShort", "저장 중") : file ? t("settings.companyFiles.replace", "변경") : t("settings.companyFiles.register", "등록")}
                  </AdminButton>
                </>
              }
            />
          );
        })}
      </div>

      {loadState === "failed" ? (
        <div className="mt-3 rounded-2xl border border-[var(--pbp-status-warning)]/30 bg-[var(--pbp-status-warning-bg)] px-3 py-3 text-xs font-semibold leading-5 text-[var(--pbp-status-warning-fg)]">
          {t("settings.companyFiles.loadFailedDescription", "회사 파일 상태를 불러오지 못했습니다. DB/API 1차 적용 상태와 로그인 회사 범위를 확인해 주세요.")}
        </div>
      ) : null}

      <ToastMessage message={toastMessage} tone={toastTone} eventKey={toastEventKey} />
    </WaflSettingsSectionGroup>
  );
}
