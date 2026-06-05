# 고객사 회사 파일 R2 업로드 연결 1차 (0.19.97)

## 목적

0.19.95에서 추가한 `company_files` DB/API 기준과 0.19.96에서 추가한 환경설정 UI를 실제 R2 Worker 업로드 흐름에 연결한다.

## 적용 범위

- 환경설정 > 회사 파일 섹션에서 파일 선택 가능
- 대표 이미지 업로드
- 사업자등록증 업로드
- R2 Worker presigned PUT URL 생성
- 업로드 성공 후 `company_files` 메타데이터 저장
- 같은 `file_type` 재등록 시 이전 활성 메타데이터를 교체 처리

## R2 key 기준

```txt
companies/{companyId}/company-files/{fileType}/{fileId}.{extension}
```

예시:

```txt
companies/company-a/company-files/representative_image/{uuid}.png
companies/company-a/company-files/business_registration/{uuid}.pdf
```

## 파일 정책

| file_type | 허용 MIME | 최대 크기 | 검토 상태 |
| --- | --- | ---: | --- |
| representative_image | image/jpeg, image/png, image/webp | 5MB | not_required |
| business_registration | image/jpeg, image/png, image/webp, application/pdf | 10MB | pending_review |

## API 흐름

1. `POST /api/admin/company-files/upload`
   - 파일 타입, 원본명, MIME, 크기 검증
   - R2 Worker 업로드 URL 생성
   - storageKey 반환
2. 브라우저가 R2 Worker URL로 `PUT`
3. `POST /api/admin/company-files`
   - storageKey가 현재 회사와 fileType 범위에 맞는지 재검증
   - 메타데이터 저장

## 제외 범위

- 시스템관리자 파일 검토 UI/API
- 파일 미리보기/다운로드
- 이전 R2 오브젝트 자동 삭제
- 저장소 사용량 제한

이 제외 범위는 후속 버전에서 분리한다.

## 자동테스트 기준

`tests/e2e/workspace-policy-settings.spec.mjs`에서 회사 파일 업로드 흐름을 mock 기반으로 검증한다.

- `/api/admin/company-files/upload` 업로드 준비 응답 mock
- R2 Worker `PUT` 응답 mock
- `/api/admin/company-files` 메타데이터 저장 응답 mock
- 업로드 후 새 파일명이 환경설정 화면에 표시되는지 확인

실제 R2 Worker 서명·업로드는 로컬/배포 환경 변수 설정 후 별도 통합 테스트로 확인한다.
