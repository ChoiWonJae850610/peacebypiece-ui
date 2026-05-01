Version : 0.9.40

Summary : 협력업체 관리 UI 마감 보완

Description :
- 협력업체 유형 라벨을 i18n 기반으로 연결해 영어 전환 시 공장/원단/부자재/외주 버튼과 목록 뱃지가 함께 전환되도록 보완
- 협력업체 필터 옵션과 목록 표시 모델이 정적 한글 라벨에 의존하지 않도록 조정
- 협력업체 추가/수정 모달의 분류 버튼도 i18n 라벨을 사용하도록 정리
- APP_VERSION을 0.9.40으로 동기화

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION을 0.9.40으로 갱신
- components/admin/PartnerMasterSection.tsx : 협력업체 유형 번역 라벨을 목록 view model 생성 흐름에 전달
- components/admin/partnerMaster/PartnerMasterFormModal.tsx : 협력업체 분류 버튼 라벨을 i18n 기반으로 표시
- lib/admin/partner/types.ts : 협력업체 유형 번역 라벨 맵 타입과 badge type 정보를 추가
- lib/admin/partner/filters.ts : 협력업체 필터 옵션을 번역 라벨 기반으로 생성
- lib/admin/partner/presentation.ts : 협력업체 목록 뱃지를 번역 라벨 기반으로 생성
- lib/i18n/ko/admin.ts : 협력업체 유형 라벨 키를 한국어 i18n에 추가
- lib/i18n/en/admin.ts : 협력업체 유형 라벨 키를 영어 i18n에 추가

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 협력업체 관리 화면에서 유형 필터, 목록 뱃지, 추가/수정 모달 분류 버튼이 PARTNER_TYPE_META의 고정 한글 라벨만 사용하던 부분을 i18n 라벨로 보완했다.
- 외주공정 관리 모달 컴포넌트는 환경설정 기준관리 화면에서 재사용 중이므로 삭제하지 않았다.
- npm 빌드는 이번 요청 범위에 포함되지 않아 실행하지 않았다.
