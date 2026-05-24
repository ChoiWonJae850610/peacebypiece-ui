# Structure Refactor Test Backlog — 0.16.25

## 목적

0.16.4~0.16.25 구조 정리 구간 이후 한 번에 확인할 누적 테스트 목록이다.

## 1. 빌드 / 정적 확인

```txt
- npm run build 로컬 실행
- TypeScript 오류 확인
- import path 오류 확인
- APP_VERSION 0.16.25 표시 확인
- commit-meta.md Version과 APP_VERSION 일치 확인
- patch zip flat 구조 확인
- package.json/package-lock.json 변경 없음 확인
```

## 2. 라우팅 / 보호 접근

```txt
- 비로그인 /workspace 접근 차단
- 비로그인 /workspace/workorders 접근 차단
- 비로그인 /workspace/materials 접근 차단
- 비로그인 /system 접근 차단
- 비로그인 /me/settings 접근 차단
- 일반 멤버 /workspace 접근 가능
- 일반 멤버 /system 접근 차단
- 시스템관리자 /system 접근 가능
- /admin 화면 URL이 기준 업무 화면으로 쓰이지 않는지 확인
```

## 3. Workspace 화면

```txt
- /workspace 홈 정상
- /workspace/workorders 정상
- /workspace/materials 정상
- /workspace/partners 정상
- /workspace/files 정상
- /workspace/stats 정상
- /workspace/members 정상
- /workspace/settings 정상
- /workspace/standards 정상
- /me/settings 정상
- WorkspaceShell, Sidebar, Topbar 표시 정상
```

## 4. 작업지시서 기본 흐름

```txt
- 작업지시서 목록 조회
- 작업지시서 생성 버튼 표시/권한 확인
- 작업지시서 상세 진입
- 담당자 변경
- 검토요청
- 발주요청 미리보기
- 발주요청 후 모달 닫힘
- 메모 저장/수정
- 디자인 첨부 표시
- 일반 첨부 표시
- 삭제/복원/휴지통 기존 흐름 확인
```

## 5. 원단·부자재

```txt
- full_reset.sql 적용 후 materials 테이블 생성 확인
- /workspace/materials 목록 조회
- 원단 등록/수정/삭제
- 부자재 등록/수정/삭제
- 기준정보 관리 권한 없을 때 등록/수정/삭제 제한
- 작업지시서 상세에서 원단·부자재 연결 후보 표시
- 작업지시서별 원단·부자재 연결/해제
- workorder.update 권한 없을 때 연결/해제 제한
- 발주 가능 권한 없을 때 발주 상태 변경 제한
- 발주 상태 변경 후 새로고침 유지
- 다른 회사 원단·부자재가 섞이지 않는지 확인
```

## 6. 저장소 / 통계 / 시스템

```txt
- /workspace/files 기존 저장소 화면 정상
- 휴지통 복원/선택 삭제/비우기 정상
- /workspace/stats 기존 통계 정상
- /system/storage-usage 정상
- /system/audit-logs target filter material 표시 확인
- 원단·부자재가 저장소 사용량에 잘못 포함되지 않는지 확인
- 원단·부자재가 기존 통계 계산을 깨지 않는지 확인
```

## 7. Debug / Trace

```txt
- 개발 모드에서 작업지시서 주요 action trace 확인
- 개발 모드에서 API/service/query trace 확인
- production 모드에서 trace 미출력 확인
- token/secret/url/cookie/authorization 값이 로그에 노출되지 않는지 확인
```

## 8. 모바일 / 태블릿 / PC

```txt
- PC workspace shell 확인
- 태블릿 workspace shell 확인
- 모바일 workspace shell 확인
- 작업지시서 상세 모달 focus trap 유지
- Escape 닫기 유지
- background scroll lock 유지
- 모바일 상단 고정 닫기 버튼 유지
- 원단·부자재 패널 모바일 레이아웃 확인
```
