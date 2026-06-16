# Work order factory instruction UI 0.22.97

- 공장 전달사항은 작업지시서당 하나의 문서형 필드로 표시한다.
- WaflDocumentField가 텍스트 입력, 글자 수, 저장 상태, 잠금 사유, 내용 비우기를 공통 처리한다.
- PC와 태블릿 우측 패널, 모바일 관련 정보 도구에서 같은 WorkOrderFactoryInstructionPanel을 사용한다.
- 기존 작업지시서 편집 권한과 단계 잠금 결과를 재사용한다.
- 내용이 비어 있으면 저장 시 서버에서 데이터가 제거되고 향후 PDF에서는 해당 섹션을 숨긴다.
