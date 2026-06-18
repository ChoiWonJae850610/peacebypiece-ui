# `/functions` 테스트 데이터 기반 — 0.23.64

## 목적

기능 카탈로그와 자동 테스트가 동일한 고정 테스트 데이터를 참조하도록 10개 회사 시나리오와 dry-run 명령 구조를 추가한다.

## 포함 범위

- 회사 A~J 고정 ID
- Basic/Pro/Trial/Test/Enterprise 가정 요금제
- 정상, 승인 대기, 파일 반려, 이용 중지, 탈퇴 요청, 인원 한도, legacy null, 경계값 상태
- 시스템관리자·회사관리자·일반 역할 8종
- empty/small/medium/large/edge 규모
- 작업지시서·발주서·거래처·파일·알림 예상 건수
- seed/reset/cleanup dry-run 계획
- production 및 실제 DB 실행 차단

## 명령

```bash
npm run test:data:functions
npm run test:data:functions:seed
npm run test:data:functions:reset
npm run test:data:functions:cleanup
```

0.23.64에서는 모든 변경 명령이 계획만 출력한다. `--execute`를 직접 전달해도 실제 DB 연결 코드는 없으며 실행을 거부한다.

## 실제 DB 적용 보류

다음 조건이 충족되기 전에는 실제 seed를 만들거나 실행하지 않는다.

- 사용자 테스트 가능
- dev/test DB 연결 확인
- 현재 schema와 FK 삭제 순서 검증
- reset/cleanup 복구 절차 확인
- 대량 데이터 생성 시간 및 저장 공간 확인

## 다음 연결

0.23.65에서 이 fixture ID를 DB 불변조건·회사 격리 테스트 계약에 연결한다.
