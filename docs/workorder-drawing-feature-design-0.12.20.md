# PeaceByPiece 작업지시서 직접 그리기 기능 설계 — 0.12.20

## 목적

작업지시서의 디자인 첨부 영역에서 사용자가 파일을 업로드하는 것 외에 직접 스케치한 이미지를 첨부할 수 있도록 기능 방향을 정리한다.

이번 버전은 실제 drawing editor 구현이나 package 설치를 하지 않는다. 다음 구현 버전에서 tablet을 켜고 실제 조작 테스트를 하기 전에 라이브러리 후보, 저장 방식, UI 진입 방식, PC/tablet/mobile 지원 범위를 확정하는 설계 문서다.

## 결론

1차 PoC 후보는 `tldraw`로 둔다.

판단 이유:

- React 기반 whiteboard / infinite canvas SDK로 작업지시서 안에 drawing modal을 붙이기 쉽다.
- 기본 툴셋만으로 펜, 도형, 텍스트, 선택, 이동, undo/redo에 가까운 화이트보드 경험을 빠르게 확보할 수 있다.
- editor 내용을 이미지로 export하는 경로가 있다.
- 직접 canvas editor를 처음부터 만드는 것보다 tablet 테스트 속도가 빠르다.

단, 최종 저장은 tldraw 원본 문서가 아니라 **이미지 첨부**를 1차 기준으로 한다.

## 기기별 지원 정책

### Tablet

역할:
- 핵심 사용 기기
- 스타일러스 또는 손가락으로 디자인 스케치 작성
- 작업지시서 디자인 첨부 생성

지원 수준:
- 전체 drawing 기능
- 펜 / 지우개 / 도형 / 텍스트 / undo / redo / 저장
- modal large layout
- 가로 화면 우선

체크 항목:
- 손가락/펜 입력이 body scroll과 충돌하지 않는지
- modal 내부 canvas 높이가 충분한지
- 상단 닫기 버튼이 항상 보이는지
- 저장 버튼이 하단 또는 상단 action 영역에서 명확히 보이는지

### PC

역할:
- 관리자 또는 디자이너가 마우스로 간단한 표시/보완
- 업로드된 디자인 위에 별도 표시를 추가하는 2차 기능 후보

지원 수준:
- tablet과 동일 기능 제공
- 마우스 기반 drawing 허용
- 텍스트/도형 입력은 PC에서 특히 유용할 가능성이 높음

체크 항목:
- pointer 입력이 안정적인지
- modal 폭이 너무 넓거나 좁지 않은지
- keyboard shortcut이 기존 앱 shortcut과 충돌하지 않는지

### Mobile

역할:
- 정밀 디자인 제작이 아니라 간단 스케치/표시
- 현장 확인 중 빠른 메모형 drawing

지원 수준:
- 초기에는 동일 editor를 열되, UX 판단 기준은 제한 모드에 둔다.
- mobile에서 tldraw 전체 UI가 무거우면 2차로 simple canvas mode를 별도 설계한다.

초기 기능 기준:
- 펜
- 지우개
- undo
- 저장
- 닫기

보류 기능:
- 복잡한 도형 편집
- 다중 선택
- 세부 색상 팔레트
- 원본 편집 데이터 재열기

체크 항목:
- 360px / 390px / 430px 폭에서 툴바와 저장 버튼이 겹치지 않는지
- mobile top fixed close button이 유지되는지
- 화면 회전 안내가 필요한지

## 라이브러리 후보 비교

| 후보 | 적합도 | 장점 | 단점 | 판단 |
|---|---:|---|---|---|
| tldraw | 높음 | React SDK, 완성형 whiteboard UI, 이미지 export 경로, tablet PoC 속도 빠름 | 패키지 규모 확인 필요, 기본 UI가 PeaceByPiece 톤과 다를 수 있음 | 1차 PoC 후보 |
| Excalidraw | 중상 | 손그림 감성, React component, export utility | 별도 앱이 들어온 느낌이 강할 수 있음, 의류 작업지시서 UI와 결이 다를 수 있음 | 2차 후보 |
| Fabric.js | 중간 | free drawing과 객체 조작에 강함, export 자유도 높음 | React UI, toolbar, undo/redo를 직접 많이 만들어야 함 | 커스텀 에디터 후보 |
| Konva / react-konva | 중간 | React canvas 구조, mouse/touch free drawing 구현에 적합 | 펜/지우개/도형/텍스트/undo/export UI를 직접 만들어야 함 | mobile simple canvas 후보 |

## 저장 방식

### 1차 저장 방식

직접 그리기 결과는 기존 디자인 첨부와 같은 성격으로 저장한다.

흐름:

1. 사용자가 작업지시서 우측 디자인 패널에서 `직접 그리기`를 누른다.
2. Drawing modal을 연다.
3. 사용자가 스케치한다.
4. 저장 시 editor 내용을 이미지 Blob으로 export한다.
5. 기존 디자인 첨부 업로드 흐름을 재사용한다.
6. R2에는 기존 design attachment와 같은 규칙으로 저장한다.
7. DB에는 기존 디자인 첨부 record로 남긴다.

초기 파일 형식:

- 1순위: PNG
- 2순위: WebP

판단:

- PNG는 호환성이 가장 안전하다.
- WebP는 용량 면에서 유리하지만, 초기에는 브라우저/다운로드/미리보기 안정성을 우선한다.

### 원본 편집 데이터

1차에서는 저장하지 않는다.

보류 이유:

