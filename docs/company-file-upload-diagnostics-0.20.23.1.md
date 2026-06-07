# 회사 파일 업로드 실패 메시지 개선 및 R2 진단 로그 보강 — 0.20.23.1

## 목적

대표 이미지와 사업자등록증 업로드 실패 시 내부 오류 코드가 고객 화면에 그대로 노출되지 않도록 정리한다. 실제 R2 Worker PUT 실패 원인은 개발자가 브라우저 콘솔과 서버 로그에서 확인할 수 있게 한다.

## 적용 범위

- 환경설정 > 회사 정보 > 대표 이미지 업로드
- 환경설정 > 회사 정보 > 사업자등록증 업로드
- `/api/admin/company-files/upload` 업로드 준비 API
- 브라우저의 R2 Worker PUT 업로드 단계

## 사용자 메시지 기준

- `COMPANY_FILE_R2_UPLOAD_FAILED`는 사용자에게 직접 노출하지 않는다.
- R2 PUT 실패 시 화면에는 `파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.`를 표시한다.
- 저장공간 초과와 저장공간 조회 실패는 기존 안내 문구를 유지한다.
- 업로드 저장소 설정 누락은 `파일 업로드 저장소 설정이 완료되지 않았습니다. 시스템관리자에게 문의해 주세요.`로 안내한다.

## 진단 로그 기준

서버는 업로드 준비 단계에서 다음 정보를 로그로 남긴다.

- requestId
- companyId
- fileType
- mimeType
- sizeBytes
- storageKey
- workerHost
- expiresInSeconds

브라우저는 R2 PUT 실패 시 다음 정보를 `console.warn`으로 남긴다.

- step: `r2-put`
- HTTP status/statusText
- responseBody 일부
- fileType
- originalName
- mimeType
- sizeBytes
- storageKey
- requestId
- uploadTarget

## 보안 기준

- R2 Worker secret, token, 실제 서명값은 로그에 남기지 않는다.
- upload URL 전체 query string은 콘솔 로그에 남기지 않는다.
- DB 메타데이터 저장은 R2 PUT 성공 후에만 진행한다.

## 후속 확인

실제 업로드 실패 시 브라우저 Network 탭에서 R2 Worker PUT 요청의 status를 확인한다.

- 401/403: secret/signature/권한 문제 가능성
- 404/405: Worker route 또는 method 문제 가능성
- CORS error: Worker CORS 응답 헤더 문제 가능성
- 500: Worker 내부 또는 R2 binding 문제 가능성
