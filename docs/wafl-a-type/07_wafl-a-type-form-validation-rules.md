---
title: WAFL A-TYPE Form Validation Rules
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---


# 07. 폼 / 검증 / 제출 규칙

## 1. 기본 구조

```txt
FormSection / FieldGroup / Field / HelperText / ErrorText / FormActions
```

## 2. Label / Helper / Error

```txt
- label은 입력창 위에 둔다.
- 필수값은 *로 표시한다.
- placeholder는 실제 입력 예시를 제공한다.
- helper text는 입력창 하단에 둔다.
- error text는 helper 위치를 대체한다.
```

## 3. Validation Timing

```txt
입력 중: 형식 오류
blur: 필드 단위 오류
submit: 필수값/서버 검증/권한 검증
```

## 4. Submit

```ts
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (isSubmitting) return;
  const result = validate(formState);
  if (!result.ok) {
    setErrors(result.errors);
    focusFirstError(result.errors);
    return;
  }
  await submit();
}
```

## 5. Dirty Check

```txt
저장하지 않은 변경사항이 있습니다.
이 화면을 닫으면 입력한 내용이 사라집니다.
[계속 작성] [닫기]
```

## 6. 초대 폼

고객사 관리자 초대:

```txt
고객사명 / 대표 관리자 이름 / 이메일 주소 / 연락처 / 사업자·조직 코드 / 기본 요금제 / 저장공간 한도 / 초대 만료 / 알림 방식 / 권한 요약
```

멤버 초대:

```txt
초대 방식 / 이름 / 이메일 또는 연락처 / 역할 선택 / 권한 템플릿 / 담당 화면 선택 / 초대 만료 / 메모
```

## 7. 모바일/태블릿 세로 Step Form

고객사 관리자 초대:

```txt
1. 고객사 정보
2. 대표 관리자 정보
3. 요금제/저장공간
4. 권한 요약
5. 확인 후 발송
```

멤버 초대:

```txt
1. 초대 방식
2. 초대 대상
3. 역할 선택
4. 권한 선택
5. 만료/메모
6. 발송
```

## 8. 파일 업로드 / 그리기 저장

```txt
ready / uploading / saving / saved / failed
```

태블릿 회전 시:

```txt
- canvas state를 local state 또는 temporary storage에 보존
- orientation 차단 시 저장된 draft 유지
- 세로 복귀 시 복원 안내 제공
```

---

## 9. 초대 생성 후 공유 처리

초대 생성 submit 이후에는 발송 API보다 사용자 공유 흐름을 우선한다.

### 9.1 기본 흐름

```txt
초대 정보 입력
→ 서버에서 invite token/link 생성
→ 생성 결과 표시
→ 사용자가 공유하기/링크 복사/QR 보기 중 선택
```

### 9.2 상태

```txt
creating
created
sharing
shared
copySuccess
shareUnsupported
expired
```

### 9.3 중복 공유 처리

```txt
- 같은 초대 링크는 여러 번 공유 가능하다.
- 공유하기 버튼을 눌렀다고 실제 수신 여부를 보장하지 않는다.
- 실제 가입/승인 상태는 invitation status로 별도 관리한다.
```

### 9.4 유료 메시지 API 보류

```txt
SMS/Kakao 자동 발송은 2단계 기능으로 보류한다.
초기에는 사용자의 기기 공유창을 통한 직접 공유를 기본으로 한다.
```
