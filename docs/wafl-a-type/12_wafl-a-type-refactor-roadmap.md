---
title: WAFL A-TYPE Refactor Roadmap
version: 1.0
baseline_source: peacebypiece-ui-0.15.43
status: draft-final
updated: 2026-05-20
---

# 12. A-TYPE 전환 로드맵

## 1. 현재 기준

```txt
현재 기준: 0.15.43
완료:
- 고객사 초대/온보딩/승인 흐름 1차
- 멤버 초대 링크 단순화
- 권한 4개 구조 1차
- 고객사 관리자 홈 IA 일부 정리
- A-TYPE 문서 00~20 정리
- semantic token 1차
- legacy docs 정리
- route group 기반 Router/Layout 구조 1차 정리
- AdminShell/SystemShell 책임 분리 1차
- Admin 공통 컴포넌트 variant 1차
- Login / Invite / Error A-TYPE 1차
- 고객사 관리자 홈 A-TYPE 1차
- 고객사 관리자 멤버관리/환경설정 A-TYPE 1차
- 시스템관리자 주요 화면 A-TYPE 1차
- 시스템관리자 확장 화면 A-TYPE 1차
- 고객사 관리자 통계정보 A-TYPE 1차
- 시스템관리자 기준정보 세부 화면 A-TYPE 1차
- Workspace / Worker 화면 구조 점검 1차
- 시스템관리자 잔여 화면 A-TYPE 1차
- 고객사 관리자 PC visual pass 1차
- 시스템관리자 홈 visual pass
- 서비스 운영 IA 문서화
- 원단/부자재 발주 업무 흐름 문서화
- 카드결제/청구/증빙 정책 문서화
- 운영 IA 기반 홈/메뉴 매핑 1차
- 원단/부자재 발주 데이터 모델 상세 설계
- 작업지시서 발주 flow 변경 설계
- A-TYPE visual QA / raw color / hardcoded text 점검
- PC visual 보정 2차
- 초대/승인/pending public 화면 visual pass
- 개발자성 UI/문구 전수 감사와 pending 사용자용 화면 단순화
- public/auth 문구 UX 정리 2차
- system 화면 개발자성 문구 정리
- admin 화면 개발자성 placeholder 정리
- 코드 품질 / 도메인 구조 전수 감사
- domain constants/types 1차 정리
- formatter/presentation 통합 1차
- TSX 도메인 로직 분리 1차
- DB 저장값 / JSON payload 감사
- member/workorder/storage status constants 후보 조사
- workorder status usage 정리 1차
- workorder action type constants 정리 1차
```

## 2. 전환 원칙

```txt
- 작은 버전 단위로 진행한다.
- URL은 변경하지 않는다.
- 기능/DB/API/R2/권한/세션 흐름은 직접 목표가 아니면 건드리지 않는다.
- UI 전환 전 router/layout/shell 책임을 먼저 정리한다.
- Admin* 공통 컴포넌트는 버리지 않고 A-TYPE 기준으로 승격한다.
- PC 기준 안정화 후 tablet/mobile로 확장한다.
- 운영 IA 문서화와 실제 기능 구현을 같은 패치에 섞지 않는다.
- 결제/증빙/원단 발주 구현 전에는 저장 가능 데이터와 금지 데이터를 먼저 확인한다.
```

## 3. 0.15.x — 소스 구조, PC A-TYPE, 운영 IA

