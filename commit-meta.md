Version : 0.9.33 → 0.9.34

Summary : 히스토리 운영용 표시 정리 2차

Description :
- 히스토리 상세에서 companyId, partnerId, targetId, userId 같은 내부 식별값이 노출되지 않도록 정리했습니다.
- 히스토리 상세 표시 대상을 운영자가 읽을 수 있는 항목으로 제한했습니다.
- DB 히스토리 조회 시 settings/system 대상 로그를 제외하고, 대상 id를 화면 표시용 label로 사용하지 않도록 정리했습니다.
- 상태 변경 transition과 주요 상세값만 i18n 표시 로직을 거쳐 노출되도록 보강했습니다.
- APP_VERSION 값을 0.9.34로 동기화했습니다.
- npm 빌드는 사용자 요청에 따라 실행하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION 값을 0.9.34로 갱신했습니다.
- lib/admin/history/presentation.ts : 히스토리 상세 라인 필터링, 내부 식별값 숨김, 운영용 상세값 표시 로직을 보강했습니다.
- lib/admin/history/selectors.ts : 히스토리 검색 대상에서 target id 계열 내부값이 검색 노출 경로로 쓰이지 않도록 정리했습니다.
- lib/admin/history/repository.ts : DB 히스토리 조회에서 settings/system 로그를 제외하고 metadata를 운영용 상세값 중심으로 정제하도록 정리했습니다.
- lib/i18n/ko/admin.ts : 히스토리 상세 표시용 추가 라벨의 한국어 문구를 보강했습니다.
- lib/i18n/en/admin.ts : 히스토리 상세 표시용 추가 라벨의 영어 문구를 보강했습니다.
- commit-meta.md : 모바일 최소 응답 모드용 산출물 메타 문서를 0.9.34 기준으로 작성했습니다.

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 기존 히스토리 상세는 metadata 전체를 detailLines로 변환하면서 partnerId, companyId, targetId, updatedSection 같은 내부 운영/개발 값이 화면에 노출될 수 있었습니다.
- presentation 계층에서 표시 가능한 detail label을 allow-list 방식으로 제한하고, id/uuid/json/object 형태의 기술값은 화면에서 제외하도록 보강했습니다.
- repository 계층에서 DB metadata를 변환할 때 운영자에게 의미 있는 name, title, fileName, partnerName, status, from, to, quantity, reason, memo, message 계열만 상세 라인으로 구성하도록 정리했습니다.
- target label은 id가 아니라 title/name/fileName/partnerName/message 기반으로만 구성하도록 변경했습니다.
- 히스토리 검색에서도 target id 자체가 검색 대상이 되지 않도록 제거했습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.

검증 :
- npm 빌드는 사용자 요청에 따라 실행하지 않았습니다.
- commit-meta.md 파일에 Version, Summary, Description, 수정 파일 목록, 추가 파일 목록, 삭제 파일 목록 항목과 콜론(:) 토큰이 포함된 것을 확인했습니다.
- APP_VERSION 값이 0.9.34로 반영된 것을 확인했습니다.
