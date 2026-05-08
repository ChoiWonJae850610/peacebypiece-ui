# 0.9.22408 저장소관리 공통 함수 / 중복 로직 정리

## 목적

저장소/휴지통 선택 처리에서 반복되던 항목 선택, 작업지시서 묶음 제외, 복원/삭제 요청 가능 여부 판정을 `trashPolicy.ts` 공통 함수로 정리한다.

## 변경 내용

- `normalizeAdminTrashWorkOrderIds` 추가
- `createAdminTrashWorkOrderIdSet` 추가
- `selectAdminTrashItemsByIds` 추가
- `selectAdminStandaloneTrashItems` 추가
- `canAdminTrashItemRunAction` 추가
- `selectAdminTrashActionEligibleItems` 추가
- 상단 휴지통 버튼 상태 계산과 actionFlow가 같은 공통 정책 함수를 사용하도록 정리
- 기존 selector/presentation의 `selectAdminTrashItemsByIds`는 공통 정책 함수 wrapper로 축소

## 의도

기존에는 다음 판단이 여러 위치에서 반복되었다.

1. 선택된 휴지통 row 추출
2. 작업지시서가 선택된 경우 묶음 첨부를 파일 단독 처리에서 제외
3. 복원 가능 항목 계산
4. 삭제 요청 가능 항목 계산
5. 휴지통 비우기 가능 개수 계산

이제 이 판단을 `trashPolicy.ts` 기준으로 통일한다.

## DB 변경

없음.

## 확인 항목

1. `/admin/files` 휴지통에서 파일 단독 선택 복원
2. 파일 단독 선택 삭제
3. 작업지시서와 묶음 첨부가 함께 보이는 상태에서 작업지시서 선택 삭제
4. 휴지통 비우기 실행 시 묶음 첨부가 중복/제외 항목으로 잘못 집계되지 않는지 확인
5. `npm run build` 로컬 실행
