# Source Stabilization Checkpoint — 0.16.25

## 목적

0.16.4~0.16.25 구조 정리 구간의 결과를 한 번에 점검하기 위한 기준 문서다. 이 문서는 새 기능을 추가하기 전 현재 소스 구조가 어떤 상태인지 확인하는 체크포인트다.

## 1. 완료된 구조 정리

```txt
0.16.4  소스 구조 기준 문서화
0.16.5  /admin 화면 route를 /workspace로 전환
0.16.6  /workspace, /system, /me 보호 라우트 정리
0.16.7  WorkspaceShell / WorkspaceSidebar / WorkspaceTopbar 추가
0.16.8  작업지시서 page.tsx 얇게 정리
0.16.9  작업지시서 controller/event hook 분리
0.16.10 작업지시서 service/repository 흐름 정리
0.16.11 작업지시서 capability 판단 중앙화
0.16.12 workspace API guard 1차 정리
0.16.13 fallback/mock/legacy 표현 정리
0.16.14 dev trace/debug 흐름 추가
0.16.15 DB 구조/payload/중복 컬럼/조인 기준 문서화
0.16.16 원단·부자재 UI 목업 구조 생성
0.16.17 원단·부자재 타입/DB 설계
0.16.18 원단·부자재 DB/API 1차 연결
0.16.19 작업지시서-원단·부자재 연결 1차
0.16.20 발주 이후 상태 설계
0.16.21 원단·부자재 발주 상태 연결
0.16.22 권한별 원단·부자재 조건 연결
0.16.23 통계/저장소/감사로그 충돌 점검
0.16.24 dead code/old path 정리 기준 보정
0.16.25 소스 구조 안정화 점검 및 문서 갱신
```

## 2. 현재 기준 구조

```txt
app:
- route 진입점
- layout/page/route 최소 처리

features:
- materials 화면 조립
- workorders page/controller/material-lines 조립

lib:
- auth guard
- permissions/capabilities
- workorder service/repository/API helper
- materials service/repository/types/constants/capabilities
- storage/R2 기존 흐름
- debug trace

components:
- workorder 상세/섹션 UI
- workspace shell
- admin prefix 공통 UI 호환 계층
```

## 3. 아직 의도적으로 남긴 항목

```txt
- components/admin/* prefix
- lib/admin/* prefix
- app/api/admin/* API route
- Admin* 공통 UI 컴포넌트명
- 일부 과거 docs/wafl-a-type 문서의 역사적 명칭
```

이 항목들은 실제 `/admin` 화면 URL 잔존과 다르다. 후속 rename은 import churn과 회귀 위험이 있으므로 별도 버전에서 처리한다.

## 4. 원단·부자재 현재 범위

```txt
현재 포함:
- /workspace/materials 기준정보 화면
- materials DB/API
- 작업지시서 상세 연결/해제
- 연결 항목 발주 상태 변경
- 기준정보/작업지시서/발주 권한별 UI 조건

현재 미포함:
- 저장소/R2 파일 첨부
- 통계 집계
- 감사로그 실제 기록
- 발주서/PDF snapshot 반영
- 작업지시서 workflow status 자동 변경
```

## 5. 다음 구간 권장 순서

```txt
0.16.26 build/type 오류 보정 및 누적 테스트 준비
0.16.27 원단·부자재 화면 사용성 1차 정리
0.16.28 원단·부자재 감사로그 실제 기록 연결
0.16.29 원단·부자재 통계 후보 설계
0.16.30 /api/admin → /api/workspace alias 설계
0.16.31 workspace API client 이동 1차
0.16.32 components/admin/lib/admin rename 후보 분리
```

## 6. 중단 기준

다음 작업은 사용자 결정 없이 진행하지 않는다.

```txt
- /api/admin/* 즉시 삭제
- components/admin/* 대량 rename
- lib/admin/* 대량 rename
- 원단·부자재를 저장소/R2 사용량에 편입
- 원단·부자재를 기존 통계 계산에 즉시 편입
- 발주서/PDF snapshot 구조 변경
- 작업지시서 workflow status 자동 전이 변경
```
