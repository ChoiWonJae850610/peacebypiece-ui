---
title: WAFL A-TYPE Page Templates
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---


# 05. 화면 템플릿 명세

## 1. Admin Dashboard Template

대상:

```txt
/admin /workspace /worker
```

구조:

```txt
PageHeader
PrimaryStatusSection
PendingSummary
QuickNavigationCards
```

## 2. Admin List Page Template

대상:

```txt
협력업체 / 멤버 목록 / 초대 목록 / 시스템 고객사 목록
```

구조:

```txt
PageHeader
SummaryCards
FilterBar
Table 또는 CardList
Pagination
```

## 3. WorkOrder Workspace Template

PC:

```txt
ListPanel / DetailPanel / UtilityPanel
```

태블릿 가로:

```txt
ListColumn / DetailColumn / Utility tabs inside detail
```

태블릿 세로/모바일:

```txt
ListPage / DetailPage / Section Tabs or Accordion
```

## 4. Auth Page Template

PC:

```txt
BrandHero / ActionCard / FooterNotice
```

모바일:

```txt
Logo / BrandMessage / ActionCard / FooterNotice
```

로그인 문구 방향:

```txt
주제: 패션 생산의 업무 흐름을 연결한다.
금지: 과한 감성문구, 디저트/와플 직접 언급
```

문구 후보:

```txt
업무를 연결하고, 협업을 완성하세요.
패션 생산의 흐름을 한 화면에서 관리하세요.
작업 배정부터 결과 관리까지 WAFL이 연결합니다.
```

## 5. Invite Page Template

고객사 관리자 초대 PC/태블릿 가로:

```txt
좌측: 고객사 + 대표 관리자 입력 폼
우측: 발송 대기 / 최근 초대 목록
```

멤버 초대 PC/태블릿 가로:

```txt
좌측: 초대 정보 입력
우측: 초대 대기 목록
```

태블릿 세로/모바일:

```txt
단계형 또는 세로 섹션형
```

## 6. Error Page Template

대상:

```txt
404 / 403 / 500 / inviteExpired / unauthorized / pendingApproval
```

구조:

```txt
AbstractIllustration
ErrorCode 또는 StateLabel
Title
Description
PrimaryAction
SecondaryAction
```

---

## 10. Share / PDF Template

대상:

```txt
멤버 초대 링크 공유
고객사 관리자 초대 링크 공유
작업지시서 PDF 공유
작업지시서 공유용 링크 생성
```

### 10.1 초대 링크 공유 템플릿

구조:

```txt
초대 생성 결과 카드
초대 링크
[공유하기]
[링크 복사]
[QR 보기]
초대 만료일
```

공유 메시지:

```txt
WAFL 멤버 초대
아래 링크에서 WAFL 참여 요청을 진행해 주세요.
{inviteUrl}
```

### 10.2 작업지시서 PDF 공유 템플릿

구조:

```txt
작업지시서 제목
PDF 생성 상태
[PDF 공유]
[링크 복사]
[PDF 다운로드]
공유 이력 또는 최근 생성 시간
```

공유 메시지:

```txt
WAFL 작업지시서
{workOrderTitle}

아래 링크에서 작업지시서를 확인해 주세요.
{pdfUrl}
```

### 10.3 Fallback Dialog

공유 API를 사용할 수 없을 때:

```txt
공유 기능을 사용할 수 없습니다.
아래 링크를 복사해 카카오톡, 문자, 메일로 직접 보내 주세요.
[링크 복사]
[닫기]
```