```txt
0.15.0 — 소스 구조 감사
0.15.1 — route group 기반 Router/Layout 구조 1차
0.15.2 — AdminShell / SystemShell 책임 정리
0.15.3 — Admin 공통 컴포넌트 A-TYPE variant 1차
0.15.4 — Login / Invite / Error A-TYPE
0.15.5 — 고객사 관리자 홈 A-TYPE 1차
0.15.6 — 멤버관리 / 환경설정 A-TYPE 1차
0.15.7 — 저장소 / 협력업체 A-TYPE surface 1차
0.15.8 — 시스템관리자 주요 화면 A-TYPE shell 1차
0.15.81 — /system/companies JSX 닫힘 오류 핫픽스
0.15.9 — 시스템관리자 확장 화면 shell 1차
0.15.10 — 고객사 관리자 통계정보 section 구조 정리
0.15.11 — 시스템관리자 기준정보 세부 화면 shell 1차
0.15.12 — Workspace / Worker 구조 점검
0.15.13 — 시스템관리자 잔여 점검 화면 shell 적용
0.15.14 — 고객사 관리자 홈 visual pass
0.15.15 — 멤버관리 / 환경설정 visual pass
0.15.16 — 저장소 / 협력업체 / 통계 visual pass
0.15.17 — 시스템관리자 홈 visual pass
0.15.18 — 운영 IA + 원단/부자재 발주 IA + 카드결제/증빙 정책 문서화
0.15.19 — 운영 IA 기반 홈/메뉴 매핑 1차
0.15.20 — 원단/부자재 발주 데이터 모델 상세 설계
0.15.21 — 작업지시서 발주 flow 변경 설계
0.15.22 — A-TYPE visual QA / raw color / hardcoded text 점검
0.15.23 — PC visual 보정 2차
0.15.231 — A-TYPE visual 보정 문서의 Tailwind CSS 파싱 오류 수정
0.15.232 — Tailwind source 감지 범위 명시로 CSS 파싱 오류 수정
0.15.233 — 시스템관리자 화면 로그아웃 버튼 추가
0.15.24 — 초대/승인/pending public 화면 visual pass
0.15.25 — 개발자성 UI/문구 전수 감사와 pending 사용자용 화면 단순화
0.15.26 — public/auth 문구 UX 정리 2차
0.15.27 — system 화면 개발자성 문구 정리
0.15.271 — 시스템 요금제 화면 빌드 문법 오류 수정
0.15.272 — 시스템 요금제 화면의 남은 객체 문법 오류 수정
0.15.273 — 시스템 화면 객체 문법 오류 추가 수정
0.15.28 — admin 화면 개발자성 placeholder 정리
0.15.29 — 코드 품질 / 도메인 구조 전수 감사
0.15.30 — domain constants/types 1차 정리
0.15.31 — formatter/presentation 통합 1차
0.15.32 — TSX 도메인 로직 분리 1차
0.15.33 — DB 저장값 / JSON payload 감사
```

## 4. 0.15.19 이후 추천 작업

### 0.15.19 — 운영 IA 기반 홈/메뉴 매핑 1차

```txt
완료:
- 시스템관리자 홈 메뉴를 실제 SaaS 운영 IA에 맞춰 고객사 운영 / 요금·결제·증빙 / 시스템 운영 기준으로 재배치
- 고객사관리자 홈에 material-orders / billing / legal 준비 중 카드를 추가
- 고객사관리자 환경설정에 약관·정책 준비 카드를 추가
- docs roadmap과 운영 IA 매핑 문서를 갱신

주의:
- 실제 결제 기능 구현은 아직 하지 않는다.
- 원단/부자재 발주 route와 DB schema는 아직 추가하지 않는다.
```

### 0.15.20 — 원단/부자재 발주 데이터 모델 상세 설계

```txt
완료:
- work_order_material_rows 상세 모델 정리
- material_purchase_orders 상세 모델 정리
- material_purchase_order_items 상세 모델 정리
- 작업지시서와 자재 발주 연결 방식 정리
- materials.order 계열 권한 matrix 정리
- 발주 상태 전이와 selector 기준 후보 정리
- full_reset.sql 영향 검토

주의:
- 실제 DB schema는 아직 추가하지 않는다.
- full_reset.sql은 수정하지 않는다.
- API/화면/PDF 구현은 아직 하지 않는다.
```

### 0.15.21 — 작업지시서 발주 flow 변경 설계

```txt
완료:
- 기존 발주요청/PDF flow를 자재 발주 준비 flow와 분리
- 작업지시서 상태와 자재 발주 상태를 별도 enum으로 관리하는 기준 정리
- 작업지시서 화면의 버튼은 “자재 발주 준비” 역할로 재정의
- 자재 발주 화면의 검토요청/검토승인/바로발주 버튼 역할 정리
- 발주 준비 selector와 발주 준비 미완료 안내 문구 기준 정리
- PDF 출력 시점을 작업지시서 PDF / 자재 발주 초안 PDF / 자재 발주 확정 PDF / 공유 PDF로 분리

주의:
- 실제 작업지시서 화면 코드는 아직 수정하지 않는다.
- DB schema/API/PDF/R2 구현은 아직 하지 않는다.
```

