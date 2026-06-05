"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type CompanyFileSlotViewModel = {
  fileType: CompanyFileType;
  title: string;
  description: string;
  actionLabel: string;
  emptyLabel: string;
  reviewRequired: boolean;
  file: CompanyFileMetadata | null;
};

const fileTypeCopy: Record<CompanyFileType, { title: string; description: string; actionLabel: string; emptyLabel: string; reviewRequired: boolean }> = {
  representative_image: {
    title: "대표 이미지",
    description: "고객사 프로필, 시스템관리자 검토 화면, 향후 공개 문서에 표시할 회사 대표 이미지를 준비합니다.",
    actionLabel: "대표 이미지 등록/변경",
    emptyLabel: "등록된 대표 이미지 없음",
    reviewRequired: false,
  },
  business_registration: {
    title: "사업자등록증",
    description: "고객사 승인, 회사 정보 변경 검토, 운영 확인에 사용할 사업자등록증 파일을 준비합니다.",
    actionLabel: "사업자등록증 등록/변경",
    emptyLabel: "등록된 사업자등록증 없음",
    reviewRequired: true,
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

export default function AdminCompanyFilesPanel() {
  const t = useAdminTranslation();
  const [files, setFiles] = useState<CompanyFileMetadata[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<ToastTone>("info");
  const [toastEventKey, setToastEventKey] = useState(0);

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

  const showUploadPendingToast = (fileType: CompanyFileType) => {
    const copy = fileTypeCopy[fileType];
    setToastTone("info");
    setToastEventKey((currentKey) => currentKey + 1);
    setToastMessage(
      t(
        "settings.companyFiles.uploadPending",
        `${copy.title} 업로드는 R2 연결 버전에서 활성화됩니다. 현재는 DB/API 상태 조회와 화면 표시만 확인합니다.`,
      ),
    );
  };

  const panelBadgeTone: AdminStatusBadgeTone = loadState === "failed" ? "warning" : "neutral";
  const panelBadgeLabel = loadState === "loading" ? t("common.loadingShort", "조회 중") : loadState === "failed" ? t("common.loadFailed", "조회 실패") : t("settings.companyFiles.badge", "DB/API 연결");

  return (
    <WaflSettingsSectionGroup
      eyebrow={t("settings.companyFiles.eyebrow", "회사 파일")}
      title={t("settings.companyFiles.title", "대표 이미지·사업자등록증")}
      description={t("settings.companyFiles.description", "회사 정보 화면에서 필요한 파일 상태를 먼저 표시합니다. 실제 R2 업로드는 다음 단계에서 연결합니다.")}
      badge={<AdminStatusBadge tone={panelBadgeTone} size="xs">{panelBadgeLabel}</AdminStatusBadge>}
      tone="info"
      footer={t("settings.companyFiles.footer", "이 버전은 UI 1차입니다. 파일 선택·R2 업로드·미리보기 다운로드는 후속 버전에서 연결합니다.")}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {slots.map((slot) => {
          const file = slot.file;
          const status = file ? reviewStatusCopy[file.reviewStatus] : null;
          const title = file?.originalName?.trim() || slot.emptyLabel;
          const description = file
            ? `${formatFileSize(file.sizeBytes)} · ${file.mimeType || "파일 형식 미확인"} · 등록일 ${formatFileDate(file.createdAt)}`
            : slot.description;

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
                <AdminButton type="button" size="sm" variant="secondary" onClick={() => showUploadPendingToast(slot.fileType)}>
                  {file ? t("settings.companyFiles.replace", "변경") : t("settings.companyFiles.register", "등록")}
                </AdminButton>
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
