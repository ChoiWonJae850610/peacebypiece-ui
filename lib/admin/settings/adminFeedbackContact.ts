export const ADMIN_FEEDBACK_CONTACT_EMAIL = "peacebypiece.feedback@example.com";

export type AdminFeedbackRequestType = "improvement" | "bug" | "feature";

export type AdminFeedbackMailtoInput = {
  requestType?: AdminFeedbackRequestType;
  companyName?: string;
};

const FEEDBACK_SUBJECT_BY_TYPE: Record<AdminFeedbackRequestType, string> = {
  improvement: "PeaceByPiece 개선 요청",
  bug: "PeaceByPiece 오류 제보",
  feature: "PeaceByPiece 기능 제안",
};

const FEEDBACK_BODY_TEMPLATE = [
  "요청 유형:",
  "",
  "사용 중인 화면:",
  "",
  "현재 불편한 점 또는 오류 상황:",
  "",
  "원하는 개선 방향:",
  "",
  "첨부/캡처 여부:",
  "",
].join("\n");

export function buildAdminFeedbackMailtoHref({
  requestType = "improvement",
  companyName,
}: AdminFeedbackMailtoInput = {}): string {
  const subjectPrefix = companyName ? `[${companyName}] ` : "";
  const subject = `${subjectPrefix}${FEEDBACK_SUBJECT_BY_TYPE[requestType]}`;
  const query = new URLSearchParams({
    subject,
    body: FEEDBACK_BODY_TEMPLATE,
  });

  return `mailto:${ADMIN_FEEDBACK_CONTACT_EMAIL}?${query.toString()}`;
}
