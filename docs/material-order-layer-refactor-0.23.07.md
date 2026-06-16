# 0.23.07 발주서 계층 정리

- 대형 repository의 row, mapper, normalize, query helper, line writer 책임을 분리했습니다.
- API 요청 body 정규화를 공통 모듈로 이동했습니다.
- 발주서 상태 라벨, 배지, 필터 옵션, semantic class를 presentation 모듈로 통합했습니다.
- Draft editor의 검증, 선택 발주서 매핑, 신규 품목 생성 로직을 별도 유틸로 이동했습니다.
- 주요 화면과 API에서 상태 문자열 직접 비교를 금지하는 audit 규칙을 추가했습니다.
