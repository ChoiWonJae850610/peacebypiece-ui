# Pending Tests — 0.23.48

- npm run audit:wafl-mutations
- node scripts/audit-wafl-mutations.mjs --strict 실행 시 전체 엔터티 캐스팅 후보 때문에 의도대로 실패하는지
- npm run audit:wafl-ui
- npm run build
- 감사 스크립트가 app/components/features/lib만 검사하는지
- 초기 조회 void 호출과 이벤트 경계 void 호출이 별도 분류되는지
- 직접 POST/PUT/PATCH/DELETE fetch 후보가 출력되는지
- WorkOrder/MaterialOrder 전체 엔터티 캐스팅 후보가 high-risk로 출력되는지
- 감사 스크립트 추가가 런타임 번들 및 화면 동작에 영향을 주지 않는지
- package.json과 package-lock.json이 동기화되어 있는지
## 0.23.50 작업지시서·발주서 비동기 mutation 정리
- 발주서 자재 종류 변경과 확인 모달 저장
- 발주서 상태 변경 및 검증 모달 확인
- 품목 수량·단가 수정, 추가, 제거
- 모바일 하단 도구에서 자재 추가
- 작업지시서 공장 전달사항 조회와 저장


## 0.23.51 WAFL mutation runtime contract

- 동일 resource/document lockKey의 중복 저장이 차단되는지 확인
- 같은 sequenceKey에서 이전 응답이 최신 상태를 덮지 않는지 확인
- onSuccess는 최신 revision에서만 실행되는지 확인
- mutation 실패 시 변경 범위 rollback 확인
- API 오류의 message/code/status 정규화 확인
- rollback/onError 실패가 최초 mutation 오류를 대체하지 않는지 확인
- 작업지시서 feedback wrapper의 rollback/getErrorMessage 옵션 확인

## 0.23.52 WAFL 전 화면 적용 감사

- 자동 감사의 영역별 native control/direct fetch 수치가 실제 파일 변경 후 감소하는지 확인
- `/worker` 화면 PC/태블릿/모바일 밀도 비교
- 시스템관리자 기준정보 화면의 WAFL 입력·버튼·모달 전환 확인
- 시스템관리자 승인/반려/재입력 저장 lifecycle 확인
- 관리자 통계 API 실패 시 mock 수치 대신 오류/빈 상태 표시 확인
- 개인설정 탈퇴 확인을 WAFL ConfirmModal로 전환한 뒤 동작 확인

## 0.23.53 /worker 화면 밀도 축소

- [ ] PC 1440px 이상에서 좌측 목록 폭이 과도하지 않고 중앙 상세가 충분히 넓은지 확인
- [ ] PC 1280px 전후에서 3패널 잘림·겹침·가로 스크롤 이상 여부 확인
- [ ] 작업지시서 목록 카드가 축소되어도 제목·상태·카테고리·업체·납기 정보를 구분할 수 있는지 확인
- [ ] 긴 작업지시서명·카테고리·업체명이 말줄임 처리되는지 확인
- [ ] 카드 우측 점 3개 메뉴와 잠금 placeholder의 터치·클릭 영역이 유지되는지 확인
- [ ] 태블릿 가로 2~3패널과 태블릿 세로 목록 드로어 정책이 유지되는지 확인
- [ ] 모바일 목록 드로어에서 카드 높이와 터치 영역이 지나치게 작지 않은지 확인

## 0.23.54 시스템관리자 데이터·mutation 1차
- 회사 계정 요청 승인·반려·검토 중 처리 시 중복 클릭 차단
- 회사 계정 요청 API 실패 시 기존 목록 상태 유지 및 오류 표시
- 회사 파일 승인·반려 시 같은 파일 중복 처리 차단
- 회사 파일 반려 사유 필수 검증
- 최신 mutation 응답만 목록에 반영되는지 확인
- 네트워크 오류와 비정상 JSON 응답의 공통 오류 처리
- 새로고침 실패 시 mock 데이터로 대체되지 않는지 확인

## 0.23.55 시스템관리자 회사 승인·초대 WAFL UI/mutation 정리

- 고객사 관리자 초대 링크 생성·취소가 중복 클릭 없이 한 번만 처리되는지 확인
- 초대 목록 조회 실패 시 기존 오류 상태가 표시되고 mock 데이터로 대체되지 않는지 확인
- 고객사 가입 승인·거절·재입력 요청이 동일 요청 단위로 잠기는지 확인
- 승인·거절·재입력 처리 후 가입 요청 목록과 초대 목록이 함께 갱신되는지 확인
- API 실패 시 선택된 고객사와 기존 목록이 유지되는지 확인
- 전달 대상 입력이 WAFL Input 높이·곡률·포커스 정책을 따르는지 확인
- 고객사 상태 필터가 WAFL Button으로 동일한 높이와 선택 상태를 표시하는지 확인
- 고객사 상세 모달이 WAFL Modal header/body/footer 구조와 Shadow 0 정책을 따르는지 확인
- 모바일에서 상세 모달이 화면을 벗어나지 않고 본문만 스크롤되는지 확인
