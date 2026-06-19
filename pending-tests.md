# Pending tests — 0.23.81

- 활성 `system_users.system_admin` Google 이메일로 로그인 후 `/dev/test-console` 접근 확인
- 같은 계정으로 `/ui`, `/functions` 접근 확인
- 고객사 관리자 및 일반 멤버 Google 계정에서 세 route가 차단되는지 확인
- production 또는 runtime 미허용 상태에서 `/ui`, `/functions`, `/dev/test-console` 차단 확인
- 시스템관리자 → 테스트 회사 관리자/멤버 전환 후 `/dev/test-console`, `/ui`, `/functions` 재접근 확인
- 원래 사용자 복구 후 `/system` 접근 확인
- 다른 활성 시스템관리자 계정이 전환 목록에 노출되거나 전환되지 않는지 확인
- `/api/dev/test-context/options`, `/switch`, `/clear`의 403 `SYSTEM_ADMIN_REQUIRED` 확인
- 전환/복귀 audit log 확인
- Seed 회사 역할이 `company_members` 기반 콘솔 대상 목록에 실제 표시되는지 후속 확인
- PowerShell 개발·테스트 도구 9번 `Reset Database Schema` 재실행
- `full_reset.sql`, `scenario_seed.sql`, `scenario_google_login_seed.sql`, `system_admin_bootstrap_kty872.sql` 4개 모두 OK 확인
- Reset 후 수정한 시스템관리자 Google 이메일로 로그인 확인
- npm run build 미실행 — 사용자가 로컬에서 확인.

## 0.23.82
- [ ] PowerShell 21번 Simulator DB Seed Execute 재실행 후 `companyMembers: 193` 집계 확인
- [ ] `/dev/test-console`에서 wafl-fn 회사 A~J와 역할 표시 확인
- [ ] 시스템관리자 → 회사 역할 전환 후 `/worker`, `/workspace`, 발주서 데이터 확인
- [ ] 원래 시스템관리자 복구 및 내부 route 재접근 확인
- [ ] `/system` 하단 내부 도구 카드 3개 및 runtime 표시 확인
- [ ] production에서 내부 도구 카드와 세 route 차단 확인


## 0.23.83
- [ ] PowerShell 21번 Simulator DB Seed Execute 재실행 후 ExitCode 0 확인
- [ ] totals에서 `companyUsers: 193`, `companyMembers: 193` 확인
- [ ] suspended 회사 멤버의 `status`, `suspended_by`, `suspended_at` 정합성 확인
- [ ] `/dev/test-console`에서 wafl-fn 회사 A~J와 역할 표시 확인
- [ ] npm run build 미실행 — 사용자가 로컬에서 확인.

## 0.23.84
- [ ] 메인 메뉴 1번 실행 시 `download-watcher.ps1` 감시 화면 진입 확인
- [ ] 감시 중 M 키로 메인 메뉴 복귀 확인
- [ ] `.crdownload`, `.tmp`, `.download`, `.partial` 파일 제외 동작 확인
- [ ] flat patch ZIP 다운로드 후 압축 해제, commit-meta 파싱, 패치 처리 정상 확인
- [ ] 개별 flat 파일 패치 처리 정상 확인
- [ ] 실패 패치의 failed archive 이동 확인
- [ ] 기존 npm dev 토글, 자동 build 토글, 개발·테스트 메뉴 회귀 확인
- [ ] 다음 단계에서 watcher 백그라운드 PID ON/OFF 및 메인 메뉴 1~5 재배치 적용
- [ ] npm run build 미실행 — 사용자가 로컬에서 확인.


## 0.23.85
- [ ] 메인 메뉴 1번으로 다운로드 watcher ON 후 메뉴가 즉시 복귀하고 상태가 ON으로 표시되는지 확인
- [ ] 메인 PowerShell 종료 후 watcher 프로세스가 계속 실행되는지 확인
- [ ] 메인 재실행 후 기존 watcher PID를 찾아 ON으로 표시하는지 확인
- [ ] 메뉴 1번 OFF로 해당 watcher 프로세스만 종료되는지 확인
- [ ] watcher 중복 실행이 차단되는지 확인
- [ ] 죽은 PID 및 watcher가 아닌 재사용 PID가 자동 정리되는지 확인
- [ ] download-watcher-state.json heartbeat 갱신 및 download-watcher.log 기록 확인
- [ ] 메뉴 3 자동 Build 토글 변경이 실행 중 watcher에 반영되는지 확인
- [ ] 메뉴 순서 1 watcher / 2 npm dev / 3 자동 Build / 4 Flush / 5 개발·테스트 확인
- [ ] 0번 종료 시 watcher와 npm dev가 유지된다는 안내 확인
- [ ] npm run build 미실행 — 사용자가 로컬에서 확인.


