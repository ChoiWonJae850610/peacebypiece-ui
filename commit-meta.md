Version : 0.9.2230
Summary : 저장소 화면 hydration 오류 수정과 상단 요약 카드 재구성
Description : 저장소 관리 화면에서 row 클릭 처리로 인해 button 안에 button이 중첩되어 발생하던 hydration 오류를 수정하고, 상단 저장소 요약을 요금제/용량 카드, 파일 운영 요약 카드, 파일 유형 도넛 카드로 재구성했다. .tmp 생성물은 Git 추적에서 제외되도록 .gitignore에 추가했다.
수정 파일 목록 :
components/admin/common/AdminTable.tsx
components/admin/files/FileStorageSummary.tsx
lib/constants/app.ts
.gitignore
추가 파일 목록 :
docs/storage-summary-plan-card-0.9.2230.md
삭제 파일 목록 :
없음
