import { beginWaflPresentationFirstOperation } from "../../../application/waflPresentationBoundary.ts";

export async function flushProductionCategorySwitch(input: {
  readonly dirty: boolean;
  readonly flush: () => Promise<boolean>;
  readonly onProcessing: (message: string | null, helper?: string | null) => void;
  readonly onSwitch: () => void;
}) {
  if (input.dirty) {
    await beginWaflPresentationFirstOperation({
      enterPending: () => input.onProcessing("변경사항을 저장 중입니다.", "잠시만 기다려 주세요."),
    });
  }
  try {
    if (!(await input.flush())) return false;
    input.onSwitch();
    return true;
  } finally {
    if (input.dirty) input.onProcessing(null, null);
  }
}
