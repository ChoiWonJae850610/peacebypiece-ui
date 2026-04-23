"use client";

import { useEffect, useState } from "react";
import {
  getDbConnectionStatus,
  setDbConnectionStatus,
  subscribeDbConnectionStatus,
  type DbConnectionStatus,
} from "@/lib/repositories/dbConnectionStatusStore";

export function useDbConnectionStatus() {
  const [status, setStatus] = useState<DbConnectionStatus>(() => getDbConnectionStatus());

  useEffect(() => subscribeDbConnectionStatus(setStatus), []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/workorders/status", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (response) => {
        let body: DbConnectionStatus | null = null;

        try {
          body = (await response.json()) as DbConnectionStatus;
        } catch {
          throw new Error("Failed to parse DB status response.");
        }

        if (!response.ok || !body) {
          throw new Error(body?.message ?? "Failed to fetch DB status.");
        }

        if (cancelled) return;
        setDbConnectionStatus(body);
      })
      .catch((error) => {
        if (cancelled) return;
        setDbConnectionStatus({
          mode: "db",
          configured: true,
          connected: false,
          driverReady: true,
          fallbackActive: true,
          source: "status-check",
          code: "DB_CONNECTION_FAILED",
          message: error instanceof Error ? error.message : "Failed to fetch DB status.",
          configSource: null,
          checkedAt: new Date().toISOString(),
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
