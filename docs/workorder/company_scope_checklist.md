# company_id scope 체크리스트

Version: 0.9.88

## 읽기 query 체크

각 repository에서 다음 조건을 확인한다.

```sql
WHERE company_id = $1
```

또는 parent table과 join할 경우:

```sql
JOIN spec_sheets ss ON ss.id = target.spec_sheet_id
WHERE ss.company_id = $1
```

## 쓰기 query 체크

insert/update 시 다음 중 하나를 만족해야 한다.

1. payload에서 받은 company_id를 그대로 신뢰하지 않는다.
2. 현재 workspace/company context에서 company_id를 주입한다.
3. parent spec_sheet의 company_id를 조회해서 자식 row에 복사한다.

## 위험한 패턴

```sql
SELECT * FROM attachments WHERE order_id = $1
```

company_id 또는 parent spec_sheet company scope 없이 workOrderId만 사용하는 경우, 장기적으로 tenant isolation 위험이 있다.

```sql
UPDATE partners SET ...
WHERE id = $1
```

partner id만으로 수정하는 경우 다른 고객사 데이터 접근 가능성이 있다.

## 안전한 패턴

```sql
UPDATE partners
SET ...
WHERE id = $1
  AND company_id = $2
```

## 0.9.88 판단

이번 버전에서는 실제 query 수정 없이 점검 기준만 만든다.  
정상 동작 중인 업로드/삭제/표시/DB 흐름을 변경하지 않기 위해 실제 repository 수정은 후속 버전에서 개별적으로 진행한다.
