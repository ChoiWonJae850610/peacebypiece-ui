Version :
0.9.160

Summary :
직접 그리기 준비 모달과 드래그 업로드 빌드 오류 보완

Description :
작업지시서 디자인 영역의 직접 그리기 메뉴를 준비 안내 모달로 연결했다. useWorkOrderAttachments의 업로드 scope 타입을 design 또는 attachment로 좁혀 memo scope가 첨부 업로드 action flow에 들어가지 않도록 보완했다. 실제 drawing library, canvas 저장, R2 저장 연결은 추가하지 않았고 기존 파일 선택 업로드와 드래그 업로드 흐름은 유지했다.

수정 파일 목록 :
- components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx
- lib/hooks/workorder/useWorkOrderAttachments.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/workorder-drawing-placeholder-0.9.160.md

삭제 파일 목록 :
없음
