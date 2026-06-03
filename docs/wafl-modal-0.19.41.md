# WAFL Modal 공통화 1차 (0.19.41)

## 목적

관리자 화면과 작업지시서 화면에서 쓰는 모달 shell, header, body, footer, section, action button의 기본 규격을 WAFL 공통 UI 기준으로 정리한다.

## 반영 범위

- `components/common/ui/WaflModal.tsx` 추가
- 공통 modal shell의 header/body/footer class helper 분리
- `aria-describedby` 연결 보강
- close button을 WAFL Button 기반으로 전환
- 일반 작업 모달 footer action button을 WAFL Button 기반으로 전환
- `AdminModalSection`을 `WaflModalSection` adapter로 전환
- `AdminModalFooterActions` 모바일 버튼 stacking 기준 보정

## 유지한 것

- 배경 스크롤 차단 유지
- focus trap 유지
- Escape 닫기 유지
- 모바일 전체 높이 sheet 패턴 유지
- PC 중앙 modal 패턴 유지
- DB/API/R2/첨부/메모/휴지통 흐름 변경 없음

## 다음 단계

0.19.42에서 table 세부 밀도와 compact 전환 기준을 추가로 점검한다.
