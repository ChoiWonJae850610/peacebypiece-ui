# 64. 작업지시서 생산구성 활성 입력값 검토요청 전 반영 보강

## 기준 버전

- 기준: 0.15.40
- 결과: 0.15.41

## 문제

디자이너가 작업지시서 생산구성에서 공장, 원단, 부자재, 외주공정을 입력한 뒤 검토 요청을 누르면 일부 row는 저장되지만 수량과 단가가 0으로 남는 상황이 확인되었다.

증상은 특히 숫자 input에서 발생할 수 있다. 선택형 값은 select change/blur에서 즉시 commit되지만, 숫자 input은 사용자가 값을 입력한 직후 바로 검토 요청 버튼을 누르면 blur commit과 workflow action 실행 순서가 겹칠 수 있다. 이 경우 workflow action은 아직 이전 workOrder state를 기준으로 state patch를 만들 수 있다.

## 수정 방향

- 작업지시서 상세 container에서 workflow action 실행 전 현재 활성 편집 셀을 먼저 commit한다.
- 임시저장 버튼도 같은 방식으로 활성 편집 셀을 먼저 commit한다.
- pending edit을 flush한 경우 React state 반영 순서를 확보하기 위해 action/save callback을 다음 tick에 실행한다.
- 생산구성 DB schema, API 응답 포맷, R2, 권한, 세션 흐름은 변경하지 않는다.

## 적용 파일

- `lib/hooks/workorder/useWorkOrderDetailEditor.ts`
- `components/workorder/detail/WorkOrderDetailContainer.tsx`

## 확인 시나리오

1. 디자이너로 작업지시서 생성
2. 공장 2개 이상 입력
3. 원단 2개 이상 입력
4. 부자재 2개 이상 입력
5. 외주공정 1개 이상 입력
6. 원단/부자재/외주 수량과 단가를 입력한 직후 별도 blur 없이 검토 요청 클릭
7. 관리자 계정으로 같은 작업지시서 확인

## 기대 결과

- 공장 row가 유지된다.
- 원단 row의 수량과 단가가 유지된다.
- 부자재 row의 수량과 단가가 유지된다.
- 외주공정 row의 수량과 단가가 유지된다.
- 검토 요청 상태가 정상 반영된다.
