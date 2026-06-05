# WAFL section spacing and action slot fix 0.19.29

## 목적

0.19.28에서 추가한 본문 섹션 공통 구조를 실제 화면 기준으로 보정한다.

## 기준

- 본문 섹션은 `WaflSectionPanel`의 공통 간격을 따른다.
- 섹션 eyebrow는 영어 대문자 기준을 사용한다.
- 섹션 설명과 divider 아래 content 간격은 공통 기본값을 사용한다.
- 저장소 휴지통의 action button은 본문 영역이 아니라 section header action slot에 배치한다.
- 화면별 직접 간격 조정보다는 WAFL 공통 컴포넌트의 기본값을 우선한다.

## 반영

- `WaflSectionPanel` 기본 body 간격을 한 단계 줄였다.
- 멤버관리 섹션 간격을 통계/협력업체관리 기준에 맞췄다.
- 멤버 목록 eyebrow를 `MEMBER LIST`로 정리했다.
- 저장소 휴지통 action buttons를 header action slot으로 이동했다.
- 협력업체 목록 영역의 2xl overflow 제한을 줄여 마우스 휠 스크롤이 막히지 않도록 보정했다.

## 유지

- 데이터 조회, 저장, 삭제, 복원, 권한 API 흐름은 변경하지 않는다.
- 모든 수정은 `var(--pbp-*)` theme token 기준을 유지한다.
