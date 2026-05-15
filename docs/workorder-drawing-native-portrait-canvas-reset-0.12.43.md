# 0.12.43 직접 그리기 portrait-first canvas 잔여 정사각형 보정

## 목적

0.12.42 적용 후 tablet 환경에서 흰색 canvas 내부에 이전 정사각형 기준의 경계가 남고, 해당 정사각형 영역 안에서만 그려지는 것처럼 보이는 문제를 보정한다.

## 변경 내용

- 실제 기기 orientation lock API는 사용하지 않는다.
- touch tablet-like viewport에서는 상위 variant가 desktop으로 들어와도 직접 그리기 canvas는 tablet portrait 작업판 기준을 사용한다.
- 기존 data URL 단독 draft snapshot은 legacy draft로 보고 복원하지 않는다.
- draft snapshot은 width/height metadata와 함께 저장한다.
- 현재 canvas 원본 크기와 draft metadata가 일치할 때만 복원한다.
- snapshot 복원 시 contain/center scaling을 사용하지 않고 같은 canvas 크기에만 1:1 복원한다.
- 이전 900x900 또는 landscape draft가 portrait editor 안쪽에 정사각형처럼 남는 상황을 방지한다.

## 유지한 범위

- 기존 PNG 저장/R2 디자인 첨부 업로드 흐름 유지
- backdrop click 닫기 방지 유지
- 뒤로가기 방지 유지
- 확대/축소, 손바닥 이동, 이미지 위에 그리기, 기본 의류 템플릿 제외 유지
- tldraw 고급 그리기 development flag 정책 유지
