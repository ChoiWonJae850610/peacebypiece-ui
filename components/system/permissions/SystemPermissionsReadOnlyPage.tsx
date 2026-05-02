"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import type {
  PermissionCatalogItem,
  RolePermissionMap,
} from "@/lib/permissions/permissionTypes";

interface PermissionApiSuccess {
  ok: true;
  catalog: PermissionCatalogItem[];
  rolePermissions: RolePermissionMap[];
}

interface PermissionApiError {
  ok: false;
  error: string;
  message?: string;
}

type PermissionApiResponse = PermissionApiSuccess | PermissionApiError;

function getActiveClassName(active: boolean): string {
  return active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600";
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-xs leading-5 text-stone-500">{description}</p>
      ) : null}
    </article>
  );
}

function CatalogSection({ catalog }: { catalog: PermissionCatalogItem[] }) {
  if (catalog.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
        표시할 permission catalog가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {catalog.map((permission) => (
        <article
          key={permission.permissionKey}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-950">
                {permission.label}
              </p>
              <code className="mt-1 block truncate text-xs text-stone-500">
                {permission.permissionKey}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600">
                {permission.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getActiveClassName(
                  permission.isActive,
                )}`}
              >
                {permission.isActive ? "활성" : "비활성"}
              </span>
            </div>
          </div>
          {permission.description ? (
            <p className="mt-3 text-xs leading-5 text-stone-600">
              {permission.description}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function RolePermissionSection({
  rolePermissions,
}: {
  rolePermissions: RolePermissionMap[];
}) {
  if (rolePermissions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
        표시할 role permission map이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rolePermissions.map((roleMap) => (
        <article
          key={roleMap.role}
          className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-stone-950">
              {roleMap.role}
            </h2>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600">
              {roleMap.permissions.length}개
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {roleMap.permissions.map((permission) => (
              <code
                key={permission}
                className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-stone-600"
              >
                {permission}
              </code>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function SystemPermissionsReadOnlyPage() {
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMap[]>([]);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState("권한 정보를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPermissions() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/system/permissions", {
          method: "GET",
        });
        const data = (await response.json()) as PermissionApiResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          setCatalog([]);
          setRolePermissions([]);
          setMessage(data.ok ? "권한 정보를 불러오지 못했습니다." : data.message || data.error);
          return;
        }

        setCatalog(data.catalog);
        setRolePermissions(data.rolePermissions);
        setMessage("권한 catalog와 role permission map을 불러왔습니다.");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setCatalog([]);
        setRolePermissions([]);
        setMessage(
          error instanceof Error
            ? error.message
            : "권한 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(catalog.map((item) => item.category))).sort()],
    [catalog],
  );

  const filteredCatalog = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return catalog.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return (
        item.permissionKey.toLowerCase().includes(normalizedKeyword) ||
        item.label.toLowerCase().includes(normalizedKeyword) ||
        (item.description ?? "").toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [catalog, categoryFilter, keyword]);

  const activeCount = catalog.filter((item) => item.isActive).length;
  const inactiveCount = catalog.length - activeCount;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM PERMISSIONS
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                권한 관리
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                permission catalog와 role permission map을 read-only로 확인하는 시스템관리자 화면입니다.
                권한 부여, role 변경, 저장 action은 이번 버전에서 연결하지 않습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템관리자 홈
              </Link>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                작업지시서 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="전체 permission" value={catalog.length} />
          <SummaryCard label="활성 permission" value={activeCount} />
          <SummaryCard
            label="role map"
            value={rolePermissions.length}
            description={`비활성 permission ${inactiveCount}개`}
          />
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px] lg:items-end">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">연결 상태</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
              <code className="mt-3 block rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
                GET /api/system/permissions
              </code>
            </div>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              검색
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="permission, label"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              카테고리
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "전체" : category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">Role permission map</h2>
          <div className="mt-4">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                role permission map을 불러오는 중입니다.
              </div>
            ) : (
              <RolePermissionSection rolePermissions={rolePermissions} />
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">Permission catalog</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                표시 대상 {filteredCatalog.length}개 / 전체 {catalog.length}개
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
              permission catalog를 불러오는 중입니다.
            </div>
          ) : (
            <CatalogSection catalog={filteredCatalog} />
          )}
        </section>
      </div>
    </main>
  );
}
