Version :
0.11.98

Summary :
모바일 모달 입력 포커스 이탈 보정

Description :
공통 모달 환경 hook에서 onClose 참조 변경으로 effect가 재등록되며 입력 중 포커스가 이탈할 수 있는 문제를 보정했다. onClose는 ref로 최신 값을 유지하고 모달 focus trap과 스크롤 잠금 effect는 open 상태 기준으로 안정적으로 유지되도록 수정했다.

수정 파일 목록 :
- lib/constants/app.ts
- components/common/modal/modalUtils.ts

추가 파일 목록 :
- docs/workorder-mobile-modal-search-focus-0.11.98.md

삭제 파일 목록 :
없음
