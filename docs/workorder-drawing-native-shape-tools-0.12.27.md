# 0.12.27 작업지시서 native drawing 표시 도구 강화

## 목적

작업지시서 디자인 첨부 영역의 기본 `직접 그리기` 기능을 텍스트 입력 없이 표시 도구 중심으로 강화한다.

`tldraw` 기반 `고급 그리기`는 development runtimeMode와 feature flag가 켜졌을 때만 비교 테스트용으로 유지한다. 운영 기본 기능은 native canvas로 유지한다.

## 반영 범위

- native canvas 직접 그리기 모달
- i18n 문구
- 앱 버전

## 추가 도구

- 직선
- 화살표
- 사각형
- 원/타원
- 실선
- 점선

## 유지 도구

- 펜
- 지우개
- 색상 선택
- 굵기 선택
- undo
- redo
- 전체 지우기
- PNG 디자인 첨부 저장

## 제외한 기능

이번 버전에서는 텍스트 삽입을 추가하지 않는다.

텍스트 삽입은 다음 항목이 함께 필요해져 범위가 커진다.

- 모바일 키보드 처리
- 입력 위치와 커서 처리
- 글자 크기/색상 선택
- 저장 전 재편집 가능 여부
- 캔버스 DPI와 렌더링 품질

작업지시서 현장 표시 용도에서는 우선 직선, 화살표, 도형, 점선이 더 실용적이다.

## 동작 방식

### 자유펜/지우개

기존 방식과 동일하게 pointer move 중 실시간으로 캔버스에 stroke를 그린다.

### 직선/화살표/사각형/원·타원

1. pointer down 시점의 캔버스를 `ImageData`로 보관한다.
2. pointer move 중 보관한 캔버스를 복원한 뒤 preview shape를 다시 그린다.
3. pointer up 시 현재 preview를 확정하고 history snapshot에 저장한다.

이 방식은 별도 객체 모델 없이도 간단한 표시 도구를 제공할 수 있다.

## history 정책

- shape 확정 후 기존 snapshot history에 저장한다.
- undo / redo는 기존 snapshot 기반 구조를 그대로 사용한다.
- 전체 지우기 후 undo로 이전 상태를 복원할 수 있다.

## 저장 정책

- 저장 방식은 기존과 동일하다.
- canvas를 PNG `File`로 변환한다.
- 기존 디자인 첨부 업로드 흐름을 재사용한다.
- DB schema, R2 API, 첨부 API는 변경하지 않는다.

## 테스트 항목

- 펜 입력
- 지우개 입력
- 색상 변경 후 펜/도형 반영
- 굵기 변경 후 펜/도형 반영
- 직선 preview와 확정
- 화살표 preview와 확정
- 사각형 preview와 확정
- 원/타원 preview와 확정
- 실선/점선 전환
- undo / redo
- 전체 지우기 후 undo
- 저장 후 디자인 첨부 목록 표시
- tablet pointer 입력
- mobile 가로 모드에서 shape 도구 사용성

## 다음 후보

0.12.28 이후 native canvas 강화 후보는 다음 중 선택한다.

- 도형 도구 UX 보정
- 저장 전 미리보기
- 배경 템플릿
- 이미지 위에 표시하기
- tldraw PoC 유지 여부 판단
