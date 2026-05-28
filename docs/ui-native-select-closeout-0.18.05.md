# 0.18.05 native select 운영 화면 전환 마감 점검

## 목적

0.18.05는 운영 화면 기준으로 남아 있던 native `<select>` 사용처를 AppSelect 기반으로 전환하는 마감 점검 버전이다.

## 전환한 영역

- 작업지시서 생성 모달 카테고리 선택
  - 1차 카테고리
  - 2차 카테고리
  - 3차 카테고리
- 작업지시서 협력업체/공장/자재처 등록 모달
  - 등록 유형 선택
- 시스템 고객사 관리
  - 초대 링크 전달 방식
  - 초대 만료 기간
- 원단·부자재 기준정보 관리 화면
  - 구분
  - 단위
  - 상태

## 유지한 영역

다음 영역은 의도적으로 전환하지 않았다.

- `app/dev/test-console/DevTestConsoleClient.tsx`
  - 개발/테스트 콘솔 전용 화면이다.
  - 운영 UI 제품화 대상에서 제외한다.

- `components/workorder/detail/shared/detailEditorShared.tsx`
  - 인라인 편집용 select이다.
  - `autoFocus`, `onBlur commit`, 키보드 처리, 취소 처리와 결합되어 있다.
  - 단순 AppSelect 치환 시 편집 확정/취소 UX가 바뀔 수 있으므로 별도 `AppInlineSelectEditor` 설계 후 전환한다.

## 영향 범위

- DB/API/R2/첨부/메모/상태 전환 흐름 변경 없음
- 저장 로직 변경 없음
- 선택 UI wrapper만 변경

## 다음 권장 작업

0.18.06에서는 `AppInlineSelectEditor` 후보를 설계하고, `detailEditorShared.tsx`의 인라인 편집 select를 전환할지 판단한다.
