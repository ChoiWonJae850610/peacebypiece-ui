---
title: WAFL A-TYPE System Standards Detail Screens
version: 1.0
baseline_source: peacebypiece-ui-0.15.11
status: implemented-1st
updated: 2026-05-20
---

# 32. 시스템관리자 기준정보 세부 화면 A-TYPE 구현 기준

## 1. 대상

```txt
/system/category-rules
/system/standards/processes
/system/standards/units
/system/standards/product-templates
```

## 2. 적용 범위

0.15.11에서는 시스템관리자 기준정보 세부 화면의 외곽 구조를 `SystemShell` 기준으로 정리한다.

```txt
- 기존 page-level main wrapper 제거
- SystemShell을 기준 outer layout으로 사용
- URL 변경 없음
- 저장/수정/활성화 API 변경 없음
- DB schema 변경 없음
```

## 3. 화면별 기준

### 3.1 카테고리 규칙

```txt
- /system/category-rules
- 대형 편집기 영역이 필요하므로 max-width는 넓은 기준을 유지한다.
- header/action 영역은 SystemShell 내부에서 표시한다.
- CategoryRulesManager 내부 편집 로직은 변경하지 않는다.
```

### 3.2 외주공정 유형

```txt
- /system/standards/processes
- 시스템 공통 외주공정 유형 원장 CRUD 화면이다.
- form/list/policy note 구성은 유지한다.
- top-level shell과 주요 surface token만 A-TYPE 기준으로 맞춘다.
```

### 3.3 단위 표준

```txt
- /system/standards/units
- 시스템 공통 단위 표준 원장 CRUD 화면이다.
- count/length/weight 등 단위 분류 기준은 기존 domain 정책을 따른다.
- 고객사별 사용 여부 저장은 후속 기능으로 분리한다.
```

### 3.4 생산품 유형 기본 템플릿

```txt
- /system/standards/product-templates
- 신규 고객사 생성 시 복사할 기본 생산품 유형 템플릿 원장을 관리한다.
- 1차/2차/3차 tree 편집 로직은 유지한다.
- 템플릿 복사 및 고객사별 조정 flow는 후속 기능으로 분리한다.
```

## 4. 금지 사항

```txt
- 기준정보 CRUD API 변경 금지
- system standards repository 변경 금지
- DB schema 변경 금지
- 고객사 기준정보 초기화 flow 변경 금지
- 모바일/태블릿 전용 레이아웃 동시 구현 금지
```

## 5. 후속 작업

```txt
- CategoryRulesManager 내부 card/input token 정리
- standards detail 화면별 form component 분리
- system standards table/list 공통화
- 고객사 기준정보 복사/초기화 flow UI 정리
- 태블릿/모바일에서는 세부 편집 화면을 단계형 또는 sheet형으로 재설계
```
