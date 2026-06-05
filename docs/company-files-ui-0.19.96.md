# 고객사 회사 파일 UI 1차 (0.19.96)

## 목적

0.19.95에서 추가한 `company_files` DB/API skeleton을 고객사 관리자 환경설정 화면에서 확인할 수 있게 연결한다.

## 적용 범위

- 환경설정 > 계정 정보 패널에 회사 파일 섹션 추가
- 대표 이미지와 사업자등록증 슬롯 표시
- 현재 등록 파일명, 크기, MIME type, 등록일 표시
- 사업자등록증 검토 상태 표시
- 등록/변경 버튼 배치
- Playwright 환경설정 smoke mock에 회사 파일 API 응답 추가

## 미적용 범위

- 실제 파일 선택
- R2 업로드
- 다운로드/미리보기
- 시스템관리자 승인/반려 처리

위 기능은 0.19.97 이후 R2 업로드 연결 및 0.19.99 시스템관리자 검토 화면에서 분리 적용한다.

## 테스트 기준

로컬에서 다음 자동테스트를 실행한다.

```bash
npm run test:e2e
npm run test:smoke:db-api
npm run build
```

`workspace settings provides a legal policy entry point` 테스트는 환경설정 화면에서 `대표 이미지`, `사업자등록증`, `회사 파일` 문구 중 일부를 확인한다.
