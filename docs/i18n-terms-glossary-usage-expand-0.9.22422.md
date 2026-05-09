# 0.9.22422 i18n glossary / terms 적용 범위 확대

## 목적
0.9.22420에서 도입한 `terms` namespace를 저장소관리의 반복 count, 파일 유형, 작업지시서 범위 표시에도 적용한다.

## 적용 내용
- `lib/i18n/adminTermFormatters.ts`를 추가해 도메인 용어 count와 파일 유형 표시 변환을 공통화했다.
- `terms.count.*` key를 한국어/영어 dictionary에 추가했다.
- 저장소 요약 카드, 휴지통 상단 선택 count, 작업지시서 저장소 summary count가 같은 formatter를 사용하도록 정리했다.
- 파일 유형 변환은 `translateAdminFileTypeTerm()`에서 `Document/Design/Memo/Attachment` 계열을 terms 기준으로 처리한다.

## 구조 기준
- 단순 반복 용어와 count는 `terms`를 사용한다.
- 안내문/결과문/confirm 문구는 문장 key를 유지한다.
- 컴포넌트에서 `locale === 'ko'` 같은 분기나 영어 dictionary에 한국어 fallback을 넣는 방식은 사용하지 않는다.

## 보류
- admin/workorder 전체 하드코딩 grep 잔여는 별도 버전에서 계속 정리한다.
- SSR initialLocale flash는 이전 문서와 같이 별도 구조 작업으로 보류한다.
