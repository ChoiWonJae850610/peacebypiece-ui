export type SystemCompanyAccountRequestStatus = "pending" | "reviewing" | "approved" | "rejected" | "cancelled";
export type SystemCompanyAccountRequestType = "company_info_change" | "account_deactivation";

export type SystemCompanyAccountRequestRecord = {
  id: string;
  companyId: string;
  companyName: string;
  businessName: string | null;
  requestedByUserId: string;
  requesterName: string;
  requesterEmail: string | null;
  requestType: SystemCompanyAccountRequestType;
  requestStatus: SystemCompanyAccountRequestStatus;
  requestTitle: string;
  requestMessage: string;
  reviewedByUserId: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SystemCompanyAccountRequestFilter = "all" | SystemCompanyAccountRequestStatus;

export function getSystemCompanyAccountRequestTypeLabel(type: SystemCompanyAccountRequestType): string {
  if (type === "account_deactivation") return "계정 비활성화";
  return "회사 정보 변경";
}

export function getSystemCompanyAccountRequestStatusLabel(status: SystemCompanyAccountRequestStatus): string {
  if (status === "reviewing") return "검토 중";
  if (status === "approved") return "승인됨";
  if (status === "rejected") return "반려됨";
  if (status === "cancelled") return "취소됨";
  return "접수됨";
}

export function getSystemCompanyAccountRequestStatusTone(
  status: SystemCompanyAccountRequestStatus,
): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "reviewing") return "info";
  if (status === "cancelled") return "neutral";
  return "warning";
}

export function formatSystemCompanyAccountRequestDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function matchesSystemCompanyAccountRequestFilter(
  request: SystemCompanyAccountRequestRecord,
  filter: SystemCompanyAccountRequestFilter,
): boolean {
  if (filter === "all") return true;
  return request.requestStatus === filter;
}

export function getSystemCompanyAccountRequestFilterLabel(filter: SystemCompanyAccountRequestFilter): string {
  if (filter === "reviewing") return "검토 중";
  if (filter === "approved") return "승인됨";
  if (filter === "rejected") return "반려됨";
  if (filter === "cancelled") return "취소됨";
  if (filter === "pending") return "접수됨";
  return "전체";
}
