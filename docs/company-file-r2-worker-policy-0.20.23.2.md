# 0.20.23.2 회사 파일 R2 Worker key policy 보정

## 배경

대표 이미지와 사업자등록증 업로드는 Next.js 업로드 준비 API에서 R2 Worker 업로드 URL을 정상 생성했지만, 브라우저의 R2 Worker `PUT` 요청에서 `INVALID_WORKER_FILE_REQUEST`가 반환되었다.

확인된 요청 형태:

```txt
companies/{companyId}/company-files/representative_image/{fileId}.jpg
companies/{companyId}/company-files/business_registration/{fileId}.pdf
```

Next 앱의 회사 파일 정책은 위 경로를 허용하지만, Cloudflare R2 upload worker의 `isSafeStorageKey()`는 기존 작업지시서 첨부 및 온보딩 파일 경로만 허용하고 있었다. 따라서 Worker가 회사 파일 경로를 안전한 key로 인정하지 않아 400을 반환했다.

## 반영 내용

- `cloudflare/r2-upload-worker.js`에 회사 파일 key pattern 추가
- 허용 경로:
  - `companies/{companyId}/company-files/representative_image/{fileId}.{jpg|png|webp}`
  - `companies/{companyId}/company-files/business_registration/{fileId}.{jpg|png|webp|pdf}`
- 대표 이미지 허용 MIME:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- 사업자등록증 허용 MIME:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `application/pdf`
- 대표 이미지 최대 크기: 5MB
- 사업자등록증 최대 크기: 10MB
- 기존 작업지시서 첨부, 썸네일, 온보딩 파일 경로는 유지

## 운영 확인

이 패치만 앱에 적용해도 배포된 Worker가 자동으로 바뀌지는 않는다. `cloudflare/r2-upload-worker.js` 변경사항을 Cloudflare Worker에 배포해야 실제 업로드 실패가 해결된다.

확인 순서:

```powershell
Push-Location "C:\CWJ_Project\peacebypiece-2.0"
cmd.exe /d /c "chcp 65001 > nul & npm run build"
Pop-Location
```

이후 Worker 배포 절차를 실행한 뒤 대표 이미지와 사업자등록증 업로드를 다시 확인한다.

## 주의

- R2 Worker secret, signature, token 원문은 로그에 남기지 않는다.
- 기존 작업지시서 첨부/메모/디자인 파일 업로드 경로는 변경하지 않는다.
- DB schema/API/휴지통/purge 흐름은 변경하지 않는다.
