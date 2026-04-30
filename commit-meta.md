Version: 0.9.17

Summary: 첨부 업로드 제한 정책을 클라이언트 입력 단계까지 연결

Description:
- APP_VERSION을 0.9.17로 갱신했습니다.
- lib/constants/app.ts는 APP_VERSION 외 export를 유지했습니다.
- 디자인 첨부와 일반 첨부의 허용 파일 형식을 중앙 정책 기준으로 분리했습니다.
- 파일 선택 input의 accept 값을 업로드 scope에 맞게 적용했습니다.
- 파일 선택창을 열기 직전에 accept 속성을 갱신해 React 상태 반영 지연으로 잘못된 파일 선택 조건이 남는 문제를 방지했습니다.
- 업로드 정책에서 0byte 또는 비정상 size 파일을 거부하도록 보강했습니다.

수정 파일 목록:
- lib/constants/app.ts: APP_VERSION만 0.9.17로 변경, 나머지 export 유지
- lib/workorder/persistence/workOrderAttachmentPolicy.ts: 허용 MIME/확장자 정책에 input accept 정책 추가 및 비정상 파일 크기 검증 보강
- lib/workorder/attachments/attachmentActions.ts: 파일 선택창 오픈 직전 accept 속성 적용 지원
- lib/hooks/workorder/useWorkOrderAttachments.ts: 업로드 scope별 accept 정책 연결
- lib/hooks/useWorkOrder.ts: 현재 첨부 input accept 값을 WorkOrderWorkspace로 전달
- components/workorder/WorkOrderWorkspace.tsx: WorkOrderOverlay에 첨부 input accept 전달
- components/workorder/WorkOrderOverlay.tsx: 고정 accept 상수 대신 scope 기반 accept prop 사용
- lib/permissions/attachments.ts: 사용하지 않는 고정 ATTACHMENT_INPUT_ACCEPT 상수 제거

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
- 디자인 업로드는 JPG/JPEG/PNG/WEBP만 선택되도록 제한했습니다.
- 일반 첨부 업로드는 JPG/JPEG/PNG/WEBP/PDF만 선택되도록 제한했습니다.
- 서버 검증 정책과 브라우저 파일 선택 조건이 같은 정책 파일을 기준으로 동작하도록 정리했습니다.
- Worker 쪽 MIME/크기 검증 구조는 기존 0.9.16 보안 복구 내용과 충돌하지 않도록 유지했습니다.

검증:
- node --check cloudflare/r2-upload-worker.js 실행
- npm run build는 압축파일에 node_modules가 포함되어 있지 않아 이 환경에서는 실행하지 못했습니다.
