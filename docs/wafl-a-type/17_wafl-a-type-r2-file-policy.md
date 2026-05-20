---
title: WAFL A-TYPE R2 File Policy
version: 0.5
baseline_source: peacebypiece-ui-0.14.8
status: draft-final
updated: 2026-05-20
---

# 17. R2 / 파일 / Preview / Purge 정책

## 1. 목적

Cloudflare R2에 저장되는 파일의 key 구조, 접근 권한, preview/download, 삭제/purge 정책을 정의한다.

## 2. 기본 원칙

```txt
- 모든 업무 파일은 companyId scope를 포함한다.
- legacy workorders/{workOrderId}/... 경로는 새 코드에서 사용하지 않는다.
- 실제 R2 endpoint, bucket URL, secret, token은 문서/응답/commit에 포함하지 않는다.
- DB는 파일 metadata와 삭제 상태를 관리하고, R2는 object를 보관한다.
```

## 3. 표준 R2 key

```txt
companies/{companyId}/onboarding/logo/{fileId}.{ext}
companies/{companyId}/onboarding/business-license/{fileId}.{ext}
companies/{companyId}/workorders/{workOrderId}/design/{fileId}.{ext}
companies/{companyId}/workorders/{workOrderId}/attachments/{fileId}.{ext}
companies/{companyId}/workorders/{workOrderId}/memos/{fileId}.{ext}
companies/{companyId}/exports/workorders/{workOrderId}/pdf/{fileId}.pdf
```

## 4. onboarding 파일

```txt
- 고객사 관리자 승인 요청 전 작성 중인 파일은 즉시 R2 업로드하지 않는다.
- 승인 요청 submit 시 DB 저장과 R2 업로드를 함께 처리한다.
- 중간 이탈/새로고침으로 abandoned DB/R2 record를 만들지 않는다.
```

## 5. preview/download 권한

```txt
- preview route는 session companyId와 file metadata companyId를 비교한다.
- download route도 동일하게 권한을 확인한다.
- 시스템관리자 preview는 별도 system route에서 처리한다.
- 공개 URL을 직접 노출하지 않는다.
```

## 6. 삭제 / 휴지통 / purge

```txt
고객사 관리자:
- 삭제 요청 또는 휴지통 이동까지 처리
- 즉시 R2 object 삭제는 기본으로 하지 않는다.

시스템관리자:
- purge 후보 확인
- 보존 기간 도래 후 실제 삭제 처리
- purge 이력/audit log 기록
```

## 7. 작업지시서 PDF 공유

```txt
- PDF 파일 자체보다 PDF 링크 공유를 기본으로 한다.
- 초기 권장 방식은 로그인 필요 링크다.
- 외부 공유가 필요하면 만료 시간이 있는 공유 링크를 별도 설계한다.
```

## 8. 금지

```txt
- legacy workorders/{workOrderId}/... 경로 신규 생성
- R2 signed/public URL을 장기 저장
- 권한 확인 없는 preview/download
- 고객에게 “연결 첨부” 같은 내부 표현 노출
- R2 secret이나 실제 bucket URL 커밋
```

## 9. QA

```txt
[ ] 다른 companyId 파일 preview가 차단되는가?
[ ] 삭제 요청 후 R2 object가 즉시 삭제되지 않는가?
[ ] purge는 시스템관리자 흐름에서만 실행되는가?
[ ] legacy key를 새로 만들지 않는가?
[ ] 실제 R2 URL/secrets가 문서나 patch에 포함되지 않았는가?
```
