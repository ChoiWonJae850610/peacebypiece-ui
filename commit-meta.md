Version: 0.9.24

Summary: 협력업체 관리 UI 정리

Description:
- 협력업체 관리 상단에서 외주 공정 관리 모달을 바로 열 수 있도록 연결했습니다.
- 상단 도움말 문구를 i18n 문구 기준으로 표시했습니다.
- 검색 / 유형 / 상태 필터 영역의 간격과 입력 높이를 정리했습니다.
- 협력업체 목록의 컬럼 폭과 ellipsis 처리를 보완했습니다.
- 외주공정 표시 영역의 최대 길이를 제한해 목록 행이 과도하게 늘어나지 않도록 조정했습니다.
- APP_VERSION을 0.9.24로 동기화했습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION을 0.9.24로 변경
- components/admin/PartnerMasterSection.tsx: 외주 공정 관리 버튼 연결 및 상단 도움말 표시 추가
- components/admin/partnerMaster/PartnerMasterHeader.tsx: 외주 공정 관리 버튼 추가
- components/admin/partnerMaster/PartnerMasterFilters.tsx: 검색 / 유형 / 상태 필터 간격과 입력 높이 정리
- components/admin/partnerMaster/PartnerMasterList.tsx: 컬럼 폭, ellipsis, 외주공정 표시 길이 정리

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
- 0.9.23 미비점 중 협력업체 화면에서 외주 공정 관리 모달 진입 버튼이 실제 화면에 노출되지 않는 문제를 보완했습니다.
- 0.9.24 목표 범위인 협력업체 UI 마무리 중 상단 도움말, 필터 간격, 목록 truncation, 외주공정 길이 제한을 반영했습니다.
- package.json / package-lock.json은 수정하지 않았습니다.

이번 작업 진행 판단:
- 0.9.24 협력업체 UI 정리 범위는 반영 완료했습니다.
- 현재 실행 환경에 Next 실행 파일이 없어 로컬 빌드 검증은 완료하지 못했습니다.

다음 작업 권장 버전:
- 0.9.25 — i18n 전면 적용
