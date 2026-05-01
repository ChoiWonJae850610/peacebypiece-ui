Version : 0.9.39

Summary : 빌드 검증 재시도 기준 정리 및 버전 동기화

Description :
- 0.9.38 기준 소스에서 이전 TypeScript 오류 수정 상태를 재확인
- lib/admin/history/presentation.ts의 null label index 접근 방지 로직 유지 확인
- APP_VERSION 값을 0.9.39로 동기화
- npm ci 의존성 설치가 제한 시간 내 완료되지 않아 next build 최종 완료 로그는 생성하지 못함
- package.json / package-lock.json은 수정하지 않음

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION 0.9.39 반영
- commit-meta.md : 0.9.39 작업 메타 정보와 빌드 검증 시도 결과 기록

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 0.9.38에서 발생했던 lib/admin/history/presentation.ts의 TypeScript null index 오류 수정 상태를 확인함
- displayHistoryDetailLabel 함수가 label null/undefined를 먼저 차단하고 normalizedLabel을 별도 string 값으로 만든 뒤 labelMap에 접근하는 구조임을 확인함
- node_modules가 압축파일에 포함되어 있지 않아 npm run build 실행 전 npm ci가 필요했으나 설치가 제한 시간 내 완료되지 않음
- npm 빌드 최종 통과 여부는 로컬 환경에서 npm ci 완료 후 npm run build로 재확인 필요
