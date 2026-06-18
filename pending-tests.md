# Pending Tests

## 0.23.76 Simulator DB adapter

- [ ] PowerShell 29 `Simulator DB Adapter Contract` 실행
- [ ] PowerShell 14 `Functions Seed Dry-run` 실행 후 회사 10개와 생성 예정 row 수 확인
- [ ] PowerShell 15 `Functions Cleanup Dry-run` 실행 후 삭제 대상이 `wafl-fn-company-a`~`j`로 제한되는지 확인
- [ ] dev/test DB 연결 상태에서 PowerShell 21 `Simulator DB Seed Execute` 실행
- [ ] seed 완료 후 회사·계정·거래처·작업지시서·발주서·storage snapshot 생성 확인
- [ ] 21번 재실행 후 중복 row가 생성되지 않는지 확인
- [ ] 회사 A 변경이 회사 B 데이터에 영향을 주지 않는지 확인
- [ ] PowerShell 22 `Simulator DB Cleanup Execute` 실행 전 생성 데이터가 모두 테스트 prefix인지 확인
- [ ] cleanup 후 `wafl-fn` 회사만 삭제되고 기존 실제 회사 row가 유지되는지 확인
- [ ] DB target이 dev/test로 식별되지 않을 때 21·22번이 차단되는지 확인
- [ ] R2 객체와 attachments는 생성되지 않는지 확인
- [ ] `npm run build` 로컬 확인
