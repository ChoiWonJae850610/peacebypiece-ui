Version: 0.9.7

Summary: 관리자 점검 상태 표시 presentation 정리

Description: 관리자 완료 검증과 데이터 연결 점검 패널의 상태 라벨/톤/클래스 조합 로직을 중앙 presentation 함수로 이동하고 APP_VERSION을 0.9.7로 갱신함.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.9.7로 동기화.
- lib/admin/dbCompletionAudit.ts: DB 점검 상태/데이터 기준/저장소 모드 표시 로직을 중앙 presentation 함수로 정리.
- components/admin/dashboard/AdminDbConnectionAuditPanel.tsx: 컴포넌트 내부 상태 클래스 분기와 저장소 모드 라벨 분기를 제거하고 중앙 presentation 함수를 사용.
- lib/admin/completionAudit.ts: 관리자 완료 검증 상태 라벨/스타일 presentation 매핑 추가.
- components/admin/dashboard/AdminCompletionAuditPanel.tsx: 완료 검증 패널의 상태 클래스 분기를 중앙 presentation 함수로 대체.

작업 상세 내용:
- 관리자 점검 패널에서 상태값별 className을 tsx 내부 if 분기로 처리하던 부분을 제거.
- DB 연결 점검의 repository mode 라벨을 lib/admin/dbCompletionAudit.ts로 이동.
- 완료 검증 상태의 라벨과 뱃지 스타일을 lib/admin/completionAudit.ts에서 함께 반환하도록 정리.
- 신규 파일 추가 없이 기존 admin audit 계층 안에서 처리.
- package.json / package-lock.json은 수정하지 않음.
