# Pending Tests - 0.24.19

## 자동 검증

- [ ] `tsc --noEmit`
- [ ] `next build`
- [ ] `tools/pipeline/approved-workflow.ps1 -Action Verify -Profile roadmap-development-contract`
- [ ] roadmap/version contract에서 현재 0.24.19, 다음 0.24.20 확인
- [ ] package metadata와 lockfile 무변경 확인

## 문서 검토

- [ ] PDF Specification의 draft/final, source revision, stale 상태, 권한, idempotency 기준이 실제 업무 정책과 일치하는지 확인한다.
- [ ] R2 object-key, quota, trash/restore/purge, retention, reconciliation 기준을 검토한다.
- [ ] company administrator/system administrator 경계와 support content access 제한을 검토한다.
- [ ] docs index에서 09~11 문서가 정상적으로 열리는지 확인한다.

## 사용자 결정 필요

- [ ] 요금제별 저장 용량, 경고/차단/초과 정책
- [ ] trash, 계정 종료, PDF 최종본의 보존·grace·purge 기간
- [ ] system administrator의 고객 콘텐츠 support access 정책
- [ ] four-eyes 승인이 필요한 production operation 목록
- [ ] 최종 PDF 생성이 허용되는 정확한 workorder/material-order 상태

## 이번 버전에서 실행하지 않는 항목

- PDF 생성 엔진/템플릿 코드 구현 없음.
- production R2 upload/delete/reconciliation 실행 없음.
- DB/R2/Seed/Reset/Cleanup/Migration 실행 없음.
- permission/runtime/API/package/lockfile 변경 없음.
