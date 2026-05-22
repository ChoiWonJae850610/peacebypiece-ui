Version :
0.15.73.1

Summary :
작업지시서 화면 현재 사용자 매칭 기준 보정

Description :
작업지시서 화면에서 세션 사용자와 멤버 권한 목록의 사용자를 사용자 ID뿐 아니라 companyMemberId로도 매칭하도록 보정했다. 멤버 권한에서 작업지시서 관리가 체크된 디자이너가 현재 사용자로 정확히 선택되어 작업지시서 생성 버튼이 표시될 수 있도록 사용자 접근 프로필에 companyMemberId를 포함했다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/settings/userAccessRepository.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- types/user.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
