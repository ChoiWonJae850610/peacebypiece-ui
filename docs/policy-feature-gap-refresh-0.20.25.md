# 정책 문서 기능 gap 최신화 — 0.20.25

## 1. 목적

`0.20.25`는 0.19~0.20 구간에서 작성된 정책·요금·저장공간·회사 파일·약관 재동의 문서를 현재 코드 기준으로 다시 대조해, 실제 개발 완료/부분 완료/미구현/정책 결정 필요 항목을 최신화한 문서 버전이다.

이번 버전은 코드 기능 변경이 아니라 정책 gap 정리 문서화다. DB schema, API route, R2 업로드, 휴지통, 작업지시서 첨부 흐름은 변경하지 않는다.

## 2. 확인 기준

대조 기준은 다음 파일군이다.

- 정책/약관 문서: `docs/policy-*`, `docs/company-approval-required-policy-agreement-*`, `docs/member-policy-access-entry-*`
- 요금/저장공간 문서: `docs/billing-*`, `docs/storage-quota-*`, `docs/settings-billing-density-*`
- 회사 파일 문서: `docs/company-file-*`, `docs/company-files-*`
- 실제 DB 기준: `db/schema/full_reset.sql`, `db/schema/full_reset_smoke_test.sql`
- 실제 API 기준: `app/api/policies/*`, `app/api/admin/subscription`, `app/api/admin/company-files/*`, `app/api/admin/settings/feedback`, `app/api/system/audit-logs`, `app/api/system/storage-usage/*`
- 실제 UI 기준: 환경설정, 약관·정책, 요금제·저장공간, 회사 파일, 서비스 건의 관련 컴포넌트
- 자동테스트 기준: `tests/e2e/workspace-policy-settings.spec.mjs`, DB/API smoke 관련 스크립트

## 3. 완료로 볼 수 있는 항목

| 영역 | 현재 상태 | 근거/메모 |
| --- | --- | --- |
| 정책 문서 DB 구조 | 완료 | `policy_documents`, `policy_versions`, `policy_agreements` 구조가 `full_reset.sql`에 반영되어 있다. |
| 정책 버전/현재 버전 관리 | 완료 | `policy_versions.is_current`, `is_required_for_approval`, `requires_reagreement` 기준이 존재한다. |
| 최초 필수 정책 동의 | 완료 | `/api/policies/current`, `/api/policies/agreements` 흐름이 존재한다. |
| 정책 재동의 API | 완료 | `/api/policies/reagreement` GET/POST가 존재한다. |
| 정책 재동의 업무 접근 차단 | 완료 | `/workspace/*` 접근 차단 게이트가 존재하고 `/workspace/legal` 예외 경로가 있다. |
| 환경설정 약관·정책 진입 | 완료 | 고객사 업무 화면에서 정책 상태를 확인할 수 있는 UI가 존재한다. |
| 회사 구독 DB 1차 | 완료 | `company_subscriptions` 테이블과 상태/요금제 check constraint가 존재한다. |
| 구독 조회 API | 완료 | `/api/admin/subscription`이 존재한다. |
| 환경설정 요금제·저장공간 UI | 완료 | 현재 요금제, 상태, 저장공간, 멤버 사용량을 읽기 전용으로 표시하는 구조가 있다. |
| 회사 파일 DB/API | 완료 | 대표 이미지/사업자등록증 파일 저장 API와 메타데이터 구조가 존재한다. |
| 회사 파일 R2 업로드 정책 | 완료 | company-files R2 key pattern이 Worker 정책에 반영되어 있다. |
| 회사 파일 미리보기 API/UI | 완료 | 이미지/PDF preview API와 미리보기 모달 1차가 존재한다. |
| 회사 파일 저장공간 제한 1차 | 완료 | 회사 파일 업로드 준비/저장 단계에 quota guard가 연결되어 있다. |
| 서비스 건의 접수 | 완료 | `company_feedback_requests` 테이블과 `/api/admin/settings/feedback`이 존재한다. |
| 시스템 감사 로그 기반 | 완료 | `audit_logs` 테이블과 `/api/system/audit-logs` route가 존재한다. |
| 시스템 저장공간 관리 기반 | 완료 | `/api/system/storage-usage`, `/api/system/storage-usage/purge` route가 존재한다. |
| 정책/설정 E2E 기반 | 완료 | `workspace-policy-settings.spec.mjs`에서 정책/설정 smoke가 존재한다. |

## 4. 부분 완료 항목

