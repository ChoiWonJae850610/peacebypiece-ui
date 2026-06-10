# WAFL detail / side panel foundation 0.21.25

## 목적

작업지시서 기준 화면에서 중앙 상세와 우측 패널이 서로 다른 카드 체계처럼 보이지 않도록 `surface`와 `control` primitive를 명확히 분리한다.

## 기준

- 진행 단계 패널: `surface`
- 비용 요약 전체 카드: `surface`
- 비용 총액 / 공정별 row / empty: `control`
- 우측 첨부·디자인·메모 패널 외곽: `surface`
- 첨부 파일 카드 / empty / 안내 / 메모 입력 카드: `control`

## 예외

- 진행 단계 dot, spinner, primary mark처럼 실제 원형 의미가 있는 요소는 원형 유지
- 파일 thumbnail 자체의 crop 영역은 이미지 표시 목적이므로 control shape만 공유하고 내부 이미지는 object-cover 유지

## 다음 단계

0.21.26에서 작업지시서 전체 direct style scan을 수행하고, 남은 직접 radius/background/border/text 조합을 예외와 제거 대상으로 나눈다.
