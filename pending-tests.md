# Pending Tests

## 0.23.67
- dev/test 로그인 fixture로 Functions Responsive E2E 실행
- Desktop·iPad Mini·Galaxy Tab·iPhone·Galaxy S workspace 구조 확인

## 0.23.68
- `npm run test:functions:performance`를 사용자 로컬 환경에서 실행해 p50/p95 보고서 비교
- `npm run test:functions:storage` 실행
- dev/test DB schema mapping 확정 후 seed execute adapter 연결
- test R2 bucket 또는 test prefix 연결 후 실제 객체 합계 reconciliation 실행
- 저장용량 원통형 그래프 0/5/15/30/50/70/90/99/100/초과 상태 확인
- 파일 업로드 후 사용량 증가, 삭제 후 감소 확인
- 회사 A 사용량 변경 시 회사 B 불변 확인
- production runtime에서 seed/cleanup/reconcile 실행 차단 확인

## 0.23.69
- 작업지시서 PDF 생성 가능 단계 확정
- 작업지시서 금액 완전 제외·관리자만 포함·항상 포함 중 정책 확정
- 공급처 발주 PDF 공급처별 분리와 원단·부자재 통합/분리 정책 확정
- 공급처 발주 PDF 단가·금액·부가세 표시 정책 확정
- 회사 로고·직인·서명란·납기일·A4 방향·이미지 배치·누락값 처리 확정
- 정책 확정 후 현재 작업지시서 PDF 금액 출력과 목표 정책 차이 보정
- 최종 mapper·validator·Playwright PDF 생성 및 내용 검증 연결

## 0.23.71
- PowerShell 또는 터미널에서 `npm run test:functions:environment` 실행
- 결과의 `executionReady`와 review/missing 항목 확인
- `WAFL_FUNCTIONS_TEST_R2_PREFIX`를 테스트 전용 prefix로 설정
- DB host/database가 운영용인지 테스트용인지 최종 확인
- 실제 seed/cleanup adapter 연결 전 환경 감사 결과 재검증
- PowerShell 개발·테스트 메뉴에 Functions Environment Safety Audit 추가 필요

## 0.23.72 프로젝트 구조 정리
- `npm run simulator:r2:plan`이 dev/test DB 설정에서 계획만 출력하는지 확인
- `npm run simulator:r2:generate`가 `.tmp/simulator/r2/` 아래에만 파일을 생성하는지 확인
- Playwright 실행 후 결과가 `artifacts/playwright/` 아래에 생성되는지 확인
- functions 리포트가 `artifacts/test-reports/functions/` 아래에 생성되는지 확인
- PowerShell v19.1의 23~25번 메뉴가 정상 실행되는지 확인
- 기존 `playwright-report/`, `test-results/`, `reports/`가 다시 생성되지 않는지 확인

## 0.23.73 Simulator R2 로컬 분리 확인
- PowerShell 24번 Simulator R2 Plan이 DB 없이 성공하고 파일을 생성하지 않는지 확인
- PowerShell 25번 Simulator R2 Local Generate가 `.tmp/simulator/r2/files`와 manifest만 생성하는지 확인
- 실제 R2 객체 및 DB row가 변경되지 않는지 확인
