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
