---
title: WAFL A-TYPE i18n Copy Rules
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---


# 10. i18n / 카피 규칙

## 1. 기본 원칙

```txt
- UI 문구 하드코딩 금지
- ko/en resource 유지
- status label은 meta 또는 i18n key로 관리
- empty/error/toast/confirm 문구는 공통 패턴 사용
```

## 2. Key Naming

```txt
domain.screen.section.element.state
```

예시:

```txt
admin.members.invite.title
admin.members.invite.actions.create
admin.members.invite.empty.title
workorders.status.reviewRequested
storage.trash.actions.empty
errors.404.title
auth.login.googleButton
```

## 3. 로그인 문구

현재 로그인 문구는 조정 가능 상태다.

권장 방향:

```txt
- 패션 생산 관리 도구임을 드러낸다.
- 과한 감성 표현을 피한다.
- WAFL이 업무 흐름을 연결한다는 메시지를 사용한다.
```

문구 후보:

```txt
업무를 연결하고, 협업을 완성하세요.
작업 배정부터 결과 관리까지 WAFL이 연결합니다.

패션 생산의 흐름을 한 화면에서 관리하세요.
협력업체, 파일, 작업 상태를 WAFL에서 함께 관리합니다.

Google 계정으로 계속하세요.
초대받았거나 승인된 사용자만 로그인할 수 있습니다.
```

피할 문구:

```txt
오늘도 함께 멋진 제품을 만들어가요.
```

## 4. Empty / Error / Toast / Confirm

Empty:

```txt
{대상}이/가 없습니다.
{대상을 추가/생성하면 할 수 있는 일}
[주요 액션]
```

Error:

```txt
문제 제목
짧은 이유
다음 행동
```

Toast:

```txt
저장했습니다.
초대 링크를 보냈습니다.
복원했습니다.
```

Confirm:

```txt
정말 삭제하시겠습니까?
삭제 후에는 휴지통에서 복원할 수 있습니다.
[취소] [삭제]
```

## 5. 고객 표시 문구 주의

피할 표현:

```txt
연결 첨부
```

권장:

```txt
작업지시서 n건과 문서 n개, 디자인 n개, 메모 n개를 복원했습니다.
```

---

## 9. 공유 문구 규칙

### 9.1 초대 링크 공유

i18n key 예시:

```txt
share.invite.member.title
share.invite.member.text
share.invite.customerAdmin.title
share.invite.customerAdmin.text
share.invite.copySuccess
share.invite.shareUnsupported
```

한국어 문구:

```txt
WAFL 멤버 초대
아래 링크에서 WAFL 참여 요청을 진행해 주세요.

초대 링크를 복사했습니다.
카카오톡, 문자, 메일에 붙여넣어 전송할 수 있습니다.

이 기기에서는 공유창을 열 수 없습니다.
링크를 복사해 직접 전송해 주세요.
```

### 9.2 작업지시서 PDF 공유

i18n key 예시:

```txt
share.workOrderPdf.title
share.workOrderPdf.text
share.workOrderPdf.copySuccess
share.workOrderPdf.generateFailed
share.workOrderPdf.download
```

한국어 문구:

```txt
WAFL 작업지시서
아래 링크에서 작업지시서를 확인해 주세요.

PDF 링크를 복사했습니다.
카카오톡, 문자, 메일에 붙여넣어 전송할 수 있습니다.

PDF를 생성하지 못했습니다.
잠시 후 다시 시도해 주세요.
```

### 9.3 금지 문구

```txt
카카오톡으로 자동 발송했습니다.
문자로 자동 발송했습니다.
```

초기 정책에서는 실제 자동 발송이 아니므로 위 문구를 사용하지 않는다.

권장:

```txt
공유창을 열었습니다.
공유할 앱을 선택해 직접 전송해 주세요.
```
