# 0.9.22413 저장소관리 영어 locale 복구

## 목적

0.9.22412에서 영어 locale에서도 저장소관리 화면을 한국어로 표시하도록 우회한 결과, 영어 상태에서 `/admin/files`와 좌측 메뉴가 한국어로 보이는 문제가 발생했다. 이번 버전은 `en/admin.ts`의 저장소관리 및 관리자 내비게이션 문구를 다시 영어 기준으로 복구한다.

## 반영 내용

- `filesPage` 영어 문구 복구
- `navigation` 영어 문구 복구
- `filesSummary` 영어 문구 복구
- `filesList` 영어 문구 복구
- `trashPage` 영어 문구 복구
- `topbar.summaries.storage` 영어 문구 복구

## 범위

이번 버전은 i18n dictionary 보정만 수행한다. 삭제일시 시간 차이 문제는 다음 버전에서 별도 점검한다.

## 확인 항목

1. 영어 locale에서 `/admin/files` 진입
2. 좌측 메뉴가 `Dashboard`, `Work Orders`, `Partners`, `Storage`, `Statistics`, `History`, `Settings`로 표시되는지 확인
3. 저장소 페이지 제목이 `Storage`로 표시되는지 확인
4. 저장소 요약 카드가 `Storage usage`, `File operations summary`, `File type`로 표시되는지 확인
5. 휴지통 제목과 버튼이 `Trash`, `Restore`, `Request deletion`, `Empty trash`로 표시되는지 확인
6. 한국어 locale에서는 기존 한국어 문구가 유지되는지 확인
