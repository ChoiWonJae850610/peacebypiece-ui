Version : 0.9.45

Summary : 협력업체 목록 중복 key 경고 수정 및 요청사항 반영 상태 점검

Description :
- 협력업체 목록의 기본 유형 뱃지 key가 모두 '-'로 생성되어 React 중복 key 경고가 발생하던 문제를 수정했습니다.
- APP_VERSION을 0.9.45로 동기화했습니다.
- 요청사항.txt 기준 반영/미비 항목을 점검했습니다.
- package.json / package-lock.json은 수정하지 않았습니다.

수정 파일 목록 :
- lib/admin/partner/presentation.ts : 협력업체 기본 유형 뱃지 key를 partnerId-type 조합으로 고유화했습니다.
- lib/constants/app.ts : APP_VERSION을 0.9.45로 갱신했습니다.
- commit-meta.md : 산출물 메타 정보를 콜론 파싱 형식으로 갱신했습니다.

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음

작업 상세 :
- components/admin/partnerMaster/PartnerMasterList.tsx에서 발생한 중복 key 경고의 원인은 lib/admin/partner/presentation.ts에서 baseTypeBadges key를 '-' 고정값으로 생성한 부분이었습니다.
- React key가 partner별/유형별로 고유하도록 `${partner.id}-${type}` 형식으로 변경했습니다.
- 이번 작업은 런타임 콘솔 경고 수정과 점검 작업이며 npm build는 실행하지 않았습니다.
