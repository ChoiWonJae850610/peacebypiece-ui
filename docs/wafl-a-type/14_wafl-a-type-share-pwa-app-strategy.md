---
title: WAFL A-TYPE Share PWA App Strategy
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---

# 14. 공유 / PWA / 앱 전략

## 1. 문서 목적

이 문서는 WAFL에서 앱 개발 전 단계에 모바일/태블릿 웹만으로 처리할 수 있는 공유 기능과, PWA 및 네이티브 앱 도입 기준을 정의한다.

핵심 결론:

```txt
초기에는 앱을 만들지 않는다.
모바일/태블릿 웹에서 기기 기본 공유창을 사용한다.
초대는 링크 공유를 기본으로 한다.
작업지시서는 PDF 링크 공유를 기본으로 한다.
유료 SMS/Kakao 자동 발송 API는 2단계로 보류한다.
```

---

## 2. 기본 공유 정책

### 2.1 Web Share 우선

모바일/태블릿 브라우저에서 `navigator.share()`를 우선 사용한다.

공유 대상은 사용자의 기기 환경에 따라 달라진다.

```txt
카카오톡
문자
메일
라인
메신저
메모
파일앱
복사
```

WAFL은 특정 앱으로 직접 자동 발송했다고 표현하지 않는다.  
사용자가 공유창에서 앱을 선택해 직접 전송하는 구조다.

---

## 3. 초대 링크 공유

### 3.1 기본 흐름

```txt
관리자가 초대 생성
→ 서버에서 invite token/link 생성
→ 초대 결과 카드 표시
→ 공유하기 / 링크 복사 / QR 보기 제공
→ 사용자가 카카오톡, 문자, 메일 등으로 직접 전송
```

### 3.2 UI 구성

```txt
초대 생성 완료
초대 대상
초대 링크
초대 만료일
[공유하기]
[링크 복사]
[QR 보기]
```

### 3.3 공유 메시지

```txt
WAFL 멤버 초대

아래 링크에서 WAFL 참여 요청을 진행해 주세요.
{inviteUrl}
```

고객사 관리자 초대:

```txt
WAFL 고객사 관리자 초대

아래 링크에서 고객사 관리자 등록을 진행해 주세요.
{inviteUrl}
```

### 3.4 Fallback

공유 API 미지원:

```txt
이 기기에서는 공유창을 열 수 없습니다.
링크를 복사해 카카오톡, 문자, 메일로 직접 보내 주세요.
[링크 복사]
```

---

## 4. 작업지시서 PDF 공유

### 4.1 기본 정책

작업지시서는 PDF 파일 자체보다 **PDF 링크 공유**를 기본으로 한다.

우선순위:

```txt
1. PDF 링크 공유
2. PDF 파일 공유 가능 시 파일 공유
3. 링크 복사
4. PDF 다운로드
```

### 4.2 기본 흐름

```txt
작업지시서 상세
→ PDF 생성
→ R2 또는 서버 저장소에 PDF 저장
→ 공유용 URL 생성
→ 공유하기 / 링크 복사 / 다운로드 제공
```

### 4.3 공유 메시지

```txt
WAFL 작업지시서
{workOrderTitle}

아래 링크에서 작업지시서를 확인해 주세요.
{pdfUrl}
```

### 4.4 PDF 생성 상태

```txt
idle
generating
generated
sharing
copySuccess
downloadReady
failed
expired
```

### 4.5 권한

공유 링크는 권한 정책을 따라야 한다.

선택지:

```txt
A. 로그인 필요 링크
B. 만료 시간이 있는 공개 링크
C. 수신자 제한 링크
```

초기 추천:

```txt
로그인 필요 링크를 기본으로 한다.
외부 협력업체 공유가 필요하면 만료 시간이 있는 공유 링크를 별도로 설계한다.
```

---

## 5. QR 코드 정책

QR은 초대와 작업지시서 공유 보조 수단이다.

대상:

```txt
멤버 초대 링크
고객사 관리자 초대 링크
작업지시서 공유 링크
```

규칙:

```txt
- QR은 링크와 함께 표시한다.
- QR만 단독 제공하지 않는다.
- 만료일이 있는 링크는 QR 화면에도 만료일을 표시한다.
- QR 이미지를 저장/공유할 수 있게 할 수 있다.
```

---

## 6. 유료 메시지 API 보류

초기에는 다음을 사용하지 않는다.

```txt
SMS 자동 발송 API
Kakao 알림톡/친구톡/비즈메시지 API
이메일 자동 발송 API
```

도입 조건:

```txt
- 관리자가 수동 공유를 불편해함
- 초대 발송 추적이 필요함
- 수신 성공/실패 상태가 필요함
- 대량 초대가 필요함
- 비용을 감당할 유료 고객이 있음
```

도입 전 문서화 필요:

```txt
비용
발송 제한
템플릿 심사
개인정보 처리
수신거부/동의
발송 이력 저장
```

---

## 7. PWA 전략

PWA는 앱 개발 전 단계의 실험 수단이다.

### 7.1 PWA로 가능한 것

```txt
홈 화면 추가
앱처럼 실행
아이콘 제공
일부 캐시
오프라인 fallback
```

### 7.2 PWA 우선 적용 후보

```txt
모바일 작업지시서 목록
작업지시서 상세 보기
초대 링크 진입
공유 기능
최근 작업 캐시
```

### 7.3 PWA 보류 조건

```txt
권한/푸시/오프라인 동기화가 복잡할 때
iOS/Android 차이가 커질 때
현장 사용자에게 설치 설명이 어려울 때
```

---

## 8. 네이티브 앱 도입 조건

앱은 다음 조건이 명확할 때 시작한다.

```txt
푸시 알림이 제품 핵심 기능이 됨
오프라인 입력/동기화가 필요함
카메라/파일 권한을 더 깊게 써야 함
작업자가 매일 반복적으로 모바일에서 사용함
스토어 검색/설치가 영업상 필요함
```

초기 앱 MVP 범위:

```txt
로그인
내 작업지시서 목록
작업지시서 상세
사진/파일 업로드
메모 작성
상태 변경 일부
푸시 알림
```

앱 1차에서 제외:

```txt
시스템 관리자
통계 전체
저장소 관리 전체
멤버관리 전체
환경설정 전체
복잡한 권한 설정
```

---

## 9. 구현 구조

### 9.1 공유 공통 유틸

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

### 9.2 컴포넌트

```txt
ShareButton
CopyLinkButton
QrPreview
ShareFallbackDialog
InviteShareResult
WorkOrderPdfShareButton
WorkOrderPdfDownloadButton
```

### 9.3 폴더

```txt
features/share/
features/invitations/share/
features/workorders/pdf/
```

---

## 10. QA

```txt
[ ] 공유 API 지원 기기에서 공유창이 열리는가?
[ ] 미지원 기기에서 링크 복사가 되는가?
[ ] QR 코드가 링크와 동일한 URL을 가리키는가?
[ ] 초대 만료일이 공유 결과 화면에 표시되는가?
[ ] PDF 생성 실패 시 오류 문구가 표시되는가?
[ ] PDF 링크 권한 정책이 명확한가?
[ ] 자동 발송으로 오해되는 문구가 없는가?
[ ] 유료 API 없이도 기본 초대/공유 흐름이 가능한가?
```
