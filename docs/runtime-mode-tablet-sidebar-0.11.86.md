# runtimeMode tablet sidebar visibility 0.11.86

## 목적

작업지시서 태블릿 레이아웃은 모바일 상단바가 아니라 좌측 목록 사이드바를 사용한다. 따라서 모바일 상단바에 분리했던 development 전용 표시 영역을 태블릿 경로에서도 안정적으로 보이도록 사이드바 헤더에 동일한 구조로 보정했다.

## 적용 기준

- `NEXT_PUBLIC_APP_RUNTIME_MODE=development`일 때만 DB 연결 배지와 사용자 변경 도구를 표시한다.
- 환경변수가 없거나 `development`가 아니면 production으로 처리하고 표시하지 않는다.
- Vercel에는 `NEXT_PUBLIC_APP_RUNTIME_MODE`를 등록하지 않으면 운영 UI로 표시된다.

## 변경 내용

- `SidebarContent`에서 DB 연결 배지를 회사명/버전 줄에서 분리했다.
- 사용자 변경 톱니를 새로고침 버튼 줄에서 분리했다.
- development 전용 줄을 별도로 만들고 DB 연결 배지와 사용자 변경 버튼을 함께 배치했다.
- production에서는 해당 development 전용 줄 자체가 렌더링되지 않는다.

## 확인 항목

- 로컬 `.env.local`에 `NEXT_PUBLIC_APP_RUNTIME_MODE=development`를 둔 상태에서 태블릿 폭 확인
- 태블릿 좌측 목록 상단에 DB 연결 배지 표시 확인
- 태블릿 좌측 목록 상단에 사용자 변경 버튼 표시 확인
- 사용자 변경 버튼 클릭 시 권한/사용자 전환 모달 표시 확인
- Vercel 환경변수 미설정 상태에서 배포 화면에 DB 연결 배지와 사용자 변경 버튼이 숨겨지는지 확인
