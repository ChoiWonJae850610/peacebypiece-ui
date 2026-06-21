# 0.21.98 작지·발주서 리팩토링 회귀 점검

## 목적
0.21.93~0.21.97에서 진행한 작업지시서·발주서 리팩토링 이후, 빌드/타입 안정성과 고급 그리기 제거 잔여물을 우선 점검했다.

## 확인 내용
- `tldraw` 패키지는 `package.json` dependency에 없다.
- `tldraw` 관련 import 중 `app/layout.tsx`의 css import가 남아 있어 제거했다.
- `npx tsc --noEmit` 기준 TypeScript 오류는 발생하지 않았다.
- `npm run build`는 sandbox에서 `Creating an optimized production build ...` 단계에서 제한시간을 초과했다.

## 다음 로컬 확인 항목
- `npm run build`
- 작업지시서 PC 3패널 / 아이패드 미니 가로 2패널 / 모바일 드로어
- 발주서 PC 3패널 / 아이패드 미니 가로 2패널 / 모바일 드로어
- 제작공정·추가공정·자재추가 모달 수량 0 입력 시 버튼 비활성화
- 발주 품목 추가/수정 수량·단가 콤마 표시
- 발주 대상 부분할당/잔여/여유 표시
- Empty State 문구와 위치
