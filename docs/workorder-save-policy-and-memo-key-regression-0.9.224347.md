# 0.9.224347 작업지시서 저장 정책 회귀 및 메모 key 중복 보정

## 목적

0.9.224345~0.9.224346에서 작업지시서 목록/상세 lazy load를 도입한 뒤 확인된 저장 정책 회귀와 메모 렌더링 key 중복 오류를 보정한다.

## 수정 내용

1. 작업지시서 가운데 패널의 일반 입력 변경은 즉시 DB 저장하지 않고 local draft 상태로만 반영한다.
2. `title`, `manager`, `managerId`, `workflowState`, `inventoryQuantity`, `inventoryStatus`, `factoryOrderRequest`, `lastSavedAt` 같은 즉시 저장 필드만 즉시 persist 대상으로 유지한다.
3. 일반 입력 변경 시 workspace write lock을 걸지 않도록 `onUpdateSelectedWorkOrder` 흐름을 보정했다.
4. 검수 완료/재고 반영 persist 실패 시 `saveStatus`가 `saving`에 고정되지 않도록 실패 경로를 보정했다.
5. 메모 생성 시 content/author 기준으로 임시 thread를 치환하던 구조를 제거하고, DB에서 생성된 memo id 기준으로 thread를 삽입하도록 보정했다.
6. 메모 댓글 생성도 content/author 기준 치환 대신 DB reply id 기준으로 추가하도록 보정했다.
7. React 렌더링 key는 `id + index` fallback을 포함해 중복 id가 일시적으로 들어와도 화면 전체가 깨지지 않게 보정했다.

## 유지 정책

- 제목/담당자 변경은 즉시 저장 정책 유지
- 워크플로우 상태 변경은 즉시 저장 정책 유지
- 첨부/디자인/메모 등록은 명시 액션 저장 정책 유지
- DB schema 변경 없음
- lazy load summary/detail API 구조 변경 없음

## 로컬 확인 항목

1. 작업지시서 가운데 패널 일반 입력 변경 시 DB 저장 요청이 즉시 발생하지 않는지 확인
2. 검수 완료 후 `completed` 상태로 전환되는지 확인
3. 검수 완료 후 `변경사항 저장 중입니다...` 메시지가 사라지는지 확인
4. 같은 내용의 메모를 여러 번 등록해도 React key 오류가 발생하지 않는지 확인
5. 같은 내용의 댓글을 여러 번 등록해도 React key 오류가 발생하지 않는지 확인