### 0.15.22 — A-TYPE visual QA / raw color / hardcoded text 점검
0.15.23 — PC visual 보정 2차

```txt
완료:
- 0.15.x visual pass 이후 전체 관리자 PC 화면 점검 기준 정리
- bg-white / border-stone / text-stone 탐지 상위 파일 정리
- raw hex color의 정상 후보와 보정 후보 분리
- hardcoded Korean text의 i18n 정상 영역과 화면 보정 후보 분리
- 0.15.23 이후 PC visual 보정 후보 정리

주의:
- 실제 화면 class 보정은 아직 하지 않는다.
- DB/API/R2/권한/세션 흐름은 변경하지 않는다.
```

### 0.15.23 — PC visual 보정 2차

```txt
목표:
- 아직 사진 느낌이 약한 화면 재보정
- hero block 강화
- 카드 테두리 약화
- 타이포 위계 강화
- 여백/면/리듬감 재조정

대상 후보:
- /admin/settings
- /admin/members
- /admin/files
- /admin/stats
- /system
```


### 0.15.23 — PC visual 보정 2차

```txt
완료:
- admin 공통 surface/storage/stats semantic class의 radius, border, shadow 리듬 보정
- /admin/settings 세부 컴포넌트의 stone/white 직접 class를 semantic token으로 치환
- /system hero chip/CTA의 inverse token 기반 표현 정리
- /admin/members, /admin/files, /admin/stats는 공통 semantic class 보정을 통해 화면 간 표면감을 맞춤

주의:
- 기능 구현은 하지 않는다.
- API/DB/R2/권한/세션/companyId scope는 변경하지 않는다.
- 초대/승인/pending public 화면은 0.15.24에서 별도 보정한다.
```



### 0.15.24 — 초대/승인/pending public 화면 visual pass
0.15.25 — 개발자성 UI/문구 전수 감사와 pending 사용자용 화면 단순화

```txt
완료:
- /pending 화면의 raw stone/white 기반 surface를 A-TYPE semantic token으로 보정
- pending 상단 disabled logout icon을 실제 /api/auth/logout POST 버튼으로 연결
- 고객사 관리자 초대 화면과 멤버 초대 화면에 초대 유형/고객사/만료일 요약 surface 추가
- 초대 오류 화면 eyebrow 문구를 한국어로 정리
- pending status/access tone class를 status semantic token 기반으로 보정

주의:
- 가입 신청 조회 API와 초대 검증 API는 변경하지 않는다.
- OAuth redirect / 세션 생성 / 승인 처리 흐름은 변경하지 않는다.
```


### 0.15.25 — 개발자성 UI/문구 전수 감사와 pending 사용자용 화면 단순화

```txt
완료:
- /pending 화면에서 requestId, join_requests.id, permission_code 등 내부 용어를 제거
- 가입 대기 사용자가 보는 화면을 상태 안내 중심으로 단순화
- 상태 새로고침과 로그아웃만 남기고 개발자성 조회 대시보드 제거
- public/system/admin/workspace 화면의 추가 개발자성 문구 정리 후보를 문서화

주의:
- OAuth, 초대 검증, 승인 조회 API, DB/R2 흐름은 변경하지 않는다.
- 전수 정리는 한 번에 제거하지 않고 public → system → admin 순서로 나눈다.
```


### 0.15.26 — public/auth 문구 UX 정리 2차

```txt
완료:
- 로그인 화면의 개발자성 오류 문구를 사용자용 안내로 완화
- 초대 오류 화면에서 토큰/OAuth/scope 계열 내부 원인 표현을 제거
- 고객사 관리자 초대 화면에서 영문 eyebrow, Trial 7일, 이메일 일치 검사 설명을 제거
- 멤버 초대 화면에서 permission template 계열 표현을 제거
- 서비스 제한 화면의 public eyebrow에서 앱 버전 노출을 제거

주의:
- OAuth redirect, 초대 검증 API, 가입 신청 조회 API, DB/R2 흐름은 변경하지 않는다.
- system/admin 화면의 개발자성 문구는 후속 버전에서 분리 정리한다.
```



