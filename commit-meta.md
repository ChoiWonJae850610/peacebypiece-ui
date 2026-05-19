Version :
0.13.95

Summary :
작업지시서와 첨부 메모 저장소의 mock 모드 제거

Description :
작업지시서, 협력업체 구형 저장소 타입, 첨부 메모 저장소의 mock 모드 선택지를 제거하고 DB 전용 모드로 고정했다. 더 이상 사용하지 않는 mock 작업지시서 저장소와 mock 첨부 메모 저장소, 관련 seed 파일을 삭제했다. 실제 로그인 세션과 DB 기준 흐름을 유지하기 위한 정리이며 화면 기능과 R2 흐름은 변경하지 않았다.

수정 파일 목록 :
- lib/repositories/workorderRepository.ts
- lib/repositories/workorderRepositoryMode.ts
- lib/repositories/workorderRepositoryFactory.ts
- lib/repositories/partnerRepository.ts
- lib/workorder/persistence/attachmentMemoRepository.ts
- lib/workorder/persistence/attachmentMemoAdapter.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
- lib/repositories/mockWorkorderAdapter.ts
- lib/repositories/mockWorkorderRepository.ts
- lib/workorder/persistence/mockAttachmentMemoRepository.ts
- lib/data/mock/seedState.ts
- lib/data/mock/users.ts
- lib/data/mock/workorders.ts
