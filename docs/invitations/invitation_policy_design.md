# PeaceByPiece 초대 정책 모델 설계

Version: 0.9.59
Status: 정책 모델 설계
Scope: 시스템관리자 고객관리자 초대, 고객관리자 멤버 초대, 초대 링크/QR 흐름
Non-goal: 실제 이메일 발송, 실제 토큰 발급 API, QR UI, 인증 연결

## 1. 초대 흐름 구분

### 시스템관리자 → 고객관리자

시스템관리자는 고객사를 만들거나 선택한 뒤 고객사 관리자를 초대한다.

정책:
- 초대 대상 role은 1차에서 `admin`만 허용한다.
- `company_id`가 반드시 필요하다.
- 초대 링크는 생성 응답에서 한 번만 표시한다.
- 이메일 발송은 후순위다.

### 고객관리자 → 고객사 멤버

고객관리자는 자기 회사의 디자이너, 검수담당자, 재고담당자, 조회자를 초대한다.

정책:
- 고객관리자의 `company_id`와 초대 대상 `company_id`가 같아야 한다.
- 다른 고객사로 초대하는 것은 금지한다.
- 초대 가능 role은 `designer`, `inspector`, `inventory_manager`, `viewer`부터 시작한다.
- 고객관리자 추가 초대 권한은 별도 permission으로 제어한다.

## 2. 초대 상태

권장 상태:
- `draft`: 생성 전 임시 상태
- `pending`: 초대 링크 생성됨
- `accepted`: 수락 완료
- `expired`: 만료됨
- `revoked`: 초대 취소됨

상태 변경 원칙:
- `pending`만 수락 가능
- `pending`만 취소 가능
- 만료일이 지난 초대는 수락 불가
- 수락 후에는 raw token을 재표시하지 않음

## 3. 토큰 저장 정책

원칙:
- raw token은 DB에 저장하지 않는다.
- DB에는 `token_hash`만 저장한다.
- raw token은 생성 API 응답에서 한 번만 반환한다.
- 초대 링크 재표시는 불가하며, 필요하면 기존 초대를 취소하고 새로 생성한다.

## 4. QR 정책

QR은 별도 초대 방식이 아니다.
초대 링크를 QR 이미지로 표현하는 UI 방식이다.

1차:
- 링크 텍스트 복사
- QR 표시는 0.9.64에서 별도 검토

주의:
- QR 라이브러리 추가가 필요하면 package.json 변경 승인이 필요하다.
- package.json 변경 없이 가능한 방식이 있으면 우선 검토한다.

## 5. 권한 preset

권장 preset:
- `company_admin`
- `designer`
- `inspector`
- `inventory_manager`
- `viewer`
- `custom`

초기에는 role 기반 preset을 쓰고, 나중에 개별 permission override를 추가한다.

## 6. 다음 패치 기준

0.9.60:
- invitations SQL 추가
- token_hash, expires_at, accepted_at, revoked_at, status 포함
- raw token 저장 금지 주석 포함

0.9.61:
- 시스템관리자 고객 초대 UI skeleton 추가
- 이메일 발송 없이 링크 생성 흐름만 준비

0.9.62:
- 고객관리자 멤버 초대 UI skeleton 추가
- role/permission preset 선택 UI 준비
