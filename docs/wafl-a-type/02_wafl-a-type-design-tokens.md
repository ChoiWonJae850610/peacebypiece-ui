---
title: WAFL A-TYPE Design Tokens
version: 0.4
baseline_source: peacebypiece-ui-0.13.50
status: draft-final
updated: 2026-05-18
---


# 02. 디자인 토큰 명세

## 1. 원칙

A-TYPE은 색을 직접 쓰지 않는다. 모든 색상, 간격, 라운드, 그림자, z-index, motion은 token으로 사용한다.

```txt
문서명: WAFL A-TYPE
코드 prefix: pbp 유지
정의: pbp semantic token = WAFL A-TYPE semantic token
```

## 2. Color Token

```css
:root {
  --pbp-bg-app: #FAF7F2;
  --pbp-bg-page: #FCFAF6;
  --pbp-surface-base: #FFFFFF;
  --pbp-surface-soft: #F7F1E8;
  --pbp-surface-muted: #EFE6DA;
  --pbp-surface-selected: #F3E7D7;
  --pbp-border-soft: #E8DED1;
  --pbp-border-strong: #D6C5B3;
  --pbp-text-primary: #2B2118;
  --pbp-text-secondary: #66584A;
  --pbp-text-muted: #8B8176;
  --pbp-text-disabled: #B8AEA3;
  --pbp-text-inverse: #FFFFFF;
  --pbp-brand-primary: #3B2414;
  --pbp-brand-primary-hover: #2A180D;
  --pbp-brand-soft: #A8733D;
  --pbp-brand-muted: #E7D5BD;
  --pbp-status-success-bg: #E8F6EE;
  --pbp-status-success-fg: #2E7D4F;
  --pbp-status-info-bg: #EAF1FF;
  --pbp-status-info-fg: #2F6FEB;
  --pbp-status-warning-bg: #FFF4DC;
  --pbp-status-warning-fg: #A66400;
  --pbp-status-danger-bg: #FDEBEC;
  --pbp-status-danger-fg: #C93A3A;
  --pbp-status-neutral-bg: #F1EFEC;
  --pbp-status-neutral-fg: #6F665D;
}
```

## 3. Typography Token

```ts
export const typeScale = {
  pageTitle: { fontSize: 32, lineHeight: 40, fontWeight: 700, letterSpacing: -0.4 },
  sectionTitle: { fontSize: 22, lineHeight: 30, fontWeight: 700, letterSpacing: -0.2 },
  cardTitle: { fontSize: 18, lineHeight: 26, fontWeight: 700 },
  body: { fontSize: 14, lineHeight: 22, fontWeight: 400 },
  bodyStrong: { fontSize: 14, lineHeight: 22, fontWeight: 600 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: 400 },
  kpi: { fontSize: 30, lineHeight: 36, fontWeight: 800, letterSpacing: -0.4 },
};
```

## 4. Spacing / Radius / Shadow

```ts
export const space = { 0:0, 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64 };
export const radius = { xs:6, sm:8, md:12, lg:16, xl:20, card:20, modal:24, pill:999 };
export const shadow = {
  none: "none",
  card: "0 1px 2px rgba(43, 33, 24, 0.04)",
  elevated: "0 8px 24px rgba(43, 33, 24, 0.08)",
  modal: "0 24px 80px rgba(43, 33, 24, 0.18)",
};
```

## 5. Breakpoint / Device Token

```ts
export type DeviceKind = "pc" | "tablet-landscape" | "tablet-portrait" | "mobile";

export const breakpoints = {
  mobileMax: 767,
  tabletPortraitMin: 768,
  tabletPortraitMax: 899,
  tabletLandscapeMin: 900,
  tabletLandscapeMax: 1279,
  pcMin: 1280,
};
```

## 6. 금지 규칙

```txt
- 신규 화면에서 raw hex 사용 금지
- bg-[#...] 직접 사용 금지
- text-stone, border-stone 남발 금지
- 상태 색상과 브랜드 색상 혼용 금지
- 화면마다 임의 radius/padding 사용 금지
```
