# WAFL App Design Theme v1 — Dongdaemun Atelier Ops

## 1. Theme Definition

Theme name:

```text
동대문 제작 워크룸
```

Internal name:

```text
Dongdaemun Atelier Ops
```

WAFL App Design Theme v1 defines the first visual foundation for the mobile/tablet WAFL app. The app should feel like a professional production workspace for Korean apparel work: fast, dense, deadline-aware, material-aware, and practical.

The product should not feel like a student portfolio, landing page, pretty sample app, gradient showcase, or a stack of oversized demo cards. The app should help a production user read fabric, accessory, process, due-date, cost, and current status quickly.

## 2. Color System

Final color values may be tuned after device review. The current contract is semantic consistency.

### Base

| Token | Use |
| --- | --- |
| Warm Paper | App background and app-level canvas |
| Off White | Quiet screen surface |
| Work Surface | Production workbench area |
| Card White | Data card and list row surface |
| Soft Line | Borders, dividers, compact separators |

### Primary

| Token | Use |
| --- | --- |
| Deep Navy | Main selected state, primary app identity, confirmed action |
| Navy Ink | Strong text, dense production labels, header copy |

### Production Accent

| Token | Use |
| --- | --- |
| Brick Orange | Order request, urgent production action, schedule attention |
| Thread Amber | Pending or follow-up detail |
| Fabric Beige | Material texture, swatch-like quiet accents |
| Deep Olive | Completed or locked production state |

### Status

| Label | Visual direction |
| --- | --- |
| 입력중 | warm gray |
| 발주 가능 | deep navy / muted blue |
| 발주 요청 | brick orange / amber |
| 발주 완료 | deep olive |
| 주의/잠김 | muted red |

## 3. Font Policy

- This version does not add font files.
- The app uses system font fallback first so layout density, Korean readability, and production rhythm can be verified before bundling typography.
- If a free/open font is bundled later, Pretendard and Noto Sans KR are candidate families.
- When a font is bundled, its LICENSE file must be included in the repository.
- Codex must not arbitrarily download or include font files.

## 4. Card Rules

- Use minimal shadow.
- Prefer border, divider, and background contrast over decorative elevation.
- Radius should be medium and practical.
- Information must read before decoration.
- Do not use a portfolio-style hero card as the default production-card structure.
- Keep practical data density for quantity, due date, material, accessory, process, and amount.
- Large visual blocks are allowed only when they directly support production work, such as representative image review or sketching.

## 5. Mobile And Tablet Policy

- Normal mobile production-card screens are designed for portrait orientation.
- Mobile landscape is not recommended or supported for the normal production-card flow.
- Tablet must support both portrait and landscape.
- Future drawing/sketch modules may allow both portrait and landscape on mobile because drawing and visual review may need rotation.

## 6. Action Policy

- Mobile actions are icon-only first.
- The current status primary action may use a short text button when the action must be unambiguous, such as `발주 요청` or `발주 완료`.
- Show only one primary action for the current status.
- Do not show `발주 요청` and `발주 완료` at the same time.
- Destructive actions use a red icon-only control and a later confirmation pattern.
- Tablet may show icon plus a short label where width allows it.

## 7. Tab Criteria

| Tab | Visual standard | Required direction |
| --- | --- | --- |
| 개요 | Dense production summary | Representative image, product identity, quantity, due date, status, unit cost, totals, trading/production summary, short memo |
| 이미지·첨부 | Thumbnail-first asset review | Representative image, image list, representative badge/crown concept, first-image auto-representative note, attachment list |
| 사이즈·색상 | Compact table and chips | Standard size, customer size, free size, cm/inch switch, inch fraction helper placeholder, color chips, color quantity |
| 원단 | Row-first material work | Name, supplier, color, required quantity, loss/allowance, stock use, order quantity, unit, unit price, amount, over-order handling, status |
| 부자재 | Row-first accessory work | Name, option/color, supplier, required quantity, loss/allowance, stock use, order quantity, unit, unit price, amount, status; category stays secondary |
| 제작 플로우 | Process workbench | Main factory, additional processes, partner, quantity, unit, unit price, amount, due date, stage status; drag/long-press direction only |
| 출력·공유 | 제작 문서 composition | 작업지시서, 공장 전달 작업지시서, 배송요청서 만들기, 배송요청 추가하기, view/share/print/save, attachment inclusion placeholder |

## 8. Runtime Visual Fidelity Rule

`2.0.0-alpha.5` applies this theme as an app surface correction, not as an in-app concept board.

- Do not show a runtime theme explanation strip such as `Dongdaemun Atelier Ops` inside the normal app surface.
- Keep theme rationale in documentation and let the screen itself communicate the production workroom direction.
- Avoid repeated bordered boxes when a divider, row, tab underline, or quiet background contrast is enough.
- Use representative image, garment thumbnail, output preview, and swatch placeholders built from React Native `View` and `Text`.
- Do not add external image assets, font files, icon libraries, or dependencies for these placeholders.
- Material and accessory rows should reveal fabric/accessory sense through compact swatches plus production data, not through large decorative cards.
- Summary values should prefer dense line rows over portfolio-style metric cards.
- Mobile must stay portrait-first for normal production-card screens, while tablet keeps restrained centered/wide workbench layouts.

## 9. Forbidden Direction

- Student portfolio feeling.
- Excessive gradient styling.
- Landing-page style exaggerated copy.
- Showing buttons together when the real policy allows only one current-state primary action.
- Real customer, vendor, factory, or workorder images.
- Font or image assets with unclear license.
- New font download or external image download in this version.
- Real camera, file picker, upload, share link, PDF generation, API, DB, R2, or Worker connection in this visual foundation version.
