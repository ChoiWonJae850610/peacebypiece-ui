---
title: WAFL A-TYPE Implementation Architecture
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---


# 11. 구현 아키텍처

## 1. 기본 원칙

```txt
- 기능 로직과 UI 스타일을 분리한다.
- primitive component와 domain component를 분리한다.
- API route는 thin하게 유지한다.
- business logic은 lib/features/domain layer에 둔다.
- device별 layout은 분리하되 domain hook은 공유한다.
```

## 2. 권장 폴더 구조

```txt
components/
  admin/
    common/
    layout/
  wafl/
    primitives/
    layout/
    feedback/
    mobile/
    tablet/

features/
  workorders/
    components/
    hooks/
    utils/
  partners/
  storage/
  stats/
  members/
  invitations/
  settings/
  errors/

lib/
  theme/
  i18n/
  permissions/
  design/
  device/
  utils/
```

현재는 `components/admin`과 `lib/theme` 기반을 유지한다.

## 3. Device Layer

```txt
lib/device/
  getDeviceKind.ts
  useDeviceKind.ts
  deviceTypes.ts
```

## 4. Component Layer

Primitive:

```txt
Button / Input / Card / Badge / Modal
```

Domain:

```txt
WorkOrderListCard / PartnerTable / StorageUsageCard / MemberInviteForm
```

규칙:

```txt
Primitive에는 도메인 로직 금지
Domain component에는 API 호출 직접 금지
Action hook에서 이벤트 처리
```

## 5. Event / Action Layer

```txt
Page → Domain Component → Hook → Action → API/Repository
```

## 6. Drawing Feature

권장 구조:

```txt
features/workorders/drawing/
  DrawingCanvas.tsx
  DrawingToolbar.tsx
  useDrawingDraft.ts
  useDrawingOrientationGuard.ts
  drawingStorage.ts
```

규칙:

```txt
- 태블릿 가로에서는 입력 차단
- 태블릿 세로에서 사용 허용
- 회전 시 draft 보존
- 저장 전 이탈 시 dirty confirm
```

## 7. 금지

```txt
- 화면 컴포넌트에서 fetch 직접 남발
- UI 컴포넌트 안에서 DB/API 호출
- 상태 문자열 직접 비교
- hardcoded Korean text 추가
- raw color class 추가
- device별 분기를 CSS만으로 억지 처리
```

---

## 10. Share / PDF Architecture

### 10.1 폴더 구조

```txt
features/share/
  shareTypes.ts
  shareMessages.ts
  useWebShare.ts
  copyToClipboard.ts
  ShareButton.tsx
  CopyLinkButton.tsx
  ShareFallbackDialog.tsx
  QrPreview.tsx

features/workorders/pdf/
  generateWorkOrderPdf.ts
  createWorkOrderPdfLink.ts
  WorkOrderPdfShareButton.tsx
  WorkOrderPdfDownloadButton.tsx

features/invitations/share/
  InviteShareResult.tsx
  InviteShareButton.tsx
  InviteQrPreview.tsx
```

### 10.2 Web Share Hook

```ts
export type SharePayload = {
  title: string;
  text?: string;
  url?: string;
  files?: File[];
};

export async function shareOrCopy(payload: SharePayload) {
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share(payload);
    return { result: "shared" as const };
  }

  if (payload.url) {
    await navigator.clipboard.writeText(payload.url);
    return { result: "copied" as const };
  }

  return { result: "unsupported" as const };
}
```

### 10.3 PDF 공유 우선순위

```txt
1. PDF 링크 공유
2. PDF 파일 공유 가능 시 파일 공유
3. 링크 복사
4. PDF 다운로드
```

### 10.4 유료 API 보류

```txt
SMS API
Kakao 알림톡/친구톡/비즈메시지 API
이메일 발송 API
```

위 기능은 초기 A-TYPE UI 전환 범위에서 제외한다.  
필요할 경우 share strategy 문서에 따라 2단계 기능으로 별도 설계한다.
