# 개인 설정 DB 저장 설계 — 0.12.17

## 목적

현재 `/me/settings`의 언어, 테마, 화면 밀도, 기본 진입 화면은 `localStorage` 기반으로 동작한다. 로그인/초대/승인 흐름이 도입되면 같은 사용자가 여러 브라우저나 기기에서 접속할 때 개인 설정이 유지되어야 하므로 DB 저장 구조가 필요하다.

이번 버전은 설계 정리 단계이며 실제 DB schema는 변경하지 않는다. 구현 단계에서는 `full_reset.sql`과 smoke test를 함께 갱신해야 한다.

## 현재 구조

- 저장 key: `peacebypiece.personal.settings`
- 변경 이벤트: `peacebypiece:personal-settings-change`
- 현재 저장 항목
  - `language`: `ko` 또는 `en`
  - `theme`: `default-light`, `beige-atelier`, `cold-winter`
  - `density`: `comfortable` 또는 `compact`
  - `defaultHome`: `workspace` 또는 `workorder`
- 기존 legacy locale key: `peacebypiece.admin.locale`
- 이미 권한 카탈로그에는 `personal_settings.manage`가 존재한다.

## 권장 저장 단위

### 1차 권장안: 사용자 단위 저장

개인 설정은 회사 조직 설정이 아니라 사용자 취향이므로 `users.id`를 기준으로 저장한다.

장점:

- 같은 사용자가 여러 회사에 속해도 언어/테마 취향을 유지할 수 있다.
- `/me/settings`와 의미가 맞다.
- 고객관리자, 디자이너, 재고담당자, 시스템관리자 모두 같은 구조를 사용할 수 있다.

보류 대상:

- 회사별 기본 홈이 필요해지는 경우
- 회사별 권한에 따라 기본 진입 화면이 달라져야 하는 경우

그 경우에는 `company_member_personal_settings`를 별도 확장 후보로 둔다.

## 후보 테이블

```sql
CREATE TABLE user_personal_settings (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'ko',
  theme_id text NOT NULL DEFAULT 'default-light',
  density text NOT NULL DEFAULT 'comfortable',
  default_home text NOT NULL DEFAULT 'workspace',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_personal_settings_language_check
    CHECK (language IN ('ko', 'en')),
  CONSTRAINT user_personal_settings_theme_check
    CHECK (theme_id IN ('default-light', 'beige-atelier', 'cold-winter')),
  CONSTRAINT user_personal_settings_density_check
    CHECK (density IN ('comfortable', 'compact')),
  CONSTRAINT user_personal_settings_default_home_check
    CHECK (default_home IN ('workspace', 'workorder'))
);

CREATE INDEX user_personal_settings_updated_at_idx
  ON user_personal_settings (updated_at DESC);
```

## API 후보

### `GET /api/me/settings`

역할:

- 로그인 사용자 기준 DB 설정 조회
- row가 없으면 app default 반환
- legacy localStorage migration 단계에서는 클라이언트가 가진 설정을 우선 POST하도록 유도 가능

응답 후보:

```ts
type MeSettingsResponse = {
  settings: {
    language: "ko" | "en";
    theme: "default-light" | "beige-atelier" | "cold-winter";
    density: "comfortable" | "compact";
    defaultHome: "workspace" | "workorder";
  };
  source: "db" | "default";
};
```

### `PUT /api/me/settings`

역할:

- 본인 개인 설정 저장
- `personal_settings.manage` 권한 확인
- upsert 처리
- 응답은 normalize된 설정을 반환

주의:

- API route는 얇게 유지한다.
- 실제 검증, normalize, upsert는 `lib/me/*` 아래로 분리한다.
- 문자열 비교가 흩어지지 않도록 현재 `personalSettings.ts`의 option/normalizer를 기준으로 확장한다.

## 클라이언트 동기화 기준

로그인 전 또는 auth 미도입 단계:

1. 현재처럼 `localStorage` 유지
2. `storage` event와 `PERSONAL_SETTINGS_CHANGE_EVENT`로 다중 탭 동기화 유지
3. hydration mismatch 방지를 위해 provider 최초 렌더링은 서버 initial 값 사용
4. 저장값 반영은 mount 이후 effect에서 처리

로그인 도입 후:

1. 서버에서 DB 설정을 읽어 layout/provider initial 값으로 전달
2. client mount 이후 localStorage legacy 값이 있으면 DB row와 비교
3. DB row가 없고 localStorage 값이 있으면 1회 migration POST
4. 저장 성공 후 localStorage는 캐시로 유지 가능
5. 다른 탭 반영은 기존 custom event + storage event 유지

## conflict 처리

권장 기준:

- 같은 브라우저 탭 간에는 마지막 저장값 우선
- 여러 기기 간에는 `updated_at` 기준 마지막 저장값 우선
- 실패 시 UI는 optimistic update를 되돌리기보다 toast로 재저장 안내

개인 설정은 도메인 데이터보다 위험도가 낮으므로 복잡한 충돌 해결은 1차 범위에서 제외한다.

## i18n 기준

- `/me/settings` 화면 문구는 기존 i18n 구조 유지
- DB에는 label 문구를 저장하지 않는다.
- DB에는 코드값만 저장한다.
- theme label은 i18n copy 또는 theme registry label을 통해 표시한다.

## full_reset 반영 시 체크리스트

실제 schema 도입 버전에서는 아래 파일을 함께 수정한다.

- `db/schema/full_reset.sql`
  - `DROP TABLE IF EXISTS user_personal_settings CASCADE;` 추가
  - `CREATE TABLE user_personal_settings ...` 추가
  - index 추가
  - comment 추가
- `db/schema/full_reset_smoke_test.sql`
  - table 존재 여부 확인 추가
  - check constraint 존재 여부 확인 후보 추가
- seed SQL
  - 기본 seed는 필수 아님
  - 테스트 사용자별 theme/language seed가 필요할 때만 별도 추가

## 구현 순서 후보

1. `lib/me/personalSettings.ts`의 type/normalizer를 DB DTO와 공유 가능하게 정리
2. `lib/me/personalSettingsRepository.ts` 추가
3. `app/api/me/settings/route.ts` 추가
4. `/me/settings` 저장 버튼 또는 즉시 저장 정책 확정
5. localStorage legacy migration 처리
6. layout/provider initial 설정을 DB 기반으로 전환
7. full reset / smoke test 반영

## 이번 버전 판단

- 실제 DB schema 변경: 없음
- full reset 변경: 없음
- API 추가: 없음
- UI 변경: 없음
- 다음 구현 버전에서 schema를 반영한다면 full reset 영향 검토가 필요하다.
