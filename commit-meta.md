Version: 0.9.18

Summary: 다운로드 URL 캐싱 흐름을 중앙화하고 삭제/업로드 후 캐시 무효화 보강

Description:
- APP_VERSION을 0.9.18로 갱신했습니다.
- lib/constants/app.ts는 APP_VERSION 외 export를 유지했습니다.
- R2 다운로드 URL 캐시 타입과 get-or-set 헬퍼를 추가해 캐시 HIT/MISS 처리를 중앙화했습니다.
- 첨부파일 다운로드 API가 중앙 캐시 헬퍼를 통해 Worker signed URL을 재사용하도록 정리했습니다.
- 업로드 완료 시 동일 storageKey에 남아 있을 수 있는 기존 URL 캐시를 무효화했습니다.
- 휴지통 purge worker에서 실제 R2 삭제 후 관련 URL 캐시도 함께 무효화하도록 보강했습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION만 0.9.18로 변경, 나머지 export 유지
- lib/storage/r2/r2UrlCache.ts: R2 URL 캐시 타입, cacheState, getOrSetCachedR2Url 헬퍼, 안전 마진 상수화, 캐시 용량 확대
- app/api/workorders/attachments/file/route.ts: Worker 파일 다운로드 URL 생성 로직을 getOrSetCachedR2Url 기반으로 변경
- app/api/workorders/attachments/upload/complete/route.ts: 업로드 완료 시 storageKey 기준 URL 캐시 무효화 추가
- lib/admin/adminFiles.purgeWorker.ts: 실제 purge 삭제 후 storageKey/thumbnailKey URL 캐시 무효화 추가

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
- 동일 파일 다운로드 요청이 반복될 때 Worker signed URL을 만료 전까지 재사용하도록 중앙 헬퍼로 정리했습니다.
- 캐시 사용 여부는 기존처럼 x-r2-url-cache 헤더에 HIT/MISS로 남도록 유지했습니다.
- 파일이 새로 업로드 완료되거나 purge로 실제 삭제되는 경우 오래된 URL이 남지 않도록 캐시 무효화 지점을 추가했습니다.
- package.json / package-lock.json은 수정하지 않았습니다.

검증:
- node --check cloudflare/r2-upload-worker.js 확인 시도
- npm run build는 이 실행 환경에서 node_modules가 없고 명령 실행이 안정적으로 완료되지 않아 최종 검증하지 못했습니다.
