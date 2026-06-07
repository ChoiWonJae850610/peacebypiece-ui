# 0.20.22 환경설정 마무리 QA 및 공통 UI 보정

## 목적

환경설정 화면을 다음 제품화 작업으로 넘기기 전에 공통 헤더, 탭 선택색, 사용 여부 표시, 기준정보 목록 밀도를 한 번 더 정리한다.

## 반영 기준

- 환경설정 각 탭 본문 헤더는 동일한 높이와 수평선 위치를 유지한다.
- 상단 환경설정 탭과 기준정보 내부 탭은 동일한 선택 surface token을 사용한다.
- 생산품 유형의 1차·2차·3차 선택 행도 같은 selected token 계열을 사용한다.
- 사용 여부 표시는 `AdminUsageToggle`로 통일하고, read-only 상태에서도 텍스트와 스위치가 명확히 보이게 한다.
- 단위 표준과 외주공정 유형은 이름, 표기명, 사용처, 사용 여부를 함께 보여 화면의 빈 밀도를 줄인다.
- 유형 추가 요청 패널의 버튼은 공통 `AdminButton`을 사용해 활성/비활성 대비를 보장한다.

## DB/API smoke 주의

0.20.19에서 추가한 `company_feedback_requests` 테이블이 실제 개발 DB에 반영되지 않으면 DB/API smoke가 실패한다. 이 경우 아래 migration을 먼저 적용한다.

```bash
node scripts/run-sql-files.mjs db/migrations/patch_0_20_19_company_feedback_requests.sql
```

전체 초기화가 가능한 개발 DB라면 `db/schema/full_reset.sql`을 다시 적용해도 된다.

## 후속 작업

환경설정 화면은 0.20.22에서 1차 마무리로 보고, 이후 작업지시서와 원단·부자재 발주 화면의 WAFL 공통 UI 정리로 넘어간다.
