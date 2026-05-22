Version : 0.15.73.4
Summary : 작업지시서 생성 권한 판정 경로 보강
Description : 작업지시서 화면에서 현재 로그인 사용자 프로필과 담당자 목록 프로필이 분리되어 canCreateWorkOrder 판정이 비는 경우를 보정했습니다. currentUser의 permissionCodes가 비어 있으면 같은 userId 또는 companyMemberId로 매칭되는 사용자 목록 프로필의 permissionCodes를 보조 소스로 사용하고, useWorkOrderCoreState 반환 currentUser도 매칭 프로필과 병합되도록 보강했습니다. 생성 권한 기준은 기존처럼 workorder.create로 유지하고 role fallback은 추가하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/hooks/workorder/derived/buildWorkOrderDerivedState.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
