Version :
0.13.63

Summary :
고객사 온보딩 모달 파일 업로드 UI 추가

Description :
고객사 온보딩 모달에서 회사 로고와 사업자등록증 파일을 업로드, 교체, 삭제할 수 있도록 UI를 추가했다. 회사 로고 URL 입력은 숨기고, 온보딩 프로필 조회 시 활성 온보딩 파일 metadata를 함께 반환하도록 보강했다. 업로드 중에는 회사 정보 저장 버튼을 비활성화하고 파일 업로드 관련 오류 문구를 i18n으로 표시하도록 정리했다.

수정 파일 목록 :
- components/admin/companies/AdminCompanyOnboardingGate.tsx
- lib/admin/settings/companyOnboardingRepository.ts
- lib/admin/settings/companyOnboardingFileRepository.ts
- lib/admin/settings/companyOnboardingFileService.ts
- lib/admin/settings/companyTypes.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
