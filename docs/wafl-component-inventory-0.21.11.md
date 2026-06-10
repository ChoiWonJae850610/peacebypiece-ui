# WAFL Component Inventory 0.21.11

## 목적
/ui 카탈로그에 컴포넌트 재고표를 추가해 현재 WAFL 컴포넌트를 유지/통합/전환/폐기 후보로 분류한다.

## 분류 기준
- Primitive: 버튼, 배지, 입력창, surface처럼 가장 작은 공통 부품.
- Pattern: FilterBar, DataTable, EmptyCard처럼 primitive를 조합한 반복 패턴.
- Domain: 작업지시서/발주/저장소처럼 업무 로직을 가진 조합 컴포넌트.
- Legacy: 직접 className 또는 구형 Admin 계열로 만들어진 전환 대상.

## 핵심 판단
- 역할이 다르면 컴포넌트를 나눈다.
- 모양만 다르면 props와 shape token으로 처리한다.
- ... / + / 닫기 / 수정 / 삭제 같은 아이콘 액션은 공통 WaflIconButton 또는 WaflMoreActionButton 기준으로 통합한다.
- data-wafl-component만 붙고 실제 shape token을 타지 않는 요소는 폐기 후보로 본다.

## 다음 리팩토링 우선순위
1. WaflIconButton / WaflMoreActionButton 기준 수립.
2. 작업지시서 목록 ... 버튼과 제작 공정 카드 ... 버튼 통일.
3. WaflAddCardButton / WaflAddIconBubble 관계 정리.
4. SurfaceButton / SelectableCard 통합 가능성 확인.
5. AdminButton 계열의 WAFL 전환 위치 점검.

## 기능 영향
실제 업무 화면 로직 변경 없음. /ui 문서성 강화만 포함한다.
