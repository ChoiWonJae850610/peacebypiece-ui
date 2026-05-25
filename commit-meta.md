Version : 0.16.61
Summary : 작업지시서 category id resolver 분리 및 0.16.60 빌드 오류 보정
Description : 0.16.60 빌드에서 누락된 resolveCategoryIdsForDb 참조 오류를 보정하고, 작업지시서 저장 시 카테고리 ID를 해석하는 DB resolver를 별도 repository 파일로 분리했습니다. APP_VERSION을 0.16.61로 올렸으며 package.json/package-lock.json과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/repository/dbWorkOrderRepository.ts
추가 파일 목록 :
- lib/workorder/repository/dbWorkOrderCategoryResolvers.ts
삭제 파일 목록 :
- 없음