## 0.23.86 repo-state publication
- [ ] 백그라운드 watcher 패치 적용 후 Repo_Status에 repo-state가 생성되는지 확인
- [ ] 4. Newest 폴더에 동일 repo-state가 복사되는지 확인
- [ ] Build ON/OFF 양쪽에서 repo-state가 생성되는지 확인
- [ ] Git 변경 없음 경로에서도 repo-state 누락이 없는지 확인


## 0.23.87 Functions structure
- [ ] `/functions`에서 기능 명세 / 테스트 시나리오 / 자동화 현황 / 개발 도구 전환 확인
- [ ] 보기 전환 시 검색·필터가 초기화되고 해당 영역만 표시되는지 확인
- [ ] 자동화 완료 항목에 불필요한 정상 배지가 표시되지 않는지 확인
- [ ] 미자동화·부분 자동화·수동·정책 미확정·실패·차단만 강조되는지 확인
- [ ] 개발 도구 보기에서 테스트 환경 항목과 fixture 요약 표시 확인
- [ ] 자동화 현황 표의 파일 경로·최근 결과·상태 확인
- [ ] PC·태블릿·모바일에서 탭과 상세 패널 overflow 확인
- [ ] npm run build 미실행 — 사용자가 로컬에서 확인.

## 0.23.88 System dashboard real data
- [ ] `/system` 진입 시 고정 예시 고객사명이 표시되지 않는지 확인
- [ ] 전체 고객사·활성 고객사·승인 멤버·작업지시서 수가 DB와 일치하는지 확인
- [ ] 최신 `storage_usage_snapshots`와 활성 `company_subscriptions` 기준 저장용량 합계 확인
- [ ] 고객사별 저장용량 비율 70% 이상·100% 이상 상태 표시 확인
- [ ] 고객사가 없을 때 빈 상태 표시 확인
- [ ] DB 연결 실패 시 오류 상태와 새로고침 버튼 확인
- [ ] 시스템관리자 권한이 없는 계정에서 `/api/system/stats` 접근 차단 확인
- [ ] PC·태블릿·모바일에서 통계 단일 패널과 고객사 목록 overflow 확인
- [ ] npm run build 미실행 — 사용자가 로컬에서 확인.

## 0.23.89 시스템관리자 주요 화면 제품화
- [ ] `/system/billing`이 실제 DB 고객사·구독·저장용량 집계를 표시하는지 확인
- [ ] 샘플 고객사·샘플 요금제 변경 미리보기가 화면에 남아 있지 않은지 확인
- [ ] DB 미설정·조회 실패 시 오류 상태가 표시되는지 확인
- [ ] 고객사 없음·요금제 없음 빈 상태 확인
- [ ] 저장용량 70%·100% 경고 배지와 진행률 확인
- [ ] PC·태블릿·모바일 레이아웃 확인


## 0.23.90 고객사 메인·작업지시서 compact UI
- [ ] 고객사 관리자 메인에서 검토/발주/검수/입고 지연 queue가 실제 DB 수치와 일치한다.
- [ ] 작업지시서와 원단·부자재 발주 바로가기가 정상 이동한다.
- [ ] queue 선택 시 최대 8개 목록과 전체 보기 이동이 정상이다.
- [ ] 정상 업무 카드에는 상태 배지가 없고 미완성 항목만 표시된다.
- [ ] 작업지시서 목록 카드가 PC·태블릿·모바일에서 과도하게 크지 않다.

## 0.23.91 고객사 가입·멤버 초대
- [ ] `/workspace/invites` 직접 접근 시 `/workspace/members?section=invitations`로 이동
- [ ] 조회 전용(viewer) 역할 초대 생성
- [ ] 동일 회사·동일 이메일의 유효 초대 중복 생성 시 409와 안내 문구 표시
- [ ] 기존 초대 취소 후 동일 이메일 재초대 가능
- [ ] 기존 초대 만료 후 동일 이메일 재초대 가능
- [ ] 다른 고객사에서는 동일 이메일 초대 가능

## 0.23.92 Workspace member session / mutation hardening
- [ ] 승인 멤버의 기존 workspace 조회·수정 기능 정상 동작
- [ ] 정지 멤버의 기존 로그인 세션으로 workspace API 접근 시 403 `WORKSPACE_MEMBER_SESSION_INVALID`
- [ ] 탈퇴 요청·탈퇴·거절·대기 멤버의 API 접근 차단
- [ ] 세션 userId와 company_members.user_id 불일치 시 접근 차단
- [ ] 다른 회사 companyMemberId로 접근할 수 없는지 tenant 격리 확인
- [ ] 멤버 100명 초과 회사에서도 권한 검사가 목록 limit과 무관하게 동작
- [ ] 권한 제거 직후 재요청이 즉시 403으로 반영
- [ ] company admin 기존 API 접근 회귀 확인
- [ ] npm run build 미실행 — 사용자가 로컬에서 확인.
