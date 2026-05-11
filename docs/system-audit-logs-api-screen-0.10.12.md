# System Audit Logs API and Screen Connection — 0.10.12

## 목표

0.10.12는 시스템관리자 감사 로그의 읽기 API와 `/system/audit-logs` 화면 목록을 연결한다. 실제 도메인 이벤트 쓰기 지점은 아직 연결하지 않는다.

## 추가된 API

- `GET /api/system/audit-logs`

지원 query parameter:

- `query`: 화면용 검색어. repository 조회 후 selector에서 적용한다.
- `companyId`: 고객사 ID 필터.
- `targetType`: `company`, `member`, `invitation`, `plan`, `storage`, `work_order`, `file`, `memo`, `settings`, `auth`, `system`.
- `eventType`: `domain.action` 형식 이벤트 코드.
- `severity`: `low`, `medium`, `high`, `critical`.
- `limit`: 1~500 범위. 기본값 200.

응답 형태:

```json
{
  "ok": true,
  "records": [],
  "viewModels": [],
  "count": 0
}
```

## 계층 구조

- `app/api/system/audit-logs/route.ts`: thin route.
- `lib/system/audit/api/routeHandlers.ts`: request parsing, response formatting.
- `lib/system/audit/repository.ts`: audit_logs DB 조회.
- `lib/system/audit/selectors.ts`: 검색어와 화면 필터.
- `lib/system/audit/actionFlow.ts`: 화면용 view model 변환.
- `components/system/audit/SystemAuditLogsDesignPage.tsx`: 목록, 검색, 대상 유형, 심각도 필터 표시.

## 테스트 기준

현재 0.10.12는 쓰기 지점이 연결되지 않았으므로 빈 목록이 정상일 수 있다. SQL로 테스트 데이터를 수동 삽입하면 `/system/audit-logs`와 `GET /api/system/audit-logs`에서 표시되어야 한다.

## 보류

- 도메인 actionFlow의 `createSystemAuditLogSafe` 호출 연결.
- 시스템관리자 권한 검증.
- 기간 필터와 페이지네이션.
- CSV export 또는 상세 모달.
