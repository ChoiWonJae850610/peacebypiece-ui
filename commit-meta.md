Version :
0.10.52

Summary :
초대 가입 승인 권한 DB schema 설계

Description :
초대 링크와 QR 기반 가입 신청, 승인 대기, 고객사 멤버십, 권한 코드 직접 부여를 위한 DB schema를 추가했다. 시스템관리자 고객사 초대와 고객관리자 내부 멤버 초대를 같은 invitations 흐름으로 확장하고 role template은 기본 권한 묶음으로만 사용하는 기준을 문서화했다.

수정 파일 목록 :
- lib/constants/app.ts

추가 파일 목록 :
- db/schema/patch_0_10_52_invitation_membership_permission_schema.sql
- docs/invitation-membership-permission-schema-0.10.52.md

삭제 파일 목록 :
없음
