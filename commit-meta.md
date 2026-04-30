Version : 0.9.30 → 0.9.31

Summary : 산출물 메타 문서 규칙 복구 및 버전 동기화

Description :
- 모바일 최소 응답 모드에서 누락되거나 잘못 작성된 commit-meta.md 산출물 규칙을 복구했습니다.
- commit-meta.md의 Version, Summary, Description, 수정 파일 목록 등 파싱 대상 항목에 콜론(:) 토큰을 포함하도록 형식을 고정했습니다.
- 이전 작업 내용으로 남아 있던 0.9.28 → 0.9.29 메타 정보를 0.9.30 → 0.9.31 기준으로 교체했습니다.
- APP_VERSION 값을 0.9.31로 동기화했습니다.
- npm 빌드는 요청에 따라 실행하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION 값을 0.9.31로 갱신했습니다.
- commit-meta.md : 모바일 최소 응답 모드용 산출물 메타 문서를 콜론 기반 파싱 형식으로 재작성했습니다.

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- commit-meta.md의 모든 주요 섹션명을 `키 : 값` 또는 `키 :` 형식으로 통일했습니다.
- Summary, Description, 수정 파일 목록, 추가 파일 목록, 삭제 파일 목록 항목을 반드시 포함하도록 정리했습니다.
- 상세 작업 내용은 zip 내부 commit-meta.md에서 확인 가능하도록 유지했습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.

검증 :
- npm 빌드는 사용자 요청에 따라 실행하지 않았습니다.
- commit-meta.md 파일 존재 여부와 콜론 기반 섹션 형식을 확인했습니다.
- APP_VERSION 값이 0.9.31로 반영된 것을 확인했습니다.
