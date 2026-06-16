"use client";

import { useCallback, useEffect, useState } from "react";

export function useWorkspaceToolState<Key extends string>({
  resetKey,
  defaultTool,
}: {
  resetKey: string;
  defaultTool: Key;
}) {
  const [open, setOpenState] = useState(false);
  const [activeTool, setActiveTool] = useState<Key>(defaultTool);

  const setOpen = useCallback((nextOpen: boolean) => {
    setOpenState(nextOpen);
    if (!nextOpen) setActiveTool(defaultTool);
  }, [defaultTool]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    setOpenState(false);
    setActiveTool(defaultTool);
  }, [defaultTool, resetKey]);

  return {
    open,
    setOpen,
    activeTool,
    setActiveTool,
  };
}
