# 태블릿 반응형 레이아웃 정책 감사 0.23.22

## 목적
작업지시서와 원단·부자재 발주서가 동일한 `drawer / tabletTwoPanel / threePanel` 정책을 사용하도록 목록 진입점과 화면 전환 상태를 정리한다.

## 공통 정책
- `drawer`: 모바일 및 태블릿 세로. 목록 버튼을 표시하고 목록은 드로어로 연다.
- `tabletTwoPanel`: 아이패드 미니 등 태블릿 가로의 2패널. 목록 버튼을 표시하고 목록은 드로어로 연다.
- `threePanel`: 대형 태블릿 및 데스크톱. 좌측 목록이 항상 표시되므로 목록 버튼을 숨긴다.

## 변경 내용
- `useWorkspaceLayoutMode`가 `showListTrigger`를 직접 제공한다.
- 발주서 Topbar는 화면별 조건식을 다시 조합하지 않고 공통 정책값을 사용한다.
- 발주서 목록 드로어가 열린 상태에서 3패널로 전환되면 즉시 닫아, 다시 좁은 화면으로 복귀했을 때 이전 드로어가 자동 재개방되지 않게 한다.

## 대표 확인 폭
- iPad mini 가로: tabletTwoPanel
- iPad 10/11인치 가로: tabletTwoPanel
- iPad Pro 13인치 가로: threePanel
- Galaxy Tab 가로: 실제 CSS viewport에 따라 tabletTwoPanel 또는 threePanel
- 모든 태블릿 세로 및 좁은 분할 화면: drawer

기기 모델명 감지가 아니라 실제 CSS viewport와 방향을 기준으로 판정한다.
