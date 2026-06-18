# Pipeline repository/config integration — 0.23.77

- 고정 스크립트: `tools/pipeline/peacebypiece-auto-pipeline.ps1`
- 설정: `tools/pipeline/pipeline.config.psd1`
- 내부 버전: v19.5
- DB/R2 URL과 secret은 config에 저장하지 않는다.
- Simulator seed/cleanup은 승인 DB fingerprint가 정확히 일치할 때만 실행한다.