| 영역 | 현재 상태 | 부족한 점 |
| --- | --- | --- |
| 요금제 운영 | 부분 완료 | Trial/Lite/Flow/Studio/Custom 기준은 DB/API에 있으나 실제 결제/요금제 변경/운영자 수동 변경 UI는 없다. |
| 무료체험 7일 | 부분 완료 | `trial_started_at`, `trial_ends_at`은 있으나 체험 종료 전 배너, 종료 후 제한 UX, 자동 상태 전환은 별도 확인/구현이 필요하다. |
| 저장공간 제한 | 부분 완료 | 회사 파일 업로드에는 적용됐으나 작업지시서 첨부, 디자인 파일, 원단·부자재 문서 업로드에는 아직 공통 적용되지 않았다. |
| 멤버 수 제한 | 부분 완료 | `member_limit`, active member count 조회는 있으나 초대/승인 제한 guard까지 완성됐는지는 추가 작업 필요하다. |
| 정책 재동의 차단 | 부분 완료 | 클라이언트 업무 접근 차단은 있으나 모든 업무 API route에 서버 레벨 guard가 일괄 적용된 것은 아니다. |
| 고객 공개 정책 문서 | 부분 완료 | 고객이 열람할 경로와 DB 구조는 있으나 실제 공개용 v1.0 문안 확정, 문구 QA, 금지 표현 치환은 미완이다. |
| 회사 파일 검토 | 부분 완료 | 업로드/미리보기는 가능하나 시스템관리자 검토 상태, 반려 사유, 검토 메모, 파일별 감사 로그 UI는 더 보강해야 한다. |
| 감사 로그 | 부분 완료 | 테이블/조회 route는 있으나 어떤 운영 이벤트를 반드시 감사 로그로 남길지 정책 기준이 아직 충분히 고정되지 않았다. |
| 서비스 건의 | 부분 완료 | 고객사 접수는 가능하나 시스템관리자 처리/상태 변경/답변 흐름은 운영 기능으로 더 필요하다. |
| 휴지통/보관 파일 | 부분 완료 | 삭제/복원/purge 흐름은 있으나 정책 문서 기준의 30일 자동 영구삭제 스케줄러/운영 증적은 추가 점검 대상이다. |

## 5. 미구현 또는 후속 개발 필요 항목

| 우선순위 | 영역 | 필요 기능 |
| --- | --- | --- |
| 높음 | 데이터 내보내기 | `export_jobs` 또는 동등한 작업 테이블, zip 생성, 다운로드 링크 7일 유효, 이메일 발송, 완료/실패 상태 추적 |
| 높음 | 이메일 발송 | Google Workspace 기반 발송 provider, 발송 템플릿, 발송 로그, 실패 재시도 기준 |
| 높음 | 해지 흐름 | 해지 신청, 해지 예정일, 해지 취소, 다음 결제일까지 사용, 해지 완료 후 접근/내보내기 제한 |
| 높음 | 결제 실패 제한 | `payment_failed`, `past_due`, `suspended` 상태별 접근 제한, 업로드/초대/생성 제한 기준 |
| 높음 | 저장공간 공통 제한 | 작업지시서 첨부, 디자인 첨부, 원단·부자재 문서 업로드까지 quota guard 확장 |
| 높음 | 멤버 제한 guard | 멤버 초대/승인 시 `member_limit` 초과 차단 |
| 중간 | 장기 미납 | 30/60/90일 알림, 제한 단계, 삭제 가능 대상, 시스템관리자 승인/로그 |
| 중간 | 개인정보 권리 행사 | 열람/정정/삭제/처리정지 요청 접수, 처리 상태, 처리 로그 |
| 중간 | 개인정보 파기 증적 | 탈퇴/해지/장기 미납/보관기간 만료 시 파기 로그와 증적 관리 |
| 중간 | 공지/점검/장애 | 운영 공지, 점검 배너, 장애 안내 배너, 시스템관리자 관리 UI |
| 중간 | 부정 이용/불법 파일 | 신고/차단/파일 접근 제한/운영자 메모/감사 로그 |
| 중간 | 시스템관리자 파일 접근 사유 | 고객사 파일 열람 시 사유 입력, 접근 로그, 사후 감사 기준 |
| 낮음 | 요금제 변경 요청 | 고객사 화면의 요금제 변경 요청, 운영자 승인/수동 반영 |
| 낮음 | 청구/영수증 | 카드 결제, 영수증, 세금계산서/현금영수증, PG webhook |
| 낮음 | 정책 공개 문안 관리 | 공개 정책 문서 최종본 검수, 버전 라벨, 변경 요약, 고객 안내 문구 |

