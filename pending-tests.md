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
