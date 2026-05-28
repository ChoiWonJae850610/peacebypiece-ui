Version : 0.18.07
Summary : 인라인 select 중복 저장 방지 보정
Description : AppInlineSelectEditor의 onChange/Enter/Escape 이후 blur 이벤트가 같은 commit 또는 cancel 흐름을 다시 실행하지 않도록 보정했습니다. 작업지시서 상세 인라인 select의 autoFocus, blur 저장, Enter 저장, Escape 취소 흐름은 유지했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/common/ui/AppInlineSelectEditor.tsx
추가 파일 목록 :
- docs/ui-inline-select-editor-0.18.07.md
삭제 파일 목록 :
- 없음
