Version :
0.12.77

Summary :
통계정보 번역 함수 타입 오류 수정

Description :
/admin/stats 통계정보 화면에서 presentation 유틸이 허용하는 optional fallback 타입과 컴포넌트 내부 번역 함수 타입이 맞지 않아 발생한 TypeScript 빌드 오류를 수정했다. 화면 동작과 통계 계산 로직은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- components/admin/dashboard/AdminStatsDashboard.tsx

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
