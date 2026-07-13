import { Linking, Platform } from "react-native";

export type PreviewIdentity = { readonly issuedDocumentNumber: string | null; readonly issued: boolean };
export type PreviewTarget =
  | { readonly kind: "issued-document"; readonly identity: PreviewIdentity }
  | { readonly kind: "dev-realistic-sample" };
export type PreviewOpenResult = { readonly ok: true; readonly url: string } | { readonly ok: false; readonly message: string };

const LOCAL_SAMPLE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function configuredBaseUrl(): string | null {
  const value = process.env.EXPO_PUBLIC_WAFL_WEB_BASE_URL?.trim();
  if (!value) return null;
  try { const url = new URL(value); return new Set(["http:", "https:"]).has(url.protocol) ? url.origin : null; } catch { return null; }
}

function developmentWebFallback(): string | null {
  if (Platform.OS !== "web" || process.env.NODE_ENV === "production" || typeof window === "undefined") return null;
  if (!new Set(["localhost", "127.0.0.1"]).has(window.location.hostname)) return null;
  return `${window.location.protocol}//${window.location.hostname}:3000`;
}

function devRealisticSampleBaseUrl(): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const baseUrl = configuredBaseUrl() ?? developmentWebFallback();
  if (!baseUrl) return null;
  return LOCAL_SAMPLE_HOSTS.has(new URL(baseUrl).hostname) ? baseUrl : null;
}

export function buildIssuedPreviewUrl(identity: PreviewIdentity): PreviewOpenResult {
  if (!identity.issued || !identity.issuedDocumentNumber) return { ok: false, message: "작업지시서가 아직 발행되지 않았습니다." };
  const baseUrl = configuredBaseUrl() ?? developmentWebFallback();
  if (!baseUrl) return { ok: false, message: "웹 미리보기 주소가 설정되지 않았습니다." };
  return { ok: true, url: `${baseUrl}/workspace/documents/${encodeURIComponent(identity.issuedDocumentNumber)}/preview` };
}

export function buildPreviewUrl(target: PreviewTarget): PreviewOpenResult {
  if (target.kind === "issued-document") return buildIssuedPreviewUrl(target.identity);
  const baseUrl = devRealisticSampleBaseUrl();
  if (!baseUrl) return { ok: false, message: "실무 샘플 Preview는 로컬 개발 환경에서만 사용할 수 있습니다." };
  return { ok: true, url: `${baseUrl}/dev/workorder-preview-sample` };
}

export async function openPreviewTarget(previewTarget: PreviewTarget): Promise<PreviewOpenResult> {
  const target = buildPreviewUrl(previewTarget);
  if (!target.ok) return target;
  if (Platform.OS === "web") {
    const opened = window.open(target.url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(target.url);
    return target;
  }
  if (!(await Linking.canOpenURL(target.url))) return { ok: false, message: "Preview 정보를 불러올 수 없습니다." };
  await Linking.openURL(target.url);
  return target;
}

export async function openIssuedPreview(identity: PreviewIdentity): Promise<PreviewOpenResult> {
  return openPreviewTarget({ kind: "issued-document", identity });
}
