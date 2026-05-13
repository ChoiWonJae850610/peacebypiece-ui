Version : 0.11.69
Summary : 작업지시서 업무화면 client navigation 로딩 고착 수정
Description : /admin에서 /worker로 client-side 이동할 때 작업지시서 상세 hydrate가 mounted guard에 막혀 가운데 상세 패널과 우측 첨부·메모 패널이 loading 상태로 고착될 수 있는 문제를 수정했습니다. useWorkOrderCoreState의 mounted ref를 effect setup에서 다시 true로 복구하도록 보정하고, /worker page가 workOrderId query를 initialWorkOrderId로 전달하도록 보강했습니다. 검토·발주 대기 개별 작업지시서 열기 링크도 /worker?workOrderId=... 경로로 정리했습니다.
수정 파일 목록 :
- app/worker/page.tsx
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/admin/adminOperations.repository.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-client-navigation-loading-0.11.69.md
삭제 파일 목록 :
