# 관리자 파일 관리 화면 read-only 복원

Version: 0.9.98

## 목적

0.9.93에서 회귀 점검 화면으로 대체된 `/admin/files`를 read-only 파일 관리 화면으로 복원한다.

## 이번 패치 기준

1. `/admin/files` route를 `AdminFilesReadOnlyPage`로 연결한다.
2. 기존 `/api/admin/files/snapshot` GET API를 사용한다.
3. 첨부파일 목록, 휴지통, 저장소 사용량, 최근 업로드 추이, 파일 유형 분포를 read-only로 표시한다.
4. 업로드, 삭제, 복구, 영구삭제, purge worker 실행 버튼은 추가하지 않는다.
5. 기존 첨부 업로드/삭제/다운로드/R2/DB 저장 흐름은 수정하지 않는다.
6. 기존 파일 관리 actionFlow/serverActions/API는 수정하지 않는다.

## 수정 범위

- `app/admin/files/page.tsx`
- `components/admin/files/AdminFilesReadOnlyPage.tsx`
- `lib/constants/app.ts`

## 제외

- 첨부 업로드
- 첨부 삭제
- 첨부 복구
- 첨부 영구삭제
- R2 실제 삭제
- 다운로드 route
- DB schema 변경
- package.json 변경

## 다음 작업

0.9.99에서 `/admin/history` 히스토리 화면 read-only 복원을 진행한다.
