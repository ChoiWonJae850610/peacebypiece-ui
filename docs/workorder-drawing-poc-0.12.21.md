# PeaceByPiece 작업지시서 직접 그리기 PoC — 0.12.21

## 목적

작업지시서 디자인 첨부 영역에서 `직접 그리기`를 눌렀을 때 실제로 스케치 가능한 1차 모달을 제공한다.

이번 버전은 tablet을 켜고 입력감을 바로 확인하기 위한 PoC다. 저장 결과는 PNG `File` 객체로 만들어 기존 디자인 첨부 업로드 흐름에 넘긴다.

## 이번 버전 범위

- 디자인 패널의 `직접 그리기` 메뉴를 안내 placeholder가 아니라 실제 drawing modal로 연결
- PC / tablet / mobile 공통 modal shell 사용
- 펜 / 지우개 / 전체 지우기 / 디자인으로 저장 제공
- pointer event 기반 입력으로 tablet pen, touch, mouse를 같은 흐름에서 테스트
- canvas 결과를 PNG 파일로 변환해 기존 `onUploadFiles` 흐름 재사용
- 별도 DB table, R2 API, attachment API 변경 없음

## 라이브러리 판단

0.12.20 설계 기준의 1차 후보는 tldraw다. 다만 이번 0.12.21은 실제 tablet 입력과 저장 흐름을 빠르게 확인하기 위해 의존성 없는 native canvas PoC로 먼저 연결했다.

이 방식은 다음 판단을 빠르게 할 수 있다.

1. 직접 그리기 버튼 위치가 적절한가
2. modal 높이와 모바일 닫기 UX가 맞는가
3. tablet pen/touch 입력이 작업지시서 UI 안에서 충돌하지 않는가
4. PNG로 저장해 기존 디자인 첨부 흐름에 넘기는 정책이 맞는가
5. tldraw 같은 full editor가 필요한 수준인지, 단순 스케치 모드로 충분한지

## 다음 단계 후보

### 0.12.22 후보 A — tldraw PoC 전환

- `tldraw` package 추가
- native canvas modal을 tldraw 기반 modal로 교체 또는 병행
- text / shape / undo / redo 사용성 확인
- package-lock 변경 필요

### 0.12.22 후보 B — native canvas 강화

- undo / redo 추가
- 선 굵기 선택 추가
- 색상 선택 추가
- 저장 전 미리보기/확인 추가

## 테스트 기준

- PC: 마우스로 선 그리기, 지우기, 저장 확인
- Tablet: 펜 입력, 손가락 입력, 스크롤 충돌 여부 확인
- Mobile: 작은 화면에서 modal 닫기, 간단 선 그리기, 저장 확인
- Theme: default-light / beige-atelier / cold-winter / black-and-white / soft-emerald에서 modal chrome 대비 확인
- Upload: 저장 후 디자인 첨부 목록에 PNG 파일이 추가되는지 확인

