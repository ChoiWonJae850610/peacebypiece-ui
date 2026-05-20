---
title: WAFL A-TYPE QA Checklist
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---


# 13. QA 체크리스트

## 1. Token

```txt
[ ] raw hex color가 남아 있지 않은가?
[ ] bg-[#...] class가 신규 추가되지 않았는가?
[ ] text-stone, border-stone이 의미 없이 남용되지 않았는가?
[ ] status color는 status token을 사용하는가?
[ ] brand color와 status color를 분리했는가?
```

## 2. Component

```txt
[ ] 버튼은 AdminButton 또는 공통 버튼을 사용하는가?
[ ] 카드는 AdminCard 또는 공통 카드 구조를 사용하는가?
[ ] 상태 배지는 AdminStatusBadge/meta 기반인가?
[ ] Empty state는 AdminEmptyState 기반인가?
[ ] 테이블은 AdminTable 기준을 따르는가?
```

## 3. Layout

```txt
[ ] PC는 sidebar + topbar + page container 구조인가?
[ ] 태블릿 가로는 2열 중심인가?
[ ] 태블릿 세로는 1열 스택인가?
[ ] 모바일은 하단 탭/1열 흐름인가?
[ ] PC의 3열 구조가 모바일/태블릿 세로에 그대로 노출되지 않는가?
```

## 4. WorkOrder Drawing

```txt
[ ] 태블릿 가로에서 직접 그리기 입력이 차단되는가?
[ ] 안내 문구가 표시되는가?
[ ] 태블릿 세로로 전환하면 사용 가능한가?
[ ] 회전해도 그리던 내용이 사라지지 않는가?
[ ] 저장 전 이탈 시 확인이 뜨는가?
```

## 5. i18n / Copy

```txt
[ ] 신규 한국어 문구가 하드코딩되지 않았는가?
[ ] ko/en key가 함께 추가되었는가?
[ ] status label이 meta/i18n에서 오는가?
[ ] 오류 문구가 짧고 다음 행동을 제공하는가?
[ ] “연결 첨부” 같은 고객에게 어색한 표현이 없는가?
```

## 6. Modal / Sheet

```txt
[ ] 배경 스크롤이 차단되는가?
[ ] focus trap이 동작하는가?
[ ] Escape 닫기가 되는가?
[ ] 모바일/태블릿 세로에서는 시트형 UX를 사용하는가?
[ ] dirty form 닫기 확인이 있는가?
```

## 7. Permission

```txt
[ ] 권한 없는 메뉴가 숨김/disabled/403 중 정책에 맞게 처리되는가?
[ ] 고객사 관리자가 멤버 권한 모달 대상에서 제외되는가?
[ ] 작업지시서 권한이 조회/작성/발주 가능 기준으로 표현되는가?
[ ] 직접 URL 접근 시 403 처리가 되는가?
```

## 8. Responsive / Device

```txt
[ ] pc/tablet-landscape/tablet-portrait/mobile 판정이 명확한가?
[ ] orientation change 시 state가 보존되는가?
[ ] 모바일에서 테이블이 카드 리스트로 변환되는가?
[ ] tablet portrait 규칙이 별도 문서화되어 있는가?
```

---

## 11. Share / PDF / PWA

```txt
[ ] 초대 생성 후 공유하기 버튼이 보이는가?
[ ] Web Share API 지원 기기에서 공유창이 열리는가?
[ ] 미지원 기기에서 링크 복사 fallback이 동작하는가?
[ ] 초대 링크 QR 보기 기능이 제공되는가?
[ ] 작업지시서 PDF 링크 공유가 가능한가?
[ ] PDF 생성 실패 시 error state가 표시되는가?
[ ] PDF 파일 공유가 불가능할 때 다운로드/링크 복사 fallback이 있는가?
[ ] 자동 카카오톡/SMS 발송처럼 오해되는 문구가 없는가?
[ ] 유료 메시지 API를 사용하지 않는 초기 정책이 문서와 일치하는가?
[ ] PWA/앱 개발이 현재 UI 통일 범위와 섞이지 않았는가?
```
