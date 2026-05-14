Version : 0.11.83
Summary : runtimeMode 미사용 플래그 정리
Description : 현재 실제 사용 중인 runtimeMode 값만 남기고 미사용 production/dev/seed/tool 플래그를 제거했습니다. 운영 기본값 production 정책은 유지하고, 작업지시서 DB 연결 배지와 사용자 변경 도구 표시 기준은 기존 RUNTIME_VISIBILITY 값으로 유지했습니다.
수정 파일 목록 :
- lib/runtime/runtimeMode.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/runtime-mode-used-flags-0.11.83.md
삭제 파일 목록 :