### 0.15.30 — domain constants/types 1차 정리

```txt
완료:
- AdminUserAccessPreview 영문 i18n key 누락으로 인한 type error 수정
- usage risk normal/warning/exceeded domain code 추가
- file kind document/design/other domain code 추가
- /system/billing 위험도 badge 조건식을 한글 label 비교에서 tone 기반으로 변경
- /admin/files snapshot 파일 유형 분류에서 한글 includes 비교 제거
- adminFiles presentation의 디자인 파일 판정을 domain helper로 이동
```

## 5. 0.16.x — Device / Responsive 기반

### 0.15.36 — workorder status usage 정리 1차
0.16.0 — DeviceKind foundation

```txt
- pc / tablet-landscape / tablet-portrait / mobile 판정 구조 추가
- PC 축소와 실제 모바일/태블릿을 구분할 기반 준비
- 모바일/태블릿 UI 작업의 바닥 공사

파일 후보:
- lib/device/deviceTypes.ts
- lib/device/getDeviceKind.ts
- lib/device/useDeviceKind.ts

주의:
- 모바일 UI를 바로 만들지 않는다.
- 화면 레이아웃 대수정 없음
```

### 0.16.1 — Admin/Workspace shell에서 DeviceKind 읽기만 적용

```txt
- AdminShell
- SystemShell
- MemberWorkspaceShell
- Worker layout
- deviceKind 읽기만 적용
- PC 화면 간섭 없는지 확인
```

### 0.16.2 — 모바일/태블릿 레이아웃 QA 기준 추가

```txt
- iPad Safari 기준
- Android Chrome 기준
- PC narrow width 기준
- tablet portrait / landscape 기준
- safe-area / keyboard / sheet 기준 문서화
```

### 0.16.3 — 작업지시서 orientation guard 1차

```txt
- 태블릿 가로 직접 그리기 차단
- 태블릿 세로 안내
- PC에서 잘못 차단되지 않게 보정
- 회전 시 draft 보존 준비
```



### 0.15.31 업데이트

```txt
54_wafl-a-type-formatter-presentation-consolidation.md
- formatter/presentation 통합 1차
- lib/utils/formatters.ts 추가
- 숫자, 금액, 수량+단위, 저장공간 용량 formatter를 공통 유틸로 1차 통합
- billing/admin/system/stats 일부 formatter 중복 제거
- 기존 공개 함수명은 유지하고 내부 구현만 공통 formatter로 위임
- DB/API/R2/권한/세션 변경 없음
```


### 0.15.32 업데이트

```txt
55_wafl-a-type-tsx-domain-logic-separation.md
- TSX 도메인 로직 분리 1차
- /system/companies 화면의 고객사 가입 신청 row 변환과 상태 표시 helper를 lib/system/systemCompanyApprovalPresentation.ts로 이동
- 초대 링크 상태/복사/취소 가능 여부와 고객사 관리 필터 판정을 presentation 계층으로 분리
- 화면 컴포넌트는 fetch, 이벤트 처리, table/modal 렌더링 중심으로 유지
- DB/API/R2/권한/세션 변경 없음
```

### 0.16.4 — 모바일/태블릿 화면별 적용 시작

```txt
대상:
- /admin
- /workspace
- /worker
- /invite
```

## 6. 0.17.x — 작업지시서 / Worker 본격 정리

```txt
0.17.0 — Worker PC 화면 구조 감사
0.17.1 — 작업지시서 PC visual pass 1차
0.17.2 — 작업지시서 상세/첨부/메모 panel 정리
0.17.3 — 작업지시서 직접 그리기 draft 보존 점검
0.17.4 — 발주 요청 후 원단/부자재 구성 입력 flow 1차
0.17.5 — 원단/부자재 발주 화면 1차
0.17.6 — 작업지시서 PDF 공유 설계
0.17.7 — 발주 PDF 출력 조건 연결
```

## 7. 0.18.x — 공유 / PDF / QR

