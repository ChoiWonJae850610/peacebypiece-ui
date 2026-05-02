Version : 0.9.60
Base Version : 0.9.59
Target Version : 0.9.60
Summary : invitation SQL 추가
Description : 초대 정책 모델을 기준으로 invitations 테이블, 초대 상태/scope/preset enum, token_hash 저장 정책, 만료 조회 view, pending 중복 방지 인덱스를 추가하고 앱 버전을 0.9.60으로 갱신했습니다. 실제 이메일 발송, 토큰 생성 API, QR UI는 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- db/schema/patch_0_9_60_invitations.sql
삭제 파일 목록 :
- 없음
