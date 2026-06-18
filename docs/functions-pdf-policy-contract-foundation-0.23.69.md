# Functions PDF Policy Contract Foundation 0.23.69

## 목적
현재 PDF 구현 사실과 아직 확정되지 않은 제품 정책을 분리한다. 정책 결정 전에는 mock contract와 validator만 제공하며 production 출력 계약을 임의로 확정하지 않는다.

## 현재 확인된 작업지시서 PDF 구현
- 작업지시서별 생성 API가 존재한다.
- 외부 generator는 A4 portrait로 호출된다.
- 외부 generator 미설정 시 서버 PDF fallback을 사용한다.
- 현재 서버 PDF에는 자재·외주 단가, 공임, 합계 금액이 포함된다.
- 생성 파일은 attachment와 R2 저장 흐름을 사용한다.

이 항목은 현재 코드 관찰값이며 최종 제품 정책이 아니다.

## 사용자 결정 대기
### 작업지시서 PDF
- 생성 가능 단계
- 금액 표시
- 납기일 종류
- 회사 로고
- 직인·서명란
- A4 세로/가로
- 이미지 배치
- 누락값 처리

### 공급처 발주 PDF
- 공급처별 개별 PDF 또는 한 파일 내 공급처별 페이지
- 원단·부자재 통합/분리
- 단가·금액·부가세 표시
- 납기일 종류
- 로고·직인·서명
- A4 세로/가로
- 누락값 처리

## 안전 원칙
- 정책 미확정 항목을 production 기본값으로 간주하지 않는다.
- 공급처 발주 PDF production route를 임의로 추가하지 않는다.
- 다른 회사·공급처 데이터가 섞이지 않아야 한다.
- 생성 실패 시 업무 원본은 변경되지 않아야 한다.
- mock 명령은 JSON 계약 보고서만 생성하며 DB/R2를 변경하지 않는다.

## 명령
- `npm run test:functions:pdf-contract`
- `npm run test:functions:pdf-mock`

## PowerShell 메뉴 후속
- `Functions PDF Contract Test`: 안전, 비파괴, runtime 제한 없음
- `Functions PDF Mock Report`: 안전, 로컬 report 파일만 생성
- 최종 PDF E2E는 정책 확정 후 별도 메뉴로 추가