```txt
0.18.0 — 초대 링크 공유 공통 유틸
0.18.1 — 멤버 초대 Web Share / 링크 복사
0.18.2 — 고객사 관리자 초대 Web Share / 링크 복사
0.18.3 — QR 보기
0.18.4 — 작업지시서 PDF 생성 설계
0.18.5 — 작업지시서 PDF 링크 공유
0.18.6 — PDF 권한/만료 정책
```

## 8. 0.19.x — DB / 문서 / 정리

```txt
0.19.0 — DB schema 사용 여부 점검
0.19.1 — full_reset.sql 정리
0.19.2 — smoke_test 강화
0.19.3 — seed SQL 분류
0.19.4 — legacy migration 삭제 후보 정리
0.19.5 — R2 key 정책 최종 점검
0.19.6 — 미사용 코드/문서 정리
```

## 9. 0.20.x — 운영 기능

```txt
0.20.0 — 고객사 계정 변경 요청 시스템관리자 검토
0.20.1 — 고객사 비활성화/탈퇴 요청 검토
0.20.2 — 요금제 실제 관리
0.20.3 — 고객사 구독 관리
0.20.4 — 카드 등록/변경 flow
0.20.5 — 결제내역/영수증 보기
0.20.6 — 결제 실패/미납 관리
0.20.7 — 환불 관리
0.20.8 — 증빙 관리
0.20.9 — 정산자료 출력
0.20.10 — 서비스 문서/공지사항 관리
0.20.11 — 시스템 감사로그 실제 기록 강화
```

## 10. 리스크 분리

```txt
Low risk:
- 문서
- token alias
- static copy
- empty state
- route placeholder

Medium risk:
- AdminShell / SystemShell
- i18n key 이동
- route group
- device hook
- 권한 helper 확장

High risk:
- WorkOrderWorkspace 구조
- R2 / 첨부·메모 / storage purge
- permission/session/companyId
- DB schema
- PG 결제 연동
- PDF 생성/공유
```

## 11. 다음 권장 작업

```txt
0.15.33 — DB 저장값 / JSON payload 감사
0.15.34 — DB domain status constants 1차
0.15.36 — workorder status usage 정리 1차
0.16.0 — DeviceKind foundation
0.16.1 — Admin/Workspace shell에서 DeviceKind 읽기만 적용
```


### 0.15.33 업데이트

```txt
56_wafl-a-type-db-payload-storage-audit.md
- DB 저장값 / JSON payload 감사
- member/workorder/storage status constants 후보 조사
- workorder status usage 정리 1차
- workorder action type constants 정리 1차
- system_audit_logs.metadata는 허용하되 raw body/secret/token 저장 금지 기준 정리
- company_account_requests.request_payload는 high priority 정리 대상으로 분류
- app/api/workorders/status/route.ts legacy payload column candidates는 사용 여부 확인 후 정리 후보로 분류
- status text + check constraint와 TypeScript domain constants 동기화 필요성 정리
- isPdfOnboardingFile import 누락 빌드 오류 수정
```


### 0.15.34 업데이트

```txt
57_wafl-a-type-db-domain-status-constants.md
- DB domain status constants 1차
- lib/domain/companyStatus.ts 추가
- 회사 온보딩/구독/가입신청/초대 status 기준값과 normalize helper 정리
- 시스템 고객사 승인 presentation과 고객사 온보딩 repository의 직접 문자열 비교 일부 축소
- DB schema/API/R2/권한/세션 변경 없음
```


### 0.15.35 업데이트

```txt
58_wafl-a-type-member-workorder-storage-status-candidates.md
- member/workorder/storage status constants 후보 조사
- lib/domain/memberStatus.ts 추가
- lib/domain/storageStatus.ts 추가
- 멤버 관리 repository/route 일부 직접 문자열 비교를 member status constants로 치환
- admin storage selector의 lifecycle normalize 로직을 storage domain helper로 위임
- workorder 상태값은 기존 workorderStates 기준을 유지하고 후속 정리 후보로 문서화
- DB schema/API/R2/권한/세션 변경 없음
```


### 0.15.38 업데이트

