# Pipeline repo-state publication fix 0.23.86

## 증상

백그라운드 다운로드 watcher로 패치를 적용하면 Git push와 Build는 완료되지만 `repo-state-*.txt`가 최신 산출물 폴더에 남지 않을 수 있었다.

## 원인

repo-state 생성이 Git push 조건문 내부에 있었고, 최신 산출물 복사가 프로세스 메모리의 `LatestRepoStatePath` 값에만 의존했다.

## 수정

- repo-state 생성을 Git push 조건에서 분리했다.
- Build 검증 뒤 최종 프로젝트 상태를 기준으로 repo-state를 반드시 생성한다.
- 메모리 경로가 비어 있으면 Repo_Status 폴더의 최신 repo-state를 다시 탐색한다.
- Newest 폴더 복사 시 탐색된 실제 파일 경로를 사용한다.
- 패치 처리 시작 때 최신 산출물 경로 변수를 초기화한다.
