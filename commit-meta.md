Version: 0.9.21

Summary: 관리자 운영 통계 빌드 오류 및 런타임 key 경고 수정

Description:
- adminOperations.repository.ts에서 존재하지 않는 bucket.label 참조를 제거하고 labelKey 기반 i18n 라벨 조회로 복구.
- 운영 통계 차트 데이터 타입에 안정적인 id 필드를 추가.
- AdminOperationsDashboard 목록 렌더링 key를 label 기반에서 id 기반으로 변경해 React unique key 경고를 방지.
- lib/constants/app.ts는 APP_VERSION만 0.9.21로 변경하고 나머지 export는 보존.

수정 파일 목록:
1. lib/admin/adminOperations.repository.ts
   - statusFlow/statusDistribution 데이터 생성 시 labelKey 기반 id와 i18n label을 함께 생성하도록 수정.
   - 빌드 로그의 bucket.label 타입 오류를 제거.
2. lib/admin/adminOperations.types.ts
   - AdminDashboardPoint에 id 필드 추가.
3. components/admin/dashboard/AdminOperationsDashboard.tsx
   - 상태 흐름/상태 분포 map key를 id로 변경.
   - 오늘 체크 목록 key를 label-index 조합으로 보강.
4. lib/constants/app.ts
   - APP_VERSION만 0.9.21로 변경.

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

빌드 확인:
- 이 실행 환경의 압축 해제본에는 node_modules가 없어 npm run build를 직접 완료할 수 없었음.
- 사용자가 첨부한 빌드 로그 기준 오류 지점은 ./lib/admin/adminOperations.repository.ts:138의 bucket.label 참조였고, 해당 참조는 제거됨.

요청사항 대비 미비 정리:
0.9.10~0.9.12 범위:
- 협력업체 도움말/i18n, 외주공정관리 버튼 제거, 검색/유형/사용상태 그룹 간격, ellipsis, 저장소 Tab 구조, 보관기간 명칭, 일부 i18n은 진행된 것으로 보이나 전체 화면 재점검 필요.
- 영어 전환 시 히스토리/통계/저장소/협력업체/대시보드 잔여 미번역 점검 필요.

0.9.13 권장 후속:
- 히스토리 상세에서 companyId, partnerId, raw action, updatedSection 같은 시스템 필드 숨김.
- 관리자용 문장으로 변환하는 presentation/i18n 레이어 정리.
- 히스토리 상단 중복 뱃지 제거 여부 재확인.

0.9.14 권장 후속:
- 통계정보 기간 필터를 지난 7일/15일/30일/월별/누적/직접 선택 구조로 확장.
- 협력업체 분포/파일 사용량 도넛 그래프 구조 실제 반영 여부 점검.
- 입고지연, 불량 발생, 공장별 통계, 제작 분류 1차/2차/3차 통계를 DB 구조와 함께 분리 설계.

0.9.15 권장 후속:
- 대시보드를 작업 중심 화면으로 재구성.
- 검토대기/검수대기/오늘의 할 일/썸네일/작업지시서 이동 흐름을 실제 데이터 기준으로 연결.

0.9.16~0.9.20 권장 후속:
- Worker signed URL 검증, expires 검증, prefix 차단, 업로드/다운로드 검증은 실제 Cloudflare Worker 배포본과 코드가 일치하는지 별도 확인 필요.
- MIME/파일 크기 제한은 클라이언트와 Worker 양쪽에서 재확인 필요.
- 다운로드 URL 캐싱, 썸네일 생성/분리, 업로드→DB→새로고침→다운로드→삭제 전체 플로우는 브라우저와 R2에서 실동작 확인 필요.

다음 작업 권장 버전:
0.9.22 — 관리자 요청사항 실제 반영 여부 재점검 및 미비 목록 기반 1차 보정
