Version :
0.9.179

Summary :
저장소 휴지통 처리 결과 토스트 문구와 표시 방식을 통일

Description :
저장소 관리 화면의 우하단 결과 알림을 작업지시서 화면과 같은 하단 중앙 토스트 방식으로 교체했다. 휴지통 복구/영구삭제 결과 문구에서 내부 DB 처리 표현을 제거하고, 파일/작업지시서 처리 수량 중심의 사용자용 문구로 정리했다. 저장소 화면 통계 차트 고도화는 추후 차트 라이브러리 도입 단계로 분리한다.

수정 파일 목록 :
- app/admin/files/page.tsx
- lib/admin/adminFiles.actionFlow.ts
- lib/admin/adminFiles.serverActions.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
