Version : 0.15.73.7
Summary : 발주정보 편집 즉시 저장 정책 보정
Description : 발주정보의 공장, 납기일, 우선순위 값이 생산구성 저장 버튼 이전에 즉시 DB 저장을 유발하지 않도록 저장 정책을 보정했습니다. 제목과 담당자 등 즉시 저장 필드는 유지하고, 발주정보 요약 필드는 생산구성 저장 흐름의 draft-only 필드로 이동했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/storagePolicy.ts
추가 파일 목록 :
삭제 파일 목록 :
