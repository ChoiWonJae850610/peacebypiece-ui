---
title: WAFL A-TYPE State Empty Error Rules
version: 0.4
baseline_source: peacebypiece-ui-0.16.47
status: draft-final
updated: 2026-05-18
---


# 06. 상태 / 빈 상태 / 에러 규칙

## 1. UI State

```txt
idle / loading / empty / success / error / forbidden / unauthorized / submitting / saving / disabled / dirty
```

## 2. Loading

```txt
페이지: Skeleton
버튼: loading label + disabled
카드: card skeleton
테이블: row skeleton
```

## 3. Empty

구조:

```txt
Icon / Title / Description / PrimaryAction?
```

문구 예시:

```txt
등록된 협력업체가 없습니다.
업체를 추가하면 작업지시서에서 공장, 원단, 부자재 정보를 선택할 수 있습니다.

생성된 초대가 없습니다.
초대를 생성하면 이 목록에서 링크 복사, 만료일 확인, 취소를 처리할 수 있습니다.

휴지통에 보관 중인 항목이 없습니다.
삭제한 작업지시서, 문서, 디자인, 메모가 있으면 이곳에 표시됩니다.
```

## 4. Error / Forbidden

```txt
403 접근 권한이 없습니다.
현재 계정으로는 이 화면에 접근할 수 없습니다.
[홈으로 이동] [권한 요청]

404 페이지를 찾을 수 없습니다.
요청한 페이지가 이동되었거나 삭제되었을 수 있습니다.
[대시보드로 이동] [이전 페이지]
```

## 5. Invite State

```txt
valid / expired / revoked / alreadyAccepted / pendingApproval / invalid
```

## 6. 작업지시서 직접 그리기 상태

```txt
available / unsupportedOrientation / saving / saved / restoreAvailable / error
```

태블릿 가로 차단 문구:

```txt
디자인 직접 그리기는 태블릿 세로 화면에서 사용할 수 있습니다.
기기를 세로로 돌린 뒤 다시 시도해 주세요.
```

회전 복구 문구:

```txt
이전에 그리던 내용을 복원했습니다.
```
