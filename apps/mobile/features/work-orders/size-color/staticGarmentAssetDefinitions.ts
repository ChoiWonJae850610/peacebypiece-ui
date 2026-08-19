export type WaflStaticGarmentAssetCode = "T" | "B" | "O" | "D";
export type WaflGarmentViewSide = "front" | "back";

export type WaflStaticGarmentViewDefinition = {
  readonly assetFile: string;
  readonly categoryCode: WaflStaticGarmentAssetCode;
  readonly side: WaflGarmentViewSide;
  /** Fixed repository-authored SVG paths. Selection state never enters this owner. */
  readonly outlinePaths: readonly string[];
  readonly detailPaths: readonly string[];
  /** Uniform view-only placement into the shared 360×280 front/back diagram. */
  readonly overlayTransform: string;
  readonly sourceViewBox: "0 0 600 800";
};

export type WaflStaticGarmentAssetDefinition = {
  readonly categoryCode: WaflStaticGarmentAssetCode;
  readonly front: WaflStaticGarmentViewDefinition;
  readonly back: WaflStaticGarmentViewDefinition;
};

export const WAFL_STATIC_GARMENT_ASSETS: Readonly<Record<WaflStaticGarmentAssetCode, WaflStaticGarmentAssetDefinition>> = {
  T: {
    categoryCode: "T",
    front: {
      assetFile: "apps/mobile/assets/garments/GARMENT-UPPER-FRONT.svg",
      categoryCode: "T",
      side: "front",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.38 0 0 0.38 -24 -14)",
      outlinePaths: [
        "M270 150 C274 174 284 190 300 190 C316 190 326 174 330 150 C348 155 366 162 382 170 L430 198 L480 470 L430 485 L385 255 L390 515 Q300 536 210 515 L215 255 L170 485 L120 470 L170 198 L218 170 C234 162 252 155 270 150 Z",
      ],
      detailPaths: ["M218 170 C200 192 198 232 215 255", "M382 170 C400 192 402 232 385 255", "M225 493 Q300 509 375 493", "M124 449 L174 463", "M476 449 L426 463"],
    },
    back: {
      assetFile: "apps/mobile/assets/garments/GARMENT-UPPER-BACK.svg",
      categoryCode: "T",
      side: "back",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.38 0 0 0.38 156 -14)",
      outlinePaths: [
        "M270 150 C278 164 288 172 300 172 C312 172 322 164 330 150 C348 155 366 162 382 170 L430 198 L480 470 L430 485 L385 255 L390 515 Q300 536 210 515 L215 255 L170 485 L120 470 L170 198 L218 170 C234 162 252 155 270 150 Z",
      ],
      detailPaths: ["M218 170 C200 192 198 232 215 255", "M382 170 C400 192 402 232 385 255", "M240 169 Q300 205 360 169", "M300 190 L300 492", "M225 493 Q300 509 375 493", "M124 449 L174 463", "M476 449 L426 463"],
    },
  },
  B: {
    categoryCode: "B",
    front: {
      assetFile: "apps/mobile/assets/garments/GARMENT-LOWER-FRONT.svg",
      categoryCode: "B",
      side: "front",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.34 0 0 0.34 -10 -4)",
      outlinePaths: [
        "M190 145 Q300 132 410 145 L405 180 Q300 192 195 180 Z",
        "M194 180 L165 270 C175 385 192 560 205 704 L280 704 L300 376",
        "M406 180 L435 270 C425 385 408 560 395 704 L320 704 L300 376",
        "M250 340 C276 335 291 351 300 376 C309 351 324 335 350 340",
      ],
      detailPaths: ["M195 180 Q300 192 405 180", "M205 187 C202 224 188 249 168 268", "M395 187 C398 224 412 249 432 268", "M300 180 L300 325 C286 325 276 316 273 301", "M215 676 L279 676", "M321 676 L385 676", "M255 370 L246 668", "M345 370 L354 668"],
    },
    back: {
      assetFile: "apps/mobile/assets/garments/GARMENT-LOWER-BACK.svg",
      categoryCode: "B",
      side: "back",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.34 0 0 0.34 166 -4)",
      outlinePaths: [
        "M190 145 Q300 132 410 145 L405 180 Q300 192 195 180 Z",
        "M194 180 L165 270 C175 385 192 560 205 704 L280 704 L300 376",
        "M406 180 L435 270 C425 385 408 560 395 704 L320 704 L300 376",
        "M248 328 C277 323 292 346 300 376 C308 346 323 323 352 328",
      ],
      detailPaths: ["M195 180 Q300 192 405 180", "M205 192 Q250 226 286 228", "M395 192 Q350 226 314 228", "M220 206 Q255 248 285 246", "M380 206 Q345 248 315 246", "M300 180 L300 318", "M215 676 L279 676", "M321 676 L385 676", "M255 360 L246 668", "M345 360 L354 668"],
    },
  },
  O: {
    categoryCode: "O",
    front: {
      assetFile: "apps/mobile/assets/garments/GARMENT-OUTER-FRONT.svg",
      categoryCode: "O",
      side: "front",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.33 0 0 0.33 -9 -5)",
      outlinePaths: [
        "M270 150 C278 170 288 182 300 182 C312 182 322 170 330 150 C350 156 372 166 390 178 L440 211 L485 500 L438 512 L390 270 L380 656 Q300 671 220 656 L210 270 L162 512 L115 500 L160 211 L210 178 C228 166 250 156 270 150 Z",
      ],
      detailPaths: ["M210 178 C194 210 194 245 210 270", "M390 178 C406 210 406 245 390 270", "M250 178 C264 202 282 216 300 218 C318 216 336 202 350 178", "M300 218 L300 634", "M247 408 L277 408 L277 448 L247 448 Z", "M353 408 L323 408 L323 448 L353 448 Z", "M231 628 Q300 640 369 628", "M121 476 L166 488", "M479 476 L434 488"],
    },
    back: {
      assetFile: "apps/mobile/assets/garments/GARMENT-OUTER-BACK.svg",
      categoryCode: "O",
      side: "back",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.33 0 0 0.33 167 -5)",
      outlinePaths: [
        "M270 150 C280 164 290 172 300 172 C310 172 320 164 330 150 C350 156 372 166 390 178 L440 211 L485 500 L438 512 L390 270 L380 656 Q300 671 220 656 L210 270 L162 512 L115 500 L160 211 L210 178 C228 166 250 156 270 150 Z",
      ],
      detailPaths: ["M210 178 C194 210 194 245 210 270", "M390 178 C406 210 406 245 390 270", "M240 180 C258 198 278 207 300 207 C322 207 342 198 360 180", "M300 207 L300 656", "M258 470 Q300 492 342 470", "M300 522 L300 650", "M231 628 Q300 640 369 628", "M121 476 L166 488", "M479 476 L434 488"],
    },
  },
  D: {
    categoryCode: "D",
    front: {
      assetFile: "apps/mobile/assets/garments/GARMENT-DRESS-FRONT.svg",
      categoryCode: "D",
      side: "front",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.33 0 0 0.33 -7 -5)",
      outlinePaths: [
        "M270 150 C274 174 284 190 300 190 C316 190 326 174 330 150 C348 155 366 162 380 170 L430 200 L475 448 L430 462 L386 253 Q370 350 374 390 L422 690 Q300 715 178 690 L226 390 Q230 350 214 253 L170 462 L125 448 L170 200 L220 170 C234 162 252 155 270 150 Z",
      ],
      detailPaths: ["M220 170 C200 195 198 232 214 253", "M380 170 C400 195 402 232 386 253", "M226 390 Q300 404 374 390", "M187 673 Q300 696 413 673", "M131 425 L175 438", "M469 425 L425 438"],
    },
    back: {
      assetFile: "apps/mobile/assets/garments/GARMENT-DRESS-BACK.svg",
      categoryCode: "D",
      side: "back",
      sourceViewBox: "0 0 600 800",
      overlayTransform: "matrix(0.33 0 0 0.33 169 -5)",
      outlinePaths: [
        "M270 150 C278 164 288 172 300 172 C312 172 322 164 330 150 C348 155 366 162 380 170 L430 200 L475 448 L430 462 L386 253 Q370 350 374 390 L422 690 Q300 715 178 690 L226 390 Q230 350 214 253 L170 462 L125 448 L170 200 L220 170 C234 162 252 155 270 150 Z",
      ],
      detailPaths: ["M220 170 C200 195 198 232 214 253", "M380 170 C400 195 402 232 386 253", "M238 173 Q300 211 362 173", "M300 194 L300 390", "M226 390 Q300 404 374 390", "M187 673 Q300 696 413 673", "M131 425 L175 438", "M469 425 L425 438"],
    },
  },
} as const;

export function getWaflStaticGarmentAsset(categoryCode: WaflStaticGarmentAssetCode) {
  return WAFL_STATIC_GARMENT_ASSETS[categoryCode];
}
