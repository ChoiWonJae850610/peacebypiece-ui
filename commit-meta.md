# commit-meta

## Version
0.9.1 → 0.9.2

## Summary
고객사 내부 사용자 초대 미리보기 추가

## Description
시스템 관리자 화면에 고객사 관리자가 디자이너와 검수자를 초대하는 내부 사용자 초대 상태 미리보기 영역을 추가하고, 관련 샘플 데이터와 i18n 문구를 분리했습니다. APP_VERSION을 0.9.2로 갱신했습니다.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.9.2로 갱신.
- lib/data/domain/system.ts: 고객사 내부 사용자 초대 요약 타입 추가.
- lib/data/sample/system.ts: 디자이너/검수자 내부 초대 샘플 데이터 추가.
- lib/i18n/ko/system.ts: 내부 사용자 초대 섹션 한글 문구 추가.
- lib/i18n/en/system.ts: 내부 사용자 초대 섹션 영문 문구 추가.
- app/system/page.tsx: /system 화면에 내부 사용자 초대 상태 미리보기 섹션 추가.

## 작업 상세 내용
- 0.9.2 목표인 고객사 관리자의 디자이너/검수자 초대 흐름을 /system 화면에서 확인할 수 있도록 샘플 기반 섹션을 추가했습니다.
- company_users 연결 상태와 역할별 권한 기준을 표시하도록 데이터 필드를 분리했습니다.
- 기능 실행 로직이나 실제 인증/초대 발송 로직은 추가하지 않았습니다.
- UI에서 DB를 직접 호출하지 않았습니다.
- package.json 및 package-lock.json은 수정하지 않았습니다.
