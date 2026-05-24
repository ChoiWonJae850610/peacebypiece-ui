Version : 0.16.36
Summary : 작업지시서 옵션 상수 순환 참조 제거
Description : workorderOptions가 materialDefaults를 import하던 경로를 제거하여 workorderOptions, materialDefaults, detailSanitizers 사이에 남아 있던 순환 참조를 차단했습니다. APP_VERSION을 0.16.36으로 갱신했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/constants/workorderOptions.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
