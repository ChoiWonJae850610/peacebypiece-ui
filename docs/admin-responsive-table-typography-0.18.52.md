# 0.18.52 관리자 반응형 테이블 typography 공통화

## 목표

저장소관리 휴지통의 삭제 대상명 typography를 기준으로 협력업체관리 업체명과 보조 텍스트 표현을 맞춘다.

## 적용 범위

- `adminResponsiveTableStyles.ts`에 공통 primary/secondary/value text class 추가 및 보정
- 협력업체관리 업체명, 메모, 일반 value text가 공통 typography class를 사용하도록 변경
- 저장소관리 휴지통 대상명도 같은 공통 typography class를 사용하도록 연결

## 유지한 사항

- table shell / compact card 구조 유지
- 저장소관리 복원/삭제/비우기 흐름 변경 없음
- 협력업체관리 검색/필터/정렬/등록/수정 흐름 변경 없음
- WorkspaceShell 변경 없음
- DB/API/R2 흐름 변경 없음