```txt
61_wafl-a-type-workorder-history-reason-constants.md
- workorder action/result/history reason 상수화 후보 조사 및 history constants 1차
- HISTORY_CATEGORY / HISTORY_FILTER / HISTORY_TONE / MEMO_HISTORY_ACTION 추가
- HistoryCategory/HistoryTone/HistoryFilter type은 constants 기반 value type으로 변경
- workorder history builders와 filter의 category/tone/filter 직접 문자열 사용 축소
- DB 저장값/API 응답/R2/권한/세션 변경 없음
```


### 0.15.39 업데이트

```txt
62_wafl-a-type-workorder-kind-attachment-scope-constants.md
- WORK_ORDER_KIND / WORK_ORDER_ORDER_TYPE / ATTACHMENT_SCOPE 기준 추가
- 작업지시서 종류와 첨부 scope 직접 문자열 사용을 일부 상수 기반으로 정리
- types/workorder.ts의 AttachmentScope와 workOrderKind 타입을 constants value type에 연결
- DB schema/API/R2 흐름은 변경하지 않음
```



### 0.15.40 업데이트

```txt
63_wafl-a-type-workorder-production-composition-persistence.md
- 작업지시서 생산구성 저장 흐름 보강
- WorkOrderStatePatch에 materials/outsourcing 포함 가능
- 클라이언트 state patch는 detail snapshot 또는 실제 row가 있을 때만 materials/outsourcing을 포함
- 서버 state patch 저장은 patch에 포함된 생산구성만 해당 상세 테이블에 동기화
- 검토 요청 후 관리자 화면에서 공장/원단/부자재/외주공정 row가 누락되지 않도록 보강
- DB schema/API route/R2/권한/세션 변경 없음
```

### 0.15.41 업데이트

```txt
64_wafl-a-type-workorder-pending-edit-flush.md
- 작업지시서 생산구성 활성 입력값 검토요청 전 반영 보강
- 원단/부자재/외주 수량 및 단가 input이 blur commit 되기 전에 workflow action이 실행되는 위험을 줄임
- 임시저장과 검토요청 실행 전 pending detail edit을 먼저 commit한 뒤 action을 지연 실행
- DB/API/R2/권한/세션 변경 없음
```


- `docs/wafl-a-type/65_wafl-a-type-workorder-live-production-draft.md` — 작업지시서 생산구성 숫자 입력값 실시간 draft 반영


### 0.15.43 업데이트

```txt
66_wafl-a-type-workorder-production-snapshot-action.md
- 작업지시서 생산구성 workflow action snapshot 보강
- workflow action 실행 시 부모 selectedWorkOrder 반영 타이밍에 의존하지 않고 editor snapshot을 전달
- 활성 편집 셀의 editingValue까지 snapshot에 포함
- DB/API/R2/권한/세션 변경 없음
```


## 0.15.44 — 생산구성 확정 저장 정책 보정

- 빌드 오류가 발생한 material snapshot helper import 누락을 수정한다.
- 생산구성은 검토요청, 검토완료, 발주/검수 진행 등 앞으로 진행되는 workflow 이벤트에서만 확정 저장한다.
- 반려/취소성 흐름에서는 입력 중 draft를 새 확정값으로 저장하지 않는 정책을 둔다.


## 0.15.45 — 생산구성 숫자 필드 mapping 통합

- 입력 timing 보정만으로 해결되지 않은 수량/단가 0 fallback 문제를 field mapping 관점에서 정리한다.
- 생산구성 숫자 필드 alias를 `productionCompositionSnapshot`에서 중앙 처리한다.
- 다음 단계에서 저장 전 payload와 DB row를 비교할 수 있도록 기준 helper를 둔다.

### 0.15.46 — 생산구성 조회 numeric 문자열 복원
- DB `numeric` 계열 값이 node-postgres 조회 시 문자열로 반환되는 경우를 고려해 작업지시서 상세 조회 numeric mapper를 보강한다.
- `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`에 저장된 수량·단가·금액 값을 화면 row로 복원할 때 `number | string | bigint`를 모두 안전하게 숫자로 변환한다.
- 저장 경로와 schema는 변경하지 않고, 조회 복원 단계만 수정한다.


### 0.15.47 — 생산구성 현재값 테이블 schema audit

