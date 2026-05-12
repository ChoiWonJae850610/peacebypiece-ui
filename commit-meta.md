Version :
0.10.92

Summary :
작업지시서 payload 의존도 진단과 정규화 계획 추가

Description :
작업지시서 payload 제거 전 의존 지점을 문서화하고 현재 DB에서 payload 사용량, key 빈도, 정규 컬럼 불일치 후보를 확인할 수 있는 진단 SQL을 추가했다. APP_VERSION도 0.10.92로 갱신했다.

수정 파일 목록 :
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-payload-normalization-audit-0.10.92.md
- db/schema/workorder_payload_audit_0_10_92.sql

삭제 파일 목록 :
없음
