Version :
0.15.232

Summary :
Tailwind source 감지 범위 명시로 CSS 파싱 오류 수정

Description :
Tailwind CSS v4 자동 source 감지가 문서 파일의 class 예시까지 스캔해 잘못된 arbitrary class를 생성하지 않도록 globals.css에서 source 범위를 app, components, lib, types로 명시했다. APP_VERSION도 0.15.232로 갱신했다.

수정 파일 목록 :
- app/globals.css
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
