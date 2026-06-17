# WAFL Mutation Lock Foundation 0.23.36

## 목적

작업지시서와 발주서의 DB 변경 작업이 저장 완료 전에 성공 처리되거나 동일 문서에서 중복 실행되는 문제를 막기 위한 공통 mutation 기반을 추가한다.

## 공통 계약

- 모든 mutation은 Promise 완료까지 await한다.
- 동일 lock key의 mutation은 동시에 실행하지 않는다.
- loading → success/error는 동일 operation ID로 교체한다.
- 성공 메시지는 mutation 완료 후에만 표시한다.
- 실패 시 선택적으로 rollback callback을 실행한다.
- mutation 완료 후에만 lock을 해제한다.

## 이번 버전 범위

- `useWaflMutation` 공통 hook 추가
- 작업지시서 feedback hook을 공통 mutation 기반으로 전환
- 발주서 feedback hook에 공통 mutation 실행 경로 추가
- 개별 저장 함수의 완전 전환은 다음 버전에서 진행

## DB

- Migration 없음
- Full Reset 불필요
- DB table lock 추가 없음
