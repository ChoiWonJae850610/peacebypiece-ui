# Simulator user phone source fix 0.23.96

## 원인
Simulator Seed가 테스트 사용자 전화번호와 함께 `phone_source='simulator_seed'`를 저장했지만, DB 스키마는 `google`, `user`, `invitation`만 허용한다.

## 수정
Simulator가 생성하는 dev/test 사용자 전화번호의 출처를 허용값인 `user`로 저장한다. 실제 production 사용자나 실제 전화번호를 생성하지 않는다.

## 확인
개발 / 테스트 도구 21번 `Simulator DB Seed Execute`를 재실행하고 ExitCode 0과 `[SUCCESS] Simulator DB seed completed.`를 확인한다.
