# 0.22.00 responsive breakpoint import fix

## Summary
- Fixed the TypeScript build error introduced in 0.21.99 by importing `RESPONSIVE_BREAKPOINTS` in `useResponsiveDeviceType`.
- Updated `APP_VERSION` to `0.22.00`.

## QA
- Local build was not executed in the sandbox because project dependencies are not installed in this runtime.
- User should run `npm run build` locally after applying the patch.
