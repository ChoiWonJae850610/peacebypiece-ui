"use client";

import { useCallback } from "react";

type WorkspaceSelectionControllerOptions = {
  selectedId: string;
  onSelect: (nextId: string) => void;
  queryParamName?: string;
  onSelectionChange?: (nextId: string) => void;
  disabled?: boolean;
};

function replaceSelectionQuery(queryParamName: string, selectedId: string) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (selectedId) url.searchParams.set(queryParamName, selectedId);
  else url.searchParams.delete(queryParamName);
  const nextQuery = url.searchParams.toString();
  window.history.replaceState(
    null,
    "",
    nextQuery ? `${url.pathname}?${nextQuery}` : url.pathname,
  );
}

export function useWorkspaceSelectionController({
  selectedId,
  onSelect,
  queryParamName,
  onSelectionChange,
  disabled = false,
}: WorkspaceSelectionControllerOptions) {
  return useCallback(
    (requestedId: string) => {
      if (disabled) return selectedId;

      const nextId = requestedId === selectedId ? "" : requestedId;
      if (queryParamName) replaceSelectionQuery(queryParamName, nextId);
      onSelect(nextId);
      onSelectionChange?.(nextId);
      return nextId;
    }, [disabled, onSelect, onSelectionChange, queryParamName, selectedId],
  );
}
