# Simulator R2 Local Cleanup 0.23.74

## 목적

로컬 R2 simulator가 생성한 임시 파일과 manifest를 안전하게 제거하고 반복 실행 시 산출물이 누적되지 않게 한다.

## 명령

```bash
npm run simulator:r2:cleanup-local
```

## 삭제 허용 경로

- `.tmp/simulator/r2/files`
- `.tmp/simulator/r2/manifests`

위 경로가 정확히 일치하지 않거나 프로젝트의 `.tmp/simulator/r2` 밖이면 실행을 중단한다. DB와 실제 R2에는 접근하지 않는다.

## Generate 동작

`npm run simulator:r2:generate`는 기존 두 로컬 출력 폴더를 먼저 정리한 뒤 새 fixture와 manifest를 생성한다. 따라서 재실행해도 오래된 파일이나 manifest가 누적되지 않는다.
