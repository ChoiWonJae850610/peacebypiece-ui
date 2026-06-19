# Simulator R2 Local Fixture Companion

This companion note replaces the old R2 demo upload runbook. The current source of truth is `tools/simulator/README.md`.

## Current Policy

- Use only local planning and local file generation by default.
- Generated files and manifests are written under `.tmp/simulator/r2`, which is ignored by Git.
- Real R2 upload/delete mutation remains disabled by the simulator R2 manifest.
- Do not run production R2 commands from this repository.
- Do not store real Worker URLs, bucket names, tokens, or secrets in docs.

## Safe Commands

```bash
npm run simulator:r2:plan
npm run simulator:r2:generate
npm run simulator:r2:cleanup-local
```

These commands do not touch the real DB or real R2. `cleanup-local` removes only simulator output under `.tmp/simulator/r2`.

## Blocked Or Review-Only Modes

The implementation still contains legacy `upload`, `verify`, and `all` code paths for historical review. Treat them as blocked unless a future task explicitly approves a dev/test R2 adapter design, required guards, environment policy, and validation procedure.

Do not use this file as approval to run:

```bash
node tools/simulator/commands/r2-demo-files.mjs --mode=upload --confirm-upload
node tools/simulator/commands/r2-demo-files.mjs --mode=all --confirm-upload
node tools/simulator/commands/r2-demo-files.mjs --mode=verify
```

## Related Files

- `tools/simulator/README.md`
- `tools/simulator/commands/r2-demo-files.mjs`
- `tools/simulator/adapters/r2/manifest.mjs`
- `tools/simulator/fixtures/r2/README.md`
- `.tmp/simulator/r2`
