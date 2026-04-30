Version : 0.9.31 → 0.9.32

Summary : 협력업체 UI 잔여 정리 및 산출물 메타 규칙 유지

Description :
- 협력업체 관리 화면 상단의 외주공정관리 버튼을 제거했습니다.
- 협력업체 관리 도움말 문장을 운영 화면 기준으로 정리하고 한국어/영어 i18n 문구를 동기화했습니다.
- 협력업체 검색, 유형, 사용상태 필터 그룹의 가로 간격을 보강했습니다.
- 업체명, 담당자명, 이메일, 메모, 외주공정명에 입력 최대 길이 기준을 추가했습니다.
- 협력업체 목록과 외주공정 선택 목록에서 긴 텍스트가 줄바꿈으로 깨지지 않도록 말줄임 처리를 보강했습니다.
- APP_VERSION 값을 0.9.32로 동기화했습니다.
- npm 빌드는 사용자 요청에 따라 실행하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts : APP_VERSION 값을 0.9.32로 갱신했습니다.
- components/admin/PartnerMasterSection.tsx : 협력업체 화면에서 외주공정관리 모달 진입 버튼과 관련 렌더링 연결을 제거했습니다.
- components/admin/partnerMaster/PartnerMasterHeader.tsx : 외주공정관리 버튼을 제거하고 협력업체 추가 버튼만 유지했습니다.
- components/admin/partnerMaster/PartnerMasterFilters.tsx : 검색, 유형, 사용상태 필터 그룹 사이 간격을 보강했습니다.
- components/admin/partnerMaster/PartnerMasterFormModal.tsx : 업체명, 담당자명, 이메일, 메모 입력 최대 길이를 적용하고 외주공정 라벨 말줄임 표시를 보강했습니다.
- components/admin/partnerMaster/PartnerProcessManagementModal.tsx : 외주공정명 입력 최대 길이와 목록 말줄임 표시 기준을 적용했습니다.
- lib/admin/partner/constants.ts : 협력업체 입력 필드 최대 길이 상수를 추가했습니다.
- lib/admin/partner/draft.ts : 협력업체 저장 전 텍스트 필드를 최대 길이 기준으로 정규화하도록 보강했습니다.
- lib/admin/partner/processes.ts : 외주공정명 정규화와 신규 공정 생성 시 최대 길이 기준을 적용했습니다.
- lib/i18n/ko/admin.ts : 협력업체 관리 도움말 문구를 운영용 문장으로 교체했습니다.
- lib/i18n/en/admin.ts : 협력업체 관리 도움말 문구의 영어 문장을 동기화했습니다.
- commit-meta.md : 모바일 최소 응답 모드용 산출물 메타 문서를 0.9.32 기준으로 작성했습니다.

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- 협력업체 관리 화면의 상단 보조 액션에서 외주공정관리 버튼을 제거해 사용자가 직접 공정관리 화면으로 진입하지 않도록 정리했습니다.
- 외주공정관리 모달 컴포넌트 파일은 삭제하지 않고 유지했습니다. 향후 환경설정 또는 기준관리로 이동할 수 있으므로 UI 진입점만 제거했습니다.
- 협력업체 기본정보 입력 필드와 외주공정명에 최대 길이 기준을 적용해 목록 레이아웃이 긴 텍스트로 깨지지 않도록 했습니다.
- 저장 전 normalize 계층에서도 동일한 최대 길이 기준을 적용해 UI 입력 제한을 우회해도 데이터가 정리되도록 했습니다.
- 협력업체 목록의 기존 ellipsis 구조를 유지하면서 외주공정 선택 목록에도 title과 truncate 처리를 추가했습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.

검증 :
- npm 빌드는 사용자 요청에 따라 실행하지 않았습니다.
- commit-meta.md 파일에 Version, Summary, Description, 수정 파일 목록, 추가 파일 목록, 삭제 파일 목록 항목과 콜론(:) 토큰이 포함된 것을 확인했습니다.
- APP_VERSION 값이 0.9.32로 반영된 것을 확인했습니다.
