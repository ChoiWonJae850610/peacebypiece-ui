# 51. WAFL A-TYPE admin 화면 개발자성 placeholder 정리

## 목적

0.15.28은 고객사 관리자 화면에 남아 있던 개발자성 문구와 내부 구현 설명을 사용자용 운영 문구로 완화한 작업이다.

## 정리 대상

```txt
- /admin 홈 카드의 설계 중/준비 중 상태 라벨
- /admin/settings 정책/개선요청/사용자 권한 현황 문구
- /admin/members 승인/권한 안내 문구
- /admin/files 일부 작업 안내와 데이터 출처 라벨
- /admin/stats 기능 잠금/지표 안내 문구
- /admin 대시보드 점검 chip의 샘플 표현
```

## 정리 원칙

```txt
내부 구현 설명:
- DB, API, permission_code, role template, users 테이블, company_users 테이블
- mock, sample, fallback, preview
- 개발중, 테스트, 설계 중, 준비 중

사용자용 표현:
- 운영 데이터
- 연결 준비
- 권한 기준
- 역할별 권한
- 초기자료
- 운영 예정
- 개선 요청
```

## 이번 버전에서 실제 변경한 방향

```txt
1. 고객사 관리자 홈 카드
- 원단/부자재 발주, 요금·결제, 약관·정책 카드의 상태 라벨을 운영 예정으로 통일
- "확장할 예정", "분리할 예정" 같은 구현 계획 문장을 운영 영역 설명으로 변경

2. 환경설정
- 개발 건의를 개선 요청으로 변경
- DB 저장 없이 메일 앱으로 접수한다는 구현 설명을 제거
- 개발중 기능/후속 연결 기준을 운영 준비 항목/운영 적용 기준으로 변경
- 사용자/권한 테스트 구조를 사용자 권한 현황으로 변경

3. 멤버관리
- role template, token, permission_code, company_members, join_requests 같은 내부 용어를 사용자용 문구로 변경
- 승인/거절/권한 저장 흐름은 유지하되 구현 저장 방식 설명은 제거

4. 저장소/통계/대시보드
- 샘플, DB 대기, company_settings DB, preview 같은 표현을 초기자료, 연결 대기, 회사 설정 기준, 지표 확인으로 완화
```

## 제외한 영역

```txt
- 실제 코드 내부 변수명, 타입명, repository명
- API route 내부 에러 코드
- 서버 로그 또는 개발자 전용 내부 함수명
- DB schema / SQL / R2 purge 실제 동작
```

## 다음 작업 기준

```txt
0.16.0부터는 DeviceKind foundation으로 넘어간다.
다만 0.15.x 화면 확인 중 추가로 개발자성 문구가 발견되면 별도 핫픽스 버전에서 copy만 수정한다.
```
