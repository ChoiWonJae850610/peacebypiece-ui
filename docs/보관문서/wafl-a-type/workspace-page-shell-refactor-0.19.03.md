# 0.19.03 고객사 관리자 WorkspacePageShell 공통화 1차

## 목적

고객사 관리자 영역의 여러 route page에서 반복되던 `WorkspaceShell` 조립 패턴을 `WorkspacePageShell`로 묶었다. 이번 단계는 화면 구조를 바꾸는 리팩토링이 아니라, 이후 고객사 관리자 화면 공통화 작업에서 `APP_VERSION`, 회사명, navigation active href, content mode 전달 기준을 한 곳으로 모으기 위한 준비 작업이다.

## 적용 범위

다음 고객사 관리자/워크스페이스 route page에서 공통 shell wrapper를 사용한다.

- `/workspace/partners`
- `/workspace/stats`
- `/workspace/members`
- `/workspace/settings`
- `/workspace/materials`
- `/workspace/material-orders`
- `/workspace/subscription`
- `/workspace/legal`
- `/workspace/history`

## 유지한 것

- 각 화면의 title, description 의미
- 회사명 표시 기준
- app version 표시 기준
- active navigation href 기준
- `contentMode="fixed-md"`가 있던 화면의 fixed-md 기준
- DB/API/R2/권한/상태/저장/삭제 흐름

## 바뀌면 안 되는 것

- 고객사 관리자 홈, 저장소관리, 협력업체관리, 통계정보, 멤버관리, 환경설정 진입 경로
- 멤버 권한에 따른 화면 접근 차단/허용
- 회사명·버전·화면 제목 표시
- 화면별 스크롤 방식과 내부 콘텐츠 폭
- 작업지시서/원단부자재/첨부/메모/휴지통/purge 동작

## 테스트 위치

이번 패치는 고객사 관리자 shell 조립 리팩토링이므로 화면별 진입 확인이 핵심이다.

1. `/workspace/partners`
2. `/workspace/stats`
3. `/workspace/members`
4. `/workspace/settings`
5. `/workspace/material-orders`
6. `/workspace/legal`
7. `/workspace/history`

## 확인할 것

- 각 화면이 정상 진입되는지
- 상단 WAFL / 회사명 / 버전 / 제목 / 설명이 기존과 같은 의미로 보이는지
- 홈 버튼, 개인 설정 버튼, 환경설정 버튼, 로그아웃 버튼이 기존처럼 보이는지
- 협력업체관리와 원단·부자재 발주처럼 `fixed-md` 화면의 PC 스크롤/높이 느낌이 크게 달라지지 않았는지
- 통계정보, 멤버관리, 환경설정 화면의 내부 콘텐츠가 사라지지 않았는지

## 후속 작업

0.19.04부터 고객사 관리자 화면의 page header/action bar, empty/loading/error, table/card shell을 실제 화면 단위로 점진 적용한다. 시스템 관리자 화면은 명백한 깨짐 외에는 후순위로 둔다.
