# 0.9.204 — Recharts 도입 기준

## 목적

0.9.204는 고객관리자 통계 화면과 향후 시스템관리자 통계 화면에서 사용할 차트 라이브러리로 `recharts`를 도입하는 버전이다.

이번 버전의 범위는 의존성 도입과 사용 기준 문서화까지로 제한한다. 실제 통계 카드, API 연동, 화면 구현은 0.9.205 이후에 진행한다.

## 도입 라이브러리

- `recharts`: `^3.8.1`

## package 변경 정책

이번 버전은 사용자의 명시 허용에 따라 다음 파일 수정을 허용한다.

- `package.json`
- `package-lock.json`

단, 이번 버전에서 추가한 dependency는 `recharts` 하나로 제한한다. 다른 dependency는 추가하지 않는다.

## 사용 위치 원칙

Recharts는 통계 표시 계층에서만 사용한다.

허용 위치:

- 고객관리자 통계 화면
- 고객관리자 메인 요약 차트
- 시스템관리자 통계 화면
- 통계 전용 공통 chart component

비허용 위치:

- DB query 계층
- API route 내부
- workorder domain logic
- selector/derived 계산 로직
- R2/storage 처리 로직

## 컴포넌트 설계 원칙

0.9.205 이후 실제 화면 구현 시 다음 원칙을 따른다.

1. Recharts import는 통계 전용 presentation component로 제한한다.
2. API DTO를 차트 컴포넌트 내부에서 직접 가공하지 않는다.
3. 데이터 가공은 selector/presentation adapter에서 수행한다.
4. 차트 컴포넌트는 props로 이미 정리된 chart data만 받는다.
5. 색상, 높이, empty state, loading state는 공통 규칙을 둔다.
6. Basic 통계는 단순한 bar/line/pie 중심으로 시작한다.

## 초기 차트 후보

0.9.205 Basic 통계 1차에서 우선 적용할 차트 후보는 다음과 같다.

- 작업지시서 상태별 건수: BarChart
- 월별 생성/완료 추이: LineChart 또는 AreaChart
- 파일 유형별 용량: PieChart 또는 BarChart
- 저장소 active/trash 용량: BarChart

## 성능 원칙

1. 차트에 raw row data를 직접 전달하지 않는다.
2. API는 aggregate 결과만 반환한다.
3. 화면은 aggregate DTO를 chart data로 변환해서 사용한다.
4. 대량 데이터를 클라이언트에서 group by 하지 않는다.
5. 차트 렌더링 대상 데이터는 화면당 필요한 최소 단위로 제한한다.

## SQL DDL 필요 여부

불필요.

이번 버전은 라이브러리 도입과 문서화만 포함한다. DB table, column, index, constraint는 변경하지 않는다.

## 전체 리셋 필요 여부

불필요.

이번 버전은 DB schema를 변경하지 않으므로 `full_reset.sql` 실행이 필요하지 않다.

## npm / build 확인 기준

이번 버전 적용 후 권장 확인 명령은 다음과 같다.

```bash
npm install
npm run build
```

확인 목적:

1. `recharts`가 package-lock 기준으로 정상 설치되는지 확인
2. React 19.2.4 환경에서 peer dependency 충돌이 없는지 확인
3. Next.js build가 기존 화면에서 깨지지 않는지 확인

## 다음 버전 진행 기준

0.9.205에서는 Recharts를 실제 고객관리자 Basic 통계 1차 화면에 적용한다.

예상 작업:

- 통계 chart 공통 컴포넌트 추가
- Basic 통계 mock/placeholder data 또는 API DTO 연결 기준 구현
- 상태별 작업지시서 수 차트
- 월별 작업지시서 추이 차트
- 저장소 용량 요약 차트
