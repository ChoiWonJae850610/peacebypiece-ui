---
title: 작업지시서 서비스 코드 상수와 생산구성 replace allowlist
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: draft
updated: 2026-05-21
---

# 75. 작업지시서 서비스 코드 상수와 생산구성 replace allowlist

## 1. 목적

0.15.50~0.15.51에서 문서로 정리한 작업지시서 서비스 액션 맵을 코드 기준으로 옮기기 시작한다. 목적은 작업지시서 화면의 DB/R2 side effect를 버튼 또는 workflow state 이름이 아니라 `serviceCode` 기준으로 통제하는 것이다.

## 2. 추가 기준

```txt
lib/constants/workorderServiceCodes.ts
```

이 파일은 작업지시서 화면에서 DB/R2에 영향을 줄 수 있는 동작을 다음 분류로 상수화한다.

```txt
WO-Ixxx  즉시 저장
WO-Pxxx  발주정보/생산구성 명시 저장
WO-Fxxx  forward workflow
WO-Bxxx  backward workflow
WO-Mxxx  메모
WO-Axxx  첨부/R2
WO-Sxxx  삭제/복원/purge
WO-Rxxx  리오더
WO-Qxxx  조회
```

## 3. 생산구성 replace allowlist

생산구성 현재값 테이블을 replace 저장할 수 있는 service code는 allowlist로 제한한다.

```txt
허용:
- WO-P001 발주정보 저장
- WO-P002 생산구성 저장
- WO-F001 검토요청
- WO-F002 검토완료
- WO-F003 발주요청
- WO-F004 검수완료
- WO-F005 완료처리
```

반려/취소/되돌리기, 메모, 첨부, 삭제/복원/purge 계열은 생산구성 replace 저장을 허용하지 않는다.

```txt
금지:
- WO-B001 반려
- WO-B002 발주취소
- WO-B003 상태 되돌리기
- WO-Mxxx 메모
- WO-Axxx 첨부/R2
- WO-Sxxx 삭제/복원/purge
```

## 4. 적용 범위

이번 단계에서 코드에 반영한 범위는 다음과 같다.

```txt
- APP_VERSION 및 누락된 app constants 복원
- service code constants 추가
- workflow action → service code 변환 helper 추가
- productionCompositionPolicy가 service code allowlist를 기준으로 판단하도록 변경
- workorderRepositoryMutations의 state patch 저장 payload에 serviceCode 추가
- workflow action 저장 호출부에서 serviceCode 전달
```

## 5. 주의

이번 단계는 1차 도입이다. 모든 DB/R2 mutation에 serviceCode를 붙인 상태는 아니다. 후속 단계에서 메모, 첨부, R2, 삭제/복원/purge 경로까지 serviceCode를 확장한다.

## 6. 다음 단계

```txt
0.15.53
- 메모/첨부/R2 mutation 경로에 serviceCode 확장
- production replace 저장 repository 방어 로직 추가
- 반려/취소성 workflow의 production replace 금지 회귀 테스트
```
