"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import {
  SYSTEM_DANGER_BOX_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUCCESS_BOX_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import type { CompanyFileReviewStatus } from "@/lib/admin/settings/companyFileTypes";
import { formatPbpBinaryBytes } from "@/lib/utils/formatters";

type SystemCompanyFileReviewRecord = {
  id: string;
  companyId: string;
  companyName: string;
  businessName: string | null;
  fileType: "representative_image" | "business_registration";
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  reviewStatus: CompanyFileReviewStatus;
  uploaderName: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

type SystemCompanyFileReviewPayload = {
  ok?: boolean;
  files?: SystemCompanyFileReviewRecord[];
  file?: SystemCompanyFileReviewRecord;
  error?: string;
  message?: string;
};

const reviewStatusCopy: Record<CompanyFileReviewStatus, { label: string; tone: AdminStatusBadgeTone }> = {
  not_required: { label: "검토 불필요", tone: "neutral" },
  pending_review: { label: "검토 대기", tone: "warning" },
  approved: { label: "승인됨", tone: "success" },
  rejected: { label: "반려됨", tone: "danger" },
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(sizeBytes: number): string {
  return formatPbpBinaryBytes(sizeBytes, {
    zeroLabel: "0 KB",
    mbFractionDigits: sizeBytes >= 10 * 1024 * 1024 ? 0 : 1,
    kbFractionDigits: 0,
  }).replace(/(GB|MB|KB|B)$/, " $1");
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function SystemCompanyFileReviewPanel() {
  const [files, setFiles] = useState<SystemCompanyFileReviewRecord[]>([]);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "loaded" | "failed">("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [reviewingFileId, setReviewingFileId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const pendingCount = useMemo(() => files.filter((file) => file.reviewStatus === "pending_review").length, [files]);
  const approvedCount = useMemo(() => files.filter((file) => file.reviewStatus === "approved").length, [files]);
  const rejectedCount = useMemo(() => files.filter((file) => file.reviewStatus === "rejected").length, [files]);

  const loadCompanyFiles = useCallback(async () => {
    setLoadStatus("loading");
    setLoadError(null);

    try {
      const response = await fetch("/api/system/company-files?limit=50", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as SystemCompanyFileReviewPayload | null;
      if (!response.ok || !payload?.ok || !Array.isArray(payload.files)) {
        throw new Error(payload?.message || payload?.error || "SYSTEM_COMPANY_FILE_REVIEW_LIST_FAILED");
      }
      setFiles(payload.files);
      setLoadStatus("loaded");
    } catch (error) {
      setFiles([]);
      setLoadStatus("failed");
      setLoadError(getErrorMessage(error, "회사 파일 검토 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    void loadCompanyFiles();
  }, [loadCompanyFiles]);

  async function submitReview(fileId: string, action: "approved" | "rejected") {
    const reviewReason = rejectionReasons[fileId]?.trim() || "";
    if (action === "rejected" && !reviewReason) {
      setActionError("반려 처리에는 반려 사유가 필요합니다.");
      setActionMessage(null);
      return;
    }

    setReviewingFileId(fileId);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await fetch("/api/system/company-files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, action, reviewReason }),
      });
      const payload = (await response.json().catch(() => null)) as SystemCompanyFileReviewPayload | null;
      if (!response.ok || !payload?.ok || !payload.file) {
        throw new Error(payload?.message || payload?.error || "SYSTEM_COMPANY_FILE_REVIEW_UPDATE_FAILED");
      }

      setFiles((currentFiles) => currentFiles.map((file) => (file.id === payload.file?.id ? payload.file : file)));
      setActionMessage(action === "approved" ? "사업자등록증을 승인했습니다." : "사업자등록증을 반려했습니다.");
    } catch (error) {
      setActionError(getErrorMessage(error, "회사 파일 검토 처리에 실패했습니다."));
    } finally {
      setReviewingFileId(null);
    }
  }

  return (
    <section className={SYSTEM_MUTED_CARD_CLASS}>
      <div className={`flex flex-col gap-3 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-start lg:justify-between`}>
        <div>
          <h3 className={SYSTEM_SECTION_TITLE_CLASS}>회사 파일 검토</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
            고객사가 환경설정에서 업로드한 사업자등록증을 시스템관리자가 승인하거나 반려합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone={pendingCount > 0 ? "warning" : "success"}>검토 대기 {pendingCount}</AdminStatusBadge>
          <AdminStatusBadge tone="success">승인 {approvedCount}</AdminStatusBadge>
          <AdminStatusBadge tone="danger">반려 {rejectedCount}</AdminStatusBadge>
          <AdminButton onClick={() => void loadCompanyFiles()} disabled={loadStatus === "loading"} variant="secondary">
            {loadStatus === "loading" ? "불러오는 중" : "새로고침"}
          </AdminButton>
        </div>
      </div>

      {loadError ? <div className={`mt-4 ${SYSTEM_DANGER_BOX_CLASS}`}>{loadError}</div> : null}
      {actionError ? <div className={`mt-4 ${SYSTEM_DANGER_BOX_CLASS}`}>{actionError}</div> : null}
      {actionMessage ? <div className={`mt-4 ${SYSTEM_SUCCESS_BOX_CLASS}`}>{actionMessage}</div> : null}

      <div className="mt-5 grid gap-3">
        {loadStatus === "loading" ? (
          <div className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4 text-sm text-[var(--pbp-text-muted)]">
            회사 파일 검토 목록을 불러오는 중입니다.
          </div>
        ) : null}

        {loadStatus !== "loading" && files.length === 0 ? (
          <div className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4 text-sm text-[var(--pbp-text-muted)]">
            현재 검토할 사업자등록증 파일이 없습니다.
          </div>
        ) : null}

        {files.map((file) => {
          const status = reviewStatusCopy[file.reviewStatus] || reviewStatusCopy.pending_review;
          const canReview = file.reviewStatus === "pending_review";
          const isReviewing = reviewingFileId === file.id;

          return (
            <article key={file.id} className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-bold ${SYSTEM_VALUE_TEXT_CLASS}`}>{file.companyName}</p>
                    <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>
                  </div>
                  <p className={SYSTEM_SMALL_TEXT_CLASS}>{file.businessName || "사업자명 미입력"}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-[var(--pbp-text-primary)]">{file.originalName}</p>
                  <p className={SYSTEM_SMALL_TEXT_CLASS}>
                    {formatFileSize(file.sizeBytes)} · {file.mimeType || "파일 형식 미확인"} · 등록일 {formatDateTime(file.createdAt)}
                  </p>
                  <p className="mt-1 break-all text-xs text-[var(--pbp-text-faint)]">{file.storageKey}</p>
                  {file.reviewerName || file.reviewedAt ? (
                    <p className={SYSTEM_SMALL_TEXT_CLASS}>
                      검토자 {file.reviewerName || "-"} · 검토일 {formatDateTime(file.reviewedAt)}
                    </p>
                  ) : null}
                  {file.rejectionReason ? (
                    <p className="mt-2 rounded-2xl bg-[var(--pbp-danger-soft)] px-3 py-2 text-xs leading-5 text-[var(--pbp-danger)]">
                      반려 사유: {file.rejectionReason}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 lg:min-w-[18rem]">
                  <textarea
                    value={rejectionReasons[file.id] ?? ""}
                    onChange={(event) => setRejectionReasons((current) => ({ ...current, [file.id]: event.target.value }))}
                    placeholder="반려 시 고객사에 전달할 사유를 입력합니다."
                    disabled={!canReview || isReviewing}
                    rows={3}
                    className="min-h-[5rem] rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm text-[var(--pbp-text-primary)] placeholder:text-[var(--pbp-text-faint)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <AdminButton
                      onClick={() => void submitReview(file.id, "approved")}
                      disabled={!canReview || isReviewing}
                      variant="primary"
                    >
                      {isReviewing ? "처리 중" : "승인"}
                    </AdminButton>
                    <AdminButton
                      onClick={() => void submitReview(file.id, "rejected")}
                      disabled={!canReview || isReviewing}
                      variant="danger"
                    >
                      {isReviewing ? "처리 중" : "반려"}
                    </AdminButton>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className={`mt-4 ${SYSTEM_SMALL_TEXT_CLASS}`}>
        파일 원본 열람은 단기 signed URL 또는 R2 Worker download proxy 기준으로 후속 버전에서 분리 연결합니다.
      </p>
    </section>
  );
}
