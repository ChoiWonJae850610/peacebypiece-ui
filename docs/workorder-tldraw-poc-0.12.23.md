# 0.12.23 작업지시서 고급 그리기 tldraw PoC

## 목적

기존 native canvas 직접 그리기 기능은 유지하면서, 디자이너가 더 자주 요구할 수 있는 도형, 텍스트, 선택/이동, 확대/축소 기능을 tldraw 기반 고급 그리기로 비교 테스트한다.

## 진입 위치

- 작업지시서 디자인 패널
- `···` 메뉴
- `직접 그리기`: 기존 native canvas 모달
- `고급 그리기`: tldraw 기반 PoC 모달

## 이번 버전 범위

- `tldraw` dependency 추가
- tldraw CSS를 root layout에서 로드
- 고급 그리기 모달 추가
- tldraw canvas를 modal 내부에 배치
- 현재 페이지의 shape를 PNG로 export
- export된 PNG `File`을 기존 디자인 첨부 업로드 흐름에 전달

## 저장 방식

이번 버전도 별도 DB table을 만들지 않는다.

```text
고급 그리기
→ tldraw Editor.toImage()
→ PNG Blob
→ File(workorder-advanced-drawing-*.png)
→ 기존 디자인 첨부 업로드 흐름
→ 기존 R2 저장/미리보기 흐름
```

## 테스트 기준

### PC

- `···` 메뉴에 `직접 그리기`, `고급 그리기`가 함께 보이는지 확인
- 고급 그리기 모달이 열리는지 확인
- 펜, 도형, 텍스트 입력 확인
- 선택/이동/확대/축소 확인
- 디자인으로 저장 후 기존 디자인 첨부 목록에 PNG가 추가되는지 확인

### Tablet

- 펜 입력 지연 여부 확인
- 손가락 pan/zoom과 펜 drawing 충돌 여부 확인
- toolbar가 너무 작거나 모달 상단 닫기 버튼과 충돌하지 않는지 확인
- 저장 후 R2/미리보기 흐름 확인

### Mobile

- 고급 그리기는 사용 가능 여부만 확인
- 작은 화면에서 불편하면 mobile은 native canvas 중심으로 남기고 고급 그리기는 tablet/PC 권장으로 유지

## 주의

`tldraw`는 production license 정책을 별도로 확인해야 한다. 현재는 기능 PoC이며, 실제 서비스 배포 전에는 라이선스/요금/사용 조건 확인이 필요하다.

## 다음 판단

- native canvas가 충분하면 고급 그리기는 숨기거나 dev/test 기능으로 유지
- 디자이너가 도형/텍스트/선택/이동을 자주 원하면 tldraw를 공식 고급 도구로 유지
- tldraw가 tablet/mobile에서 무겁거나 UI가 과하면 native canvas를 강화하는 방향으로 회귀
