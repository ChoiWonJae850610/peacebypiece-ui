---
title: WAFL A-TYPE Refactor Roadmap
version: 1.0
baseline_source: peacebypiece-ui-0.15.29
status: draft-final
updated: 2026-05-20
---

# 12. A-TYPE 전환 로드맵

## 1. 현재 기준

```txt
현재 기준: 0.15.29
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

## 5. 0.16.x — Device / Responsive 기반

### 0.16.0 — DeviceKind foundation

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
0.15.30 — domain constants/types 1차 정리
0.15.31 — 중복 formatter/presentation 통합 1차
0.15.32 — TSX 도메인 로직 분리 1차
0.15.33 — DB 저장값 / JSON payload 감사
0.16.0 — DeviceKind foundation
0.16.1 — Admin/Workspace shell에서 DeviceKind 읽기만 적용
```
