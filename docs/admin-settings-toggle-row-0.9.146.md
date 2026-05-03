# 0.9.146 관리자 설정 모달 토글/행 컴포넌트 통일 2차

## 목적

0.9.145에서 일부 관리자 설정 모달의 사용/미사용 토글을 공통 `AdminUsageToggle`로 정리했지만, 로그 이벤트 모달은 기존 ON/OFF pill 버튼 형태가 남아 있었다. 이 버전에서는 로그 이벤트 모달을 공통 토글 기준으로 맞추고, 라벨과 토글이 함께 배치되는 행 구조를 `AdminSettingsToggleRow`로 분리했다.

## 적용 범위

- 로그 이벤트 모달
- 알림 정책 모달
- 파일 정책 모달의 휴지통 용량 포함 항목

## 추가 공통 컴포넌트

### `components/admin/common/AdminSettingsToggleRow.tsx`

역할:

- 설정 항목 라벨 표시
- 선택적 보조 설명 표시
- 오른쪽 사용/미사용 토글 배치
- disabled 상태 표시
- row 높이, 간격, border, 배경 기준 통일

내부 토글은 기존 `AdminUsageToggle`을 사용한다. 따라서 토글 자체의 크기와 active/inactive 문구 기준은 계속 한 곳에서 관리된다.

## 유지한 범위

생산품 유형/단위 표준 모달은 목록 선택과 토글이 결합된 구조이므로, 이번 버전에서는 row 전체를 강제로 바꾸지 않았다. 대신 기존처럼 `AdminUsageToggle`의 `inline` variant를 사용해 토글 크기 기준만 공유한다.

## 금지한 변경

- 저장 API 응답 포맷 변경 없음
- DB schema 변경 없음
- package 파일 변경 없음
- R2/첨부/메모/purge 기능 변경 없음
- 대규모 UI 재디자인 없음

## 다음 점검 후보

- 모달 하단 버튼 높이와 정렬 기준 통일
- 관리자 모달의 section padding/card border 기준 정리
- 생산품 유형/단위 표준의 추가 입력 row 높이 통일
