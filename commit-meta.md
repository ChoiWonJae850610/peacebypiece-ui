Version : 0.17.58
Summary : 진행단계 Framer Motion 의존성 빌드 오류 보정
Description : framer-motion 패키지가 로컬 node_modules에 설치되지 않은 상태에서 빌드가 실패하지 않도록 WorkflowProgressPanel의 애니메이션 처리를 외부 라이브러리 없이 SVG/CSS transition 기반으로 되돌렸습니다. package.json과 package-lock.json에서 framer-motion 의존성을 제거하고, 누적 테스트 항목은 pending-tests.md로 유지했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/common/workflow/WorkflowProgressPanel.tsx
- package.json
- package-lock.json
- pending-tests.md
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
