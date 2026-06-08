# 0.20.41 직접그리기 모바일 최상단 레이어 보정

## 목적
모바일/태블릿에서 직접그리기 캔버스를 터치했을 때 뒤쪽 첨부 버튼 또는 파일 선택 input이 눌리는 문제를 방지한다.

## 변경
- ModalShell/BaseModal에 rootClassName 전달 옵션을 추가했다.
- 직접그리기 모달 root를 앱 최상단 z-index 레이어로 올렸다.
- 직접그리기 모달이 열린 동안 body에 `data-pbp-drawing-modal-open="true"`를 부여한다.
- 직접그리기 모달이 열린 동안 첨부 업로드 zone과 file input의 pointer event를 차단한다.
- 캔버스 wrapper에 `pointer-events-auto`, `touch-none`, 최상단 stacking context를 명시했다.

## 비변경
- PC 3패널 구조 변경 없음.
- 태블릿 구조 변경 없음.
- 상태전환/권한/API/DB/R2/첨부/메모/휴지통/purge 흐름 변경 없음.
