Version : 0.9.108
Base Version : 0.9.107
Target Version : 0.9.108
Summary : 전체 route 원복 상태 점검표 추가
Description : /admin, /system, /worker, /invite/[token] 관련 route의 원복 상태를 실제 화면 복원됨, read-only 복원됨, skeleton, API only, 미구현 상태로 분류한 점검표를 추가했습니다. 다음 복원 순서를 /invite/[token], /system/companies, /system/permissions, /system/storage-usage, /system/stats 순서로 재정리했으며 audit log 설계, DB schema 변경, 기존 화면/API 동작 변경은 포함하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
추가 파일 목록 :
- docs/roadmap/route_recovery_status_0.9.108.md
삭제 파일 목록 :
- 없음
