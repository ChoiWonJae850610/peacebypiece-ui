Version : 0.16.2.1
Summary : 발주서 PDF 대표 이미지 조회 경로 보정
Description : 발주서 PDF/HTML 미리보기 대표 이미지 조회 시 R2 Worker GET 경로를 우선 사용하고, 이미지 첨부 탐색과 MIME 판정을 보강해 대표 이미지가 PDF에 삽입되지 않던 문제를 보정합니다. 기존 PDF Generator Worker와 R2 Worker 코드는 수정하지 않습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/generated-documents/order-request/orderRequestRepresentativeImage.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
