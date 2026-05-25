---
title: WAFL domain constants/types 1차 정리
version: 1.0
baseline_source: peacebypiece-ui-0.16.47
status: applied
updated: 2026-05-21
---

# 53. domain constants/types 1차 정리

## 1. 목적

0.15.30은 0.15.29 코드 품질 감사에서 확인된 high-risk 후보 중 기능 영향 범위가 작고 효과가 큰 항목부터 정리한다.

핵심 목표는 화면 또는 API 안에서 한글 표시 문구를 조건식으로 직접 비교하지 않도록 domain code를 먼저 만들고, label은 presentation 단계에서만 계산하게 만드는 것이다.

## 2. 이번 수정 범위

```txt
- build type error: admin.userAccessPreview i18n key 누락 수정
- usage risk domain code 추가
- file kind domain code 추가
- /system/billing의 저장소/멤버 위험도 badge 조건식을 label 비교에서 risk tone 기반으로 변경
- /admin/files snapshot의 파일 유형 분류에서 한글 includes 비교 제거
- adminFiles presentation의 디자인 파일 판정을 domain helper로 이동
```

## 3. 추가한 domain 값

### 3.1 usage risk

```txt
normal
warning
exceeded
```

적용 기준:

```txt
- DB 또는 계산 값: normal / warning / exceeded
- 화면 표시: 정상 / 주의 / 초과
- badge tone: success / warning / danger
```

주의:

```txt
화면에서는 더 이상 "초과", "주의" 같은 한글 label로 조건을 비교하지 않는다.
```

### 3.2 file kind

```txt
document
design
other
```

적용 기준:

```txt
- 파일 도메인 값: document / design / other
- 화면 표시: 문서 / 디자인 / 기타
- legacy label: 디자인 / 이미지 / 문서 / 파일 / 기타는 normalizeFileKind 내부에서만 허용
```

주의:

```txt
legacy 한글 label 호환은 흩어진 화면/route에서 처리하지 않고 domain helper 한 곳으로 모은다.
```

## 4. 이번에 제거한 위험 패턴

```txt
company.storageRiskLabel === "초과"
company.storageRiskLabel === "주의"
company.memberRiskLabel === "초과"
source.includes("디자인")
fileType === "디자인"
```

변경 후:

```txt
company.storageRiskTone
company.memberRiskTone
normalizeFileKind(...)
getFileKindLabelKo(...)
```

## 5. 빌드 오류 수정

0.15.29 build log 기준 오류는 `AdminUserAccessPreview`가 `getI18n().admin.userAccessPreview`를 참조하지만 영문 i18n 리소스에 해당 key가 없어 발생했다.

수정:

```txt
lib/i18n/en/admin.ts
- userAccessPreview 추가
```

이 오류는 ko/en i18n 객체 shape drift 사례다. 이후 i18n key 추가 시 ko/en 양쪽 반영을 기본 확인 항목으로 둔다.

## 6. 남은 후속 대상

0.15.30에서는 전체를 한 번에 고치지 않고, 위험도가 높은 label 비교 일부만 처리했다. 다음 후보는 후속 버전에서 분리한다.

```txt
0.15.31 — 중복 formatter/presentation 통합 1차
- 날짜 포맷
- 파일 크기 포맷
- 수량/단위 포맷
- badge tone map

0.15.32 — TSX 도메인 로직 분리 1차
- 버튼 활성화 조건
- 권한 판단
- 상태 전이 안내
- 저장 가능 여부

0.15.33 — DB 저장값 / JSON payload 감사
- 문장형 reason/status 저장 후보
- raw metadata 장기 저장 후보
- full_reset.sql 반영 필요 여부
```

## 7. 적용 후 확인

```txt
- /admin/settings
- /admin/files
- /system/billing
```

확인 포인트:

```txt
- AdminUserAccessPreview i18n 타입 오류가 사라지는지
- 저장소/멤버 위험도 badge가 기존과 동일하게 보이는지
- 파일 유형 분포가 문서/디자인 기준으로 유지되는지
```
