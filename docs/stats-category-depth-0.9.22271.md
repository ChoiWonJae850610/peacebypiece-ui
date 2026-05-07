# 0.9.22271 — 생산품 유형 통계 분류 depth 기준 수정

## 목적

통계정보 화면의 `생산품 유형 비율`에서 1차/2차/3차를 리오더 차수로 해석하던 구조를 수정한다.

이번 기준은 다음과 같다.

- 대분류: 상의 / 하의 / 아우터 / 원피스
- 중분류: 티셔츠 / 셔츠 / 블라우스 / 팬츠 / 스커트 / 자켓 등
- 세분류: 반팔 / 오버핏 / 와이드 / 테일러드 / 트렌치 등

## 적용 화면

- `/admin/dashboard`

## 변경 내용

1. 생산품 유형 토글 문구 변경
   - 기존: 1차 / 2차 / 3차 이상
   - 변경: 대분류 / 중분류 / 세분류

2. 집계 기준 변경
   - 기존: `reorder_round` 기준
   - 변경: `category1_id`, `category2_id`, `category3_id` 기준

3. 도넛 그래프와 TOP5 기준 통일
   - 선택한 분류 depth 기준으로 도넛 그래프와 TOP5가 같이 바뀐다.

4. 리오더 통계와 생산품 유형 통계 분리
   - 리오더 TOP5는 기존처럼 반복 생산/재주문 통계로 유지한다.
   - 생산품 유형 비율은 카테고리 depth 통계만 다룬다.

## 실행 SQL

기존 realistic seed가 이미 적용된 DB라면 아래 SQL만 실행한다.

```text
db/schema/seed_realistic_category_depth_0_9_22271.sql
```

전체 리셋부터 다시 실행할 경우에는 아래 순서로 실행한다.

```text
db/schema/full_reset.sql
db/schema/full_reset_smoke_test.sql
db/schema/seed_realistic_workorders_0_9_2227.sql
db/schema/seed_realistic_category_depth_0_9_22271.sql
```

## 확인 기준

- `/admin/dashboard` 접속
- 생산품 유형 비율에서 `대분류`, `중분류`, `세분류` 버튼 확인
- 대분류 선택 시 상의/하의/아우터/원피스 기준 그래프 표시
- 중분류 선택 시 티셔츠/셔츠/블라우스/팬츠/스커트 등 기준 그래프 표시
- 세분류 선택 시 반팔/오버핏/테일러드/트렌치 등 기준 그래프 표시
