# 0.23.82 Dev/Test Console Seed Membership and Internal Tools

- Simulator DB seed now writes both legacy `company_users` and current `company_members`.
- `admin` simulator roles map to `company_admin` role templates.
- `/dev/test-console` shows seed-company/role summaries and selected target details.
- Added direct links to `/worker`, `/workspace`, and `/workspace/material-orders`.
- System administrator home shows internal tool cards for `/dev/test-console`, `/ui`, and `/functions` outside production.
- Production route blocking remains enforced by each route guard.