## 6. 정책 결정이 필요한 항목

| 항목 | 결정 필요 내용 | 현재 권장안 |
| --- | --- | --- |
| 요금제 명칭 | Trial/Lite/Flow/Studio/Custom으로 고정할지, 다른 플랜명을 혼용할지 | 문서/DB/API 모두 Trial/Lite/Flow/Studio/Custom으로 통일 |
| 체험 시작 기준 | 고객사 승인 시점인지, 첫 업무 접속 시점인지 | 고객사 승인 완료 시점 기준이 운영상 단순하다. |
| 체험 종료 후 허용 범위 | 조회만 허용할지, 내보내기까지 허용할지 | 조회 + 데이터 내보내기 + 결제/문의만 허용 |
| 휴지통 파일 저장공간 포함 | 휴지통 파일을 quota에 포함할지 | 실제 R2 용량을 점유하므로 포함 |
| 비활성 멤버 과금 포함 | 비활성/정지 멤버를 member_limit에 포함할지 | 초기에는 active member만 포함, 후속 약관에서 명시 가능 |
| 서버 레벨 정책 차단 | 재동의 미완료 시 API도 막을지 | 쓰기 API부터 우선 차단, 조회 API는 단계적 적용 |
| 장기 미납 삭제 시점 | 미납 후 며칠 뒤 삭제 가능하게 할지 | 90일 이후 삭제 후보, 별도 안내/로그 필수 |
| 시스템관리자 파일 접근 | 모든 열람에 사유를 받을지 | 사업자등록증/대표 이미지/첨부 원본 열람은 사유 필수 권장 |
| 이메일 발송 주소 | hello/support/no-reply 분리 여부 | 초기에는 Google Workspace 기반, 발신 목적별 주소 분리 권장 |

## 7. 로드맵 반영안

현재 v9 로드맵은 테스트 불가 기간을 고려해 모바일/태블릿 UI 구조 정리를 먼저 진행한다. 정책 기능은 다음과 같이 후속 버전으로 분리하는 것이 안전하다.

| 버전 후보 | 작업명 | 성격 |
| --- | --- | --- |
| 0.20.25 | 정책 문서 기능 gap 최신화 | 완료 |
| 0.20.35 | 파일 업로드 공통화 설계 | 회사 파일/작업지시서/디자인/발주 문서 quota와 preview 공통화 설계 |
| 0.20.36~0.20.38 | 파일 미리보기 공통화 | preview card/modal 공통 컴포넌트 적용 |
| 0.20.41 | 저장공간 제한 확장 설계 | 작업지시서/디자인/발주 문서 quota guard 설계 |
| 0.20.42 | 작업지시서 첨부 quota guard | 쓰기 API guard 1차 |
| 0.20.43 | 디자인/발주 문서 quota guard | 남은 업로드 route 확장 |
| 0.20.44 | 멤버 제한 guard 설계/구현 | 초대/승인 제한 |
| 0.20.45 | 해지/체험 종료 UX 설계 | 결제 전 운영 제한 UX 정리 |
| 0.20.46 | 해지/체험 종료 DB/API 1차 | 수동 운영 기준 |
| 0.20.47 | 데이터 내보내기 설계 | export job, zip, 이메일 링크 구조 |
| 0.20.48 | Google Workspace 이메일 provider 1차 | 발송 provider/로그 |
| 0.20.49 | 데이터 내보내기 API 1차 | export job 생성/상태 조회 |
| 0.20.50 | 시스템 감사로그 보강 | 파일 접근 사유/운영 이벤트 확대 |

## 8. 다음 작업 기준

테스트가 어려운 현재 기간에는 다음 순서가 안전하다.

1. 모바일/태블릿 IA 설계
2. 모바일 공통 shell/drawer/bottom sheet 기준화
3. 작업지시서 모바일 구조 분리
4. 원단·부자재 모바일 구조 분리
5. 환경설정/멤버관리 모바일 카드화
6. 테스트 가능 시점에 build/E2E/smoke 및 상태전환 회귀 확인
7. 그 뒤 저장공간/해지/내보내기/이메일 같은 운영 기능 확장

## 9. 제외 범위

이번 문서는 다음을 포함하지 않는다.

- DB schema 변경
- 신규 API route 추가
- 기존 API 수정
- R2 Worker 수정
- 작업지시서 첨부/메모/휴지통/purge 수정
- 결제/PG 연동
- 이메일 발송 실제 구현
- 모바일 UI 코드 수정

