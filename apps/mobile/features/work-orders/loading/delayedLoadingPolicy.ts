export const DELAYED_LOADING_THRESHOLD_MS = 400;

export const WORK_ORDER_LOADING_MESSAGES = {
  detail: "작업지시서를 불러오는 중입니다.",
  media: "이미지와 첨부파일을 불러오는 중입니다.",
  sizeColor: "사이즈·색상 정보를 불러오는 중입니다.",
  fabric: "원단 정보를 불러오는 중입니다.",
  accessory: "부자재 정보를 불러오는 중입니다.",
} as const;

type TimerHandle = ReturnType<typeof setTimeout>;

type DelayedLoadingControllerOptions = {
  readonly onVisibilityChange: (visible: boolean) => void;
  readonly schedule?: (callback: () => void, delayMs: number) => TimerHandle;
  readonly cancel?: (handle: TimerHandle) => void;
  readonly delayMs?: number;
};

type DelayedLoadingUpdate = {
  readonly loading: boolean;
  readonly identity: string;
};

export function createDelayedLoadingController({
  onVisibilityChange,
  schedule = setTimeout,
  cancel = clearTimeout,
  delayMs = DELAYED_LOADING_THRESHOLD_MS,
}: DelayedLoadingControllerOptions) {
  let currentIdentity: string | null = null;
  let loading = false;
  let visible = false;
  let timer: TimerHandle | null = null;

  function cancelPendingTimer() {
    if (timer === null) return;
    cancel(timer);
    timer = null;
  }

  function setVisible(nextVisible: boolean) {
    if (visible === nextVisible) return;
    visible = nextVisible;
    onVisibilityChange(nextVisible);
  }

  return {
    update(next: DelayedLoadingUpdate) {
      if (currentIdentity !== next.identity) {
        cancelPendingTimer();
        setVisible(false);
        currentIdentity = next.identity;
      }

      loading = next.loading;
      if (!loading) {
        cancelPendingTimer();
        setVisible(false);
        return;
      }
      if (visible || timer !== null) return;

      timer = schedule(() => {
        timer = null;
        if (loading) setVisible(true);
      }, delayMs);
    },
    dispose() {
      loading = false;
      cancelPendingTimer();
      setVisible(false);
    },
  };
}
