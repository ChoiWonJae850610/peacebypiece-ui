import { useCallback, useEffect, useRef } from "react";

type Input = {
  readonly visible: boolean;
  readonly onOpen: () => void;
  readonly onExternalClose: () => void;
};

/**
 * Owns the rising/falling-edge contract between an always-mounted sheet and its
 * reducer. Callers mark X/V closure before notifying their parent so the later
 * visible=false edge cannot close the same session twice.
 */
export function useExternalReelVisibilityLifecycle(input: Input) {
  const { visible, onOpen, onExternalClose } = input;
  const sessionOpen = useRef(false);

  useEffect(() => {
    if (visible && !sessionOpen.current) {
      sessionOpen.current = true;
      onOpen();
      return;
    }
    if (!visible && sessionOpen.current) {
      sessionOpen.current = false;
      onExternalClose();
    }
  }, [onExternalClose, onOpen, visible]);

  const markCurrentSessionClosed = useCallback(() => {
    if (!sessionOpen.current) return false;
    sessionOpen.current = false;
    return true;
  }, []);

  return { markCurrentSessionClosed } as const;
}
