# PeaceByPiece 스토리지 사용량 집계 API skeleton

Version: 0.9.68
Status: API skeleton
Scope: 고객사별 저장공간 사용량 조회/스냅샷 생성 route 구조
Non-goal: R2 실시간 사용량 조회, 업로드 차단, 결제 자동화

## 1. 집계 기준

1차 기준은 DB attachment metadata다.

권장 순서:
1. attachments metadata의 file size 합계
2. attachment_count 계산
3. storage_usage_snapshots 저장
4. latest_storage_usage_snapshots view 또는 repository에서 최신값 조회

R2 실시간 조회는 비용과 속도 문제가 있으므로 후순위다.

## 2. API skeleton

### GET /api/system/storage-usage?companyId=...

고객사별 최신 사용량 summary를 반환한다.

### POST /api/system/storage-usage

수동 또는 batch 집계 결과 snapshot을 저장하는 route skeleton이다.

요청 예:
```json
{
  "companyId": "sample-company",
  "usedBytes": 1024,
  "attachmentCount": 3,
  "source": "db_attachment_metadata"
}
```

## 3. 운영 정책

- 초과 여부 판단은 plan policy 계층에서 계산한다.
- 이 API는 사용량 집계와 snapshot 생성만 담당한다.
- 업로드 차단, 초과 과금, 알림 발송은 별도 정책과 UI에서 처리한다.

## 4. 다음 패치 기준

0.9.69:
- admin stats / system stats 공통 selector/repository 구조 추가
- 화면에서 직접 통계 계산하지 않는 구조를 준비한다.
