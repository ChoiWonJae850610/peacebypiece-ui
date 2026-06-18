-- PeaceByPiece system admin bootstrap
-- 목적:
-- - Google 로그인 이메일 kty872@gmail.com 계정을 시스템관리자로 고정 등록합니다.
-- - full_reset.sql 실행 후 이 파일을 다시 실행해도 중복 생성되지 않도록 작성했습니다.
-- - system_permission_catalog seed가 먼저 존재해야 모든 시스템 권한이 부여됩니다.

WITH updated_system_user AS (
  UPDATE system_users
     SET name = 'CWJ',
         role = 'system_admin',
         is_active = true,
         updated_at = now()
   WHERE lower(email) = lower('wjchoi850610@gmail.com')
   RETURNING id
),
inserted_system_user AS (
  INSERT INTO system_users (email, name, role, is_active)
  SELECT 'wjchoi850610@gmail.com', 'CWJ', 'system_admin', true
   WHERE NOT EXISTS (SELECT 1 FROM updated_system_user)
     AND NOT EXISTS (
       SELECT 1
         FROM system_users
        WHERE lower(email) = lower('wjchoi850610@gmail.com')
     )
  RETURNING id
),
target_system_user AS (
  SELECT id FROM updated_system_user
  UNION ALL
  SELECT id FROM inserted_system_user
  UNION ALL
  SELECT id
    FROM system_users
   WHERE lower(email) = lower('wjchoi850610@gmail.com')
   ORDER BY id
   LIMIT 1
)
INSERT INTO system_user_permissions (system_user_id, permission_key, is_enabled)
SELECT target_system_user.id, system_permission_catalog.permission_key, true
  FROM target_system_user
  CROSS JOIN system_permission_catalog
 WHERE system_permission_catalog.is_active = true
ON CONFLICT (system_user_id, permission_key)
DO UPDATE
   SET is_enabled = EXCLUDED.is_enabled,
       updated_at = now();

SELECT
  system_users.id,
  system_users.email,
  system_users.name,
  system_users.role,
  system_users.is_active,
  COUNT(system_user_permissions.permission_key) AS enabled_permission_count
FROM system_users
LEFT JOIN system_user_permissions
  ON system_user_permissions.system_user_id = system_users.id
 AND system_user_permissions.is_enabled = true
WHERE lower(system_users.email) = lower('wjchoi850610@gmail.com')
GROUP BY system_users.id, system_users.email, system_users.name, system_users.role, system_users.is_active;
