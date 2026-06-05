# 0.19.10 WAFL Toast 단일 규격 확정

## 목적

0.19.09에서 floating toast 공통화를 시작했지만, 일부 화면에서 여전히 사각형 action result가 남고 화면별 메시지 체감이 달랐다. 0.19.10은 “WAFL에서 action result toast는 하나”라는 기준을 먼저 고정한다.

## 단일 규격

- 공통 진입점: `components/common/ToastMessage.tsx`
- 전역 host: `components/common/AppToaster.tsx`
- 시각 token: `app/globals.css`의 `pbp-toast`, `pbp-toast--floating`, `pbp-toast__mark`
- tone: `info`, `success`, `warning`, `danger`
- 위치: 앱 전체 fixed layer, PC 기준 우측 하단
- 모바일: 좌우 여백을 유지하며 화면 폭 안에서 표시

## 역할 분리

### Floating toast

사용한다.

- 저장 완료
- 삭제/복원/비우기 결과
- 멤버 초대/복사/취소/권한 저장 결과
- 협력업체 저장 결과
- 원단·부자재 발주 상태 변경 결과
- 시스템 저장소 purge 처리 결과

### Inline feedback

유지한다.

- 화면 로드 실패
- 권한 없음
- 입력값 검증 오류
- 모달 내부 form error
- 빈 목록 안내
- 상세 원인을 보여야 하는 오류 박스

## 이번 적용 범위

- `components/common/ToastMessage.tsx`: sonner 기본 success/error UI 대신 WAFL custom toast markup 사용
- `components/common/AppToaster.tsx`: toast host를 앱 전체 우측 하단 fixed layer 기준으로 정리
- `app/globals.css`: WAFL toast radius, shadow, border, tone 배경, 모바일 폭 보정
- `components/admin/settings/AdminSettingsHub.tsx`: 환경설정 계정 요청 결과를 floating toast로 분리
- `components/admin/settings/AdminCompanySettingsForm.tsx`: 환경설정 저장 성공/실패를 floating toast로 추가하고, 실패 상세 inline feedback은 유지
- `components/admin/PartnerMasterSection.tsx`, `components/admin/partnerMaster/usePartnerMasterController.ts`: 협력업체 저장 성공/실패 toast 추가
- `components/system/storage/SystemStoragePurgeCandidatesClient.tsx`: purge 결과 사각형 inline result를 floating toast로 전환

## 변경하지 않은 것

- DB schema
- API route
- R2 Worker flow
- 첨부/메모/휴지통/purge 실제 처리 로직
- 작업지시서 상태 머신
- 원단·부자재 계산식
- 권한 판정 로직

## 테스트 기준

### 확인할 것

- 저장소관리: 삭제/복원/비우기/새로고침 결과가 같은 WAFL toast로 표시되는지
- 작업지시서: 저장/검토요청/발주요청/첨부/메모 결과가 같은 WAFL toast로 표시되는지
- 원단·부자재 발주: 상태 변경 성공/실패가 같은 WAFL toast로 표시되는지
- 멤버관리: 초대 생성/복사/취소/권한 저장 결과가 같은 WAFL toast로 표시되는지
- 협력업체관리: 업체 저장 성공/실패가 같은 WAFL toast로 표시되는지
- 환경설정: 회사 설정 저장과 계정 요청 접수 결과가 같은 WAFL toast로 표시되는지
- 시스템 저장소 사용량: purge 결과가 같은 WAFL toast로 표시되는지

### 바뀌면 안 되는 것

- 각 action의 실제 저장/삭제/복원/승인/상태 변경 결과
- confirm 모달 동작
- 파일/용량 계산
- 작업지시서/원단·부자재 발주 계산과 상태 흐름
- 멤버 권한 저장과 초대 상태
