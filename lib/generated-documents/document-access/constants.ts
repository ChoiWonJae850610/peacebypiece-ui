export const DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS = 7;
export const DOCUMENT_ACCESS_MAX_EXPIRY_DAYS = 30;
export const DOCUMENT_EMBEDDED_QR_EXPIRY_DAYS = 365;
export const DOCUMENT_MANUAL_SHARE_PURPOSE = "manual_share";
export const DOCUMENT_EMBEDDED_QR_PURPOSE = "embedded_qr";
export const DOCUMENT_VIEWER_SESSION_MAX_AGE_SECONDS = 15 * 60;
export const DOCUMENT_VIEWER_COOKIE = "wafl_document_viewer";
export const DOCUMENT_VIEWER_COOKIE_PATH = "/api/public/document-viewer";

export const DOCUMENT_SHARE_COMMAND_CODE = "work_order.document.share";
export const DOCUMENT_SHARE_ROTATE_COMMAND_CODE = "work_order.document.share.rotate";
export const DOCUMENT_SHARE_EVENT_CODE = "pdf.shared";
export const DOCUMENT_SHARE_VIEWED_EVENT_CODE = "pdf.share_viewed";
export const DOCUMENT_SHARE_REVOKED_EVENT_CODE = "pdf.share_revoked";
export const DOCUMENT_EMBEDDED_QR_COMMAND_CODE = "work_order.document.embedded_qr.create";
export const DOCUMENT_EMBEDDED_QR_CREATED_EVENT_CODE = "pdf.embedded_qr_created";

export const DOCUMENT_ACCESS_RAW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const DOCUMENT_ACCESS_HASH_PATTERN = /^[0-9a-f]{64}$/;
export const DOCUMENT_ACCESS_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