- `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines`의 역할을 “작업지시서 현재 확정 생산구성”으로 재정의한다.
- `is_active=false` row 누적 방식은 현재 목적에 맞지 않으므로 `spec_sheet_id` 기준 replace 저장 방식으로 전환하는 방향을 확정한다.
- 세 테이블의 `company_name`, `is_active`, `deleted_at`, `created_at`, `updated_at`은 제거 후보로 분류한다.
- `spec_sheet_materials.vendor`, `spec_sheet_outsourcing_lines.vendor`, `orders.factory_name` 같은 이름 중복 저장은 partner 조인 기준으로 정리하는 방향을 둔다.
- `unit_price_basis`는 별도 컬럼으로 추가하지 않고, `unit_cost`를 단가 기준값으로 사용한다.
- 과거 생산구성 이력은 현재값 테이블이 아니라 별도 `workorder_production_snapshots` 후보 테이블로 분리하는 방향을 정한다.
- 이번 버전은 문서화/설계 기준 정리이며 DB schema와 repository 동작은 변경하지 않는다.


### 0.15.48 — 생산구성 현재값 replace 저장 1차

- `spec_sheet_materials`, `spec_sheet_outsourcing_lines` 저장 방식을 `is_active=false` 누적 방식에서 `spec_sheet_id` 기준 replace 방식으로 변경한다.
- 저장 시 기존 row를 먼저 삭제하고 현재 draft row를 다시 insert한다.
- 삭제 후 insert 흐름은 transaction으로 묶어 중간 실패 시 rollback되게 한다.
- 기존 schema의 `is_active`, `deleted_at`, `company_name` 컬럼은 이번 단계에서 제거하지 않고 호환만 유지한다.
- `orders` 저장 방식과 full_reset.sql 컬럼 정리는 다음 단계에서 진행한다.


### 0.15.49 — 반려/취소성 workflow 생산구성 보존

- 0.15.48에서 `spec_sheet_materials`, `spec_sheet_outsourcing_lines`를 replace 저장으로 변경하면서 반려 시 빈 생산구성 patch가 전달될 경우 현재 row가 삭제될 수 있는 경로를 차단한다.
- 생산구성 replace 저장은 검토요청/검토완료/발주요청/완료처럼 앞으로 진행되는 확정 이벤트에서만 patch에 포함한다.
- 반려/취소/되돌리기성 상태 변경에서는 workflow 상태와 history만 저장하고, 기존 원단/부자재/외주공정 row는 유지한다.
- 저장 결과를 local state에 merge할 때도 요청 patch에 포함된 생산구성 필드만 반영하여, DB 응답의 빈 배열이 기존 화면 state를 덮어쓰지 않게 한다.
- DB schema/API/R2/권한/세션 흐름은 변경하지 않는다.


### 0.15.50 — 작업지시서 서비스 액션 맵

- 작업지시서 화면에서 DB/R2를 변경하는 동작을 서비스 코드 기준으로 분류한다.
- 즉시 저장, 생산구성 저장, forward workflow, backward workflow, 메모, 첨부/R2, 저장소/purge 액션을 구분한다.
- 검토요청/발주요청처럼 생산구성을 확정 저장해도 되는 액션과 반려/취소처럼 기존 생산구성을 보존해야 하는 액션을 분리한다.
- 후속 단계에서 serviceCode constants와 repository mutation allowlist를 도입하기 위한 기준 문서로 사용한다.
- DB schema/API/R2/권한/세션 흐름은 이번 단계에서 변경하지 않는다.


### 0.15.51 — 작업지시서 DB/R2 호출 위치 전수조사

- 0.15.50 서비스 액션 맵을 기준으로 실제 코드의 DB/R2 호출 위치를 조사한다.
- 작업지시서 본체, workflow state patch, 생산구성 현재값 저장, 메모, 첨부/R2, 삭제/복원/purge 흐름을 서비스 코드와 연결한다.
- 반려/취소/되돌리기 계열에서 `orders`, `spec_sheet_materials`, `spec_sheet_outsourcing_lines` replace 저장이 실행되면 안 된다는 금지 규칙을 실제 호출 경로 기준으로 명시한다.
- 이번 단계는 문서화이며 DB schema/API/R2 동작은 변경하지 않는다.