- tldraw 원본 document를 DB/R2에 별도 저장하면 attachment와 drawing source의 관계를 새로 설계해야 한다.
- 작업지시서 디자인 첨부 목적은 “최종 이미지 전달”이 우선이다.
- 원본 재편집 기능은 사용 빈도를 확인한 뒤 2차에서 넣는 것이 안전하다.

2차 후보:

- drawing source JSON을 R2에 별도 저장
- 기존 design attachment record에 source key를 연결
- 또는 별도 `workorder_drawing_sources` 테이블 설계

## DB 설계 판단

이번 기능 1차 구현에서는 DB schema 변경이 필요 없다.

이유:

- 결과물을 기존 디자인 첨부 이미지로 저장하면 기존 첨부/미리보기/삭제/복원/R2 흐름을 재사용할 수 있다.
- drawing source 재편집 기능을 넣지 않으면 별도 테이블이 필요하지 않다.

추후 원본 재편집을 넣는 경우 후보:

```sql
create table workorder_drawing_sources (
  id uuid primary key default gen_random_uuid(),
  workorder_id uuid not null,
  attachment_id uuid not null,
  source_r2_key text not null,
  source_format text not null,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

주의:

- 실제 도입 시 현재 schema 명칭과 full_reset.sql을 반드시 대조한다.
- 현재 개발 중이므로 schema 변경 자체는 가능하지만, 1차 기능에는 과하다.

## UI 진입 방식

### 위치

작업지시서 우측 디자인 패널의 기존 디자인 첨부 영역에 버튼을 추가한다.

권장 버튼:

- `파일 추가`
- `직접 그리기`

영문:

- `Add file`
- `Draw directly`

### Modal 구조

공통 modal shell을 유지한다.

필수 유지:

- focus trap
- Escape 닫기
- 배경 scroll lock
- mobile 상단 고정 닫기 버튼
- theme token 기반 surface / field / action tone

권장 layout:

- 상단: 제목, 기기별 안내, 저장/취소 action
- 중앙: drawing canvas
- 하단 또는 floating: 최소 toolbar

Tablet에서는 canvas 중심, PC에서는 toolbar 가독성, mobile에서는 저장/닫기 접근성을 우선한다.

## i18n 키 후보

추가 후보:

```ts
workorder.drawing.open
workorder.drawing.title
workorder.drawing.description
workorder.drawing.saveAsDesign
workorder.drawing.cancel
workorder.drawing.unsavedConfirmTitle
workorder.drawing.unsavedConfirmDescription
workorder.drawing.mobileHint
workorder.drawing.tabletHint
workorder.drawing.exportFailed
workorder.drawing.uploadFailed
workorder.drawing.emptyCanvas
```

문구 초안:

| key | ko | en |
|---|---|---|
| workorder.drawing.open | 직접 그리기 | Draw directly |
| workorder.drawing.title | 디자인 직접 그리기 | Draw design |
| workorder.drawing.description | 그린 이미지는 디자인 첨부로 저장됩니다. | The drawing will be saved as a design attachment. |
| workorder.drawing.saveAsDesign | 디자인 첨부로 저장 | Save as design |
| workorder.drawing.mobileHint | 모바일에서는 간단 스케치 중심으로 사용하세요. | Use mobile drawing for quick sketches. |

## 구현 단계 제안

### 0.12.20

- 설계 문서 추가
- 라이브러리 후보 비교
- 저장 방식 확정
- PC/tablet/mobile 지원 범위 정리
- 실제 package 설치 없음

### 0.12.21

- `tldraw` package 도입
- drawing modal skeleton 추가
- 디자인 패널에 `직접 그리기` 버튼 추가
- 저장 연결 없이 editor open/close와 tablet touch 테스트

### 0.12.22

- editor export → Blob 변환
- 기존 디자인 첨부 업로드 흐름 연결
- 저장 성공 후 디자인 첨부 목록 refresh
- 실패/빈 canvas/업로드 중 상태 처리

### 0.12.23

- mobile 제한 모드 또는 안내 보정
- theme 5종에서 drawing modal tone 회귀
- tablet 실제 조작 UX 보정

## 구현 시 주의사항

- 기존 디자인 첨부 API/R2 Worker 흐름을 새로 만들지 않는다.
- 정상 동작 중인 첨부/메모/휴지통/purge 흐름을 변경하지 않는다.
- TSX 내부에 업로드 도메인 로직을 과도하게 작성하지 않는다.
- editor export, file naming, upload payload 생성은 별도 util/action layer로 분리한다.
- i18n 없이 하드코딩 문구를 넣지 않는다.
- 상태 의미색과 theme 분위기색을 분리한다.

## Tablet 테스트 체크리스트

- iPad 또는 Android tablet에서 손가락 입력 가능 여부
- 스타일러스 입력 가능 여부
- modal 안에서 canvas 조작 시 body scroll이 움직이지 않는지
- pinch zoom이 앱 scroll과 충돌하지 않는지
- 저장 버튼이 항상 접근 가능한지
- 가로/세로 전환 시 canvas 크기가 깨지지 않는지
- 저장 후 기존 디자인 첨부 목록에 이미지가 나타나는지
- 삭제/복원/휴지통 기존 흐름에 영향이 없는지

## 최종 판단

직접 그리기 기능은 tablet-first로 설계하되, PC에서도 같은 기능을 제공한다. Mobile은 초기에는 접근을 막지 않지만, 정밀 편집 기능이 아니라 간단 스케치/저장 중심으로 판단한다.

1차 구현은 tldraw PoC가 적합하다. 다만 1차 저장은 tldraw 원본이 아니라 기존 디자인 첨부 이미지로 처리한다.
