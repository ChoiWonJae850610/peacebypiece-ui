Version: 0.9.23

Summary: 저장소 관리 UI 구조 정리

Description:
- 저장소 관리 화면의 첨부파일/휴지통 전환 버튼을 단일 tablist 구조로 정리했다.
- 첨부파일/휴지통 리스트 컨테이너 높이를 고정하고 내부 스크롤 구조를 유지하도록 보완했다.
- 저장소 사용 현황 그래프와 파일 유형 도넛 그래프 표시 영역을 확대했다.
- APP_VERSION을 0.9.23으로 동기화했다.
- 빌드 검증은 압축파일에 node_modules가 포함되어 있지 않아 next 실행 파일 부재로 완료하지 못했다.

수정 파일 목록:
- app/admin/files/page.tsx: 저장소 관리 tablist 구조 적용 및 목록 영역 고정 높이 반영.
- components/admin/files/FileStorageSummary.tsx: 최근 첨부량 그래프와 파일 유형 도넛 그래프 크기 확대.
- components/admin/files/FileListSection.tsx: 첨부파일 목록 테이블이 고정 영역 안에서 스크롤되도록 높이 클래스 보완.
- components/admin/files/FileTrashSection.tsx: 휴지통 목록 테이블이 고정 영역 안에서 스크롤되도록 높이 클래스 보완.
- lib/constants/app.ts: APP_VERSION 0.9.23 반영.
- commit-meta.md: 이번 작업 메타데이터 갱신.

추가 파일 목록:
- 없음

삭제 파일 목록:
- 없음

작업 상세 내용:
1. 0.9.22 기준 저장소 관리 화면에서 이미 분리되어 있던 첨부파일/휴지통 버튼을 시각적으로 하나의 탭 그룹으로 통합했다.
2. 파일 목록 영역을 h-[520px] 기준으로 고정하고, 각 목록 테이블은 flex 영역 안에서 내부 스크롤되도록 유지했다.
3. 저장소 요약 영역의 추세 그래프 SVG 크기와 높이를 키워 실제 데이터 변화가 더 크게 보이도록 조정했다.
4. 파일 유형 도넛 그래프를 확대하고 요약 그래프 영역의 최소 높이를 늘렸다.
5. 보관 기간 표기는 기존 0.9.22에서 이미 “보관 기간”으로 반영되어 있어 유지했다.

진행 판단:
- 0.9.23 저장소 관리 UI 정리 작업은 코드 기준 반영 완료.
- npm run build는 node_modules/next 미포함 압축파일 상태라 실행 불가. 로컬에서 npm install 또는 기존 node_modules가 있는 작업 폴더에서 npm run build 확인 필요.

다음 작업 권장 버전:
- 0.9.24 — 협력업체 UI 마무리
