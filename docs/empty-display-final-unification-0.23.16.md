# 0.23.16 빈 값 표시 최종 통일

## 적용 범위
- 자재 발주 납기일 빈 값 표시를 `EMPTY_DISPLAY`로 통일
- 담당자 배정 모달의 현재 담당자 빈 값 표시를 `EMPTY_DISPLAY`로 통일
- 작업지시서 기본정보 편집 모달의 분류 fallback을 `EMPTY_WORKORDER_SELECT_DISPLAY`로 통일
- 발주요청 문서 미리보기의 금액, 수량, 날짜, 공급처, 품목명, 단위, 외주공정 빈 값 표시를 `EMPTY_DISPLAY`로 통일

## 제외 범위
- `공장 미지정`, `공급처 미선택`, `품목 미입력`처럼 업무 의미가 있는 상태 문구
- PDF 출력 전용 fallback
- 작업 이력의 이전값/변경값 표시

## DB Migration
없음
