# Version
0.9.3 → 0.9.4

# Summary
관리자 i18n 잔여 문구 정리 2차

# Description
관리자 상단 요약, 공통 카드 라벨, 협력업체 관리 모달과 목록의 직접 표시 문구를 admin i18n 리소스로 이동하고 앱 버전을 0.9.4로 갱신했습니다.

# 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.4로 갱신했습니다.
- lib/i18n/ko/admin.ts: 관리자 공통/상단/협력업체 모달 문구 키를 추가했습니다.
- lib/i18n/en/admin.ts: ko/admin.ts와 동일한 i18n 키를 영문 리소스로 동기화했습니다.
- components/admin/layout/AdminTopbar.tsx: 상단 요약 문구를 i18n 기반으로 전환했습니다.
- components/admin/layout/AdminCard.tsx: 요약/이동/준비중 라벨을 i18n 기반으로 전환했습니다.
- components/admin/partnerMaster/PartnerProcessManagementModal.tsx: 외주공정 관리 모달의 직접 문구를 i18n 기반으로 전환했습니다.
- components/admin/partnerMaster/PartnerMasterFormModal.tsx: 협력업체 등록/수정 모달 섹션명을 i18n 기반으로 전환했습니다.
- components/admin/partnerMaster/PartnerMasterList.tsx: 협력업체 목록 로딩 문구를 i18n 기반으로 전환했습니다.

# 추가 파일 목록
- 없음

# 삭제 파일 목록
- 없음

# 작업 상세 내용
- 기능 변경 없이 관리자 화면에 남아 있던 직접 표시 문구를 기존 admin i18n 구조에 흡수했습니다.
- 새 화면/새 의존성 추가 없음.
- package.json 및 package-lock.json 수정 없음.
- node_modules가 포함되지 않은 압축 원본이라 빌드 검증은 수행하지 못했습니다.

# 다음 권장 작업
0.9.5 — mock/fallback 노출 정책 정리
