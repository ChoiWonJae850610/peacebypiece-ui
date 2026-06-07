# 0.20.21.3 환경설정 공통 헤더·탭·상태 컴포넌트 보정

## 배경

0.20.21.2 기준 환경설정 > 기준정보 화면에서 다음 문제가 확인되었다.

- 생산품 유형 행에서 `button` 안에 `button`이 중첩되어 hydration error가 발생할 수 있었다.
- 생산품 유형 선택 상태가 화면 테마와 충분히 연결되어 보이지 않았다.
- 단위 표준과 외주공정 유형은 고객사가 직접 켜고 끄는 기준값이 아닌데 토글처럼 보였다.
- 환경설정 상단 탭과 기준정보 내부 탭이 서로 다른 방식으로 구현되어 색상과 간격이 어긋났다.

## 적용 기준

### 1. 환경설정 탭 공통화

환경설정 상단 탭과 기준정보 내부 탭에서 공통 `WaflSettingsTabs`를 사용한다.

- 선택 상태는 `pbp-surface-selected`, `pbp-brand-muted`, `pbp-brand-primary` 계열 토큰을 사용한다.
- 탭 배경과 border는 WAFL surface/border token을 따른다.
- 개별 화면에서 검정/베이지 등 고정 색상을 직접 지정하지 않는다.

### 2. 기준정보 섹션 헤더 공통화

기준정보 설정 본문은 `WaflSectionPanel`을 사용하여 다른 환경설정 탭과 같은 헤더 구조를 따른다.

- eyebrow
- title
- description
- meta/status
- body

이 구조를 기준으로 향후 회사 정보, 요금제, 약관, 서비스 건의 탭도 같은 header pattern으로 맞춘다.

### 3. 조작 가능한 토글과 조회 상태 구분

생산품 유형은 고객사가 직접 관리하는 항목이므로 `AdminUsageToggle`을 유지한다.

단위 표준과 외주공정 유형은 현재 고객사가 직접 켜고 끄는 항목이 아니라 요청형 기준값이므로 `AdminStatusBadge`로 상태만 표시한다.

- 직접 관리 가능: `AdminUsageToggle`
- 조회/요청형: `AdminStatusBadge`

### 4. 생산품 유형 선택 상태

생산품 유형 선택 row는 다음 기준을 따른다.

- 좌측 accent line: `pbp-brand-primary`
- 선택 배경: `pbp-surface-selected`
- 선택 border: `pbp-brand-muted`
- 텍스트: `pbp-text-primary`

## 후속 작업

- 0.20.22에서 시스템관리자 문의/요청 검토 화면을 만들 때도 같은 `WaflSettingsTabs`, `AdminStatusBadge`, `WaflSectionPanel` 기준을 사용한다.
- 기준정보 요청 처리 결과를 시스템관리자 화면과 연결한 뒤 고객사 요청 이력에도 노출할 수 있다.
