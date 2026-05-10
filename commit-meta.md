Version :
0.9.224353

Summary :
작업지시서 옵션 반복 호출 캐시 보정

Description :
작업지시서 상세 화면을 선택하거나 재선택할 때 협력업체 작업지시서 옵션 API가 반복 호출되는 문제를 줄이기 위해 옵션 hook에 module cache와 in-flight 공유를 추가했다. 작업지시서 상세 GET과 첨부 파일 요청은 별도 흐름으로 구분하고, 확인 기준을 문서화했다.

수정 파일 목록 :
- lib/hooks/partners/usePartnerWorkOrderOptions.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-detail-cache-and-options-request-0.9.224353.md

삭제 파일 목록 :
없음
