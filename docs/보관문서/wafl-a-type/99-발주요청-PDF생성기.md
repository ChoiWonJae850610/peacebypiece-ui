# 0.15.99 발주서 PDF 생성 구조 전환

## 결정

발주서 PDF는 기존 좌표 기반 PDF 직접 그리기 방식에서 HTML 기반 PDF Generator 구조로 전환한다.

## 이유

- 발주요청 모달 양식과 동일한 표/칸 정렬을 유지하기 어렵다.
- 한글 자간, 줄간격, 표 baseline을 좌표 기반 PDF로 계속 보정하는 것은 유지보수성이 낮다.
- 향후 발주서 외에도 작업지시서, 거래명세서, 견적서 등 문서 생성 기능으로 확장될 수 있다.

## 구조

1. 앱 내부에서 발주서 HTML 문서를 생성한다.
2. `WAFLOW_PDF_GENERATOR_URL`이 설정되어 있으면 외부 PDF Generator로 HTML을 전송한다.
3. PDF Generator는 `application/pdf`를 반환한다.
4. 앱은 반환된 PDF를 기존 R2/Neon 첨부파일 등록 흐름에 연결한다.
5. PDF Generator가 설정되지 않은 환경에서는 기존 내부 PDF 생성 fallback을 유지한다.

## PDF Generator 계약

Request:

```json
{
  "html": "<!doctype html>...",
  "fileName": "발주서_작업지시서_2026-05-23_2350_담당자.pdf",
  "format": "A4",
  "orientation": "portrait"
}
```

Response:

- HTTP 200
- `Content-Type: application/pdf`
- body: PDF binary

## 환경변수

```env
WAFLOW_PDF_GENERATOR_URL=""
WAFLOW_PDF_GENERATOR_TOKEN=""
```

`WAFLOW_PDF_GENERATOR_TOKEN`은 선택값이다. 설정되면 앱은 `Authorization: Bearer <token>` 헤더를 보낸다.

## 현재 한계

0.15.99에서는 앱 내부에 HTML 템플릿과 외부 Generator 호출 구조를 추가한다. 실제 별도 PDF Generator 서버/Worker 구현은 후속 버전에서 진행한다.
