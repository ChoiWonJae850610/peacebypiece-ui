Version :
0.9.193

Summary :
작업지시서 CUD 전역 쓰기 잠금 기준 통합

Description :
작업지시서 화면에서 리오더, 삭제, 메모, 첨부, 대표 이미지, 저장, 발주요청 등 CUD 액션이 실행되는 동안 전역 쓰기 잠금이 실제로 적용되도록 보완했다. 기존 전역 쓰기 잠금 범위는 유지하고, workspace view model이 전달받은 잠금 상태를 사용하도록 수정했다.

수정 파일 목록 :
- components/workorder/WorkOrderWorkspace.tsx
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
