# WorkOrder Drawing Native Zoom Hit Area Fix — 0.12.34

## 목적

0.12.33에서 확대/축소 상태의 좌표 변환을 보정했지만, 50% 축소 시 실제 입력 영역과 시각적으로 보이는 캔버스 영역이 계속 어긋나는 문제가 남아 있었다.

## 수정 방향

- pointer event를 바깥 wrapper가 아니라 시각적으로 변환된 canvas stage에서 직접 받도록 정리했다.
- stage 자체에 zoom/pan transform을 적용하고, canvas는 stage 내부에서 `h-full w-full`로 유지했다.
- stage 밖의 배경은 theme surface로 보이게 하여 실제 흰색 canvas와 비입력 영역을 구분했다.
- cursor도 stage 안에서만 바뀌도록 하여, 입력되지 않는 영역이 drawing 영역처럼 보이지 않게 했다.

## 기대 동작

- 50% 축소 시 중앙에 줄어든 흰색 canvas 영역만 drawing hit area가 된다.
- 흰색 canvas의 구석 영역에서는 펜/지우개/도형 입력이 정상 동작한다.
- canvas 밖 surface 영역에서는 drawing cursor가 보이지 않는다.
- 저장 PNG는 기존과 동일하게 전체 원본 canvas 기준으로 생성된다.

## 변경하지 않은 사항

- DB schema 변경 없음
- R2 / 첨부 API 변경 없음
- tldraw 개발 플래그 정책 변경 없음
