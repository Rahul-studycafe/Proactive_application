"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type ScopeType = "everything" | "team_only" | "assigned_only";

export type Permission =
  | "clients.view"
  | "clients.create"
  | "clients.edit"
  | "clients.delete"
  | "tasks.view"
  | "tasks.create"
  | "tasks.edit"
  | "invoices.view"
  | "invoices.create"
  | "invoices.edit"
  | "settings.view"
  | "settings.manage_users"
  | "attendance.manage"
  | "attendance.view_all"
  | "attendance.view_self"
  | "attendance.matrix_view_self"
  | "attendance:matrix_view_self"
  | (string & {}); // Allows any canonical "resource:action" string

interface PermissionsContextValue {
  isSuperAdmin: boolean;
  can: (perm: Permission | string) => boolean;
  cannot: (perm: Permission | string) => boolean;
  getScope: (resource: string) => ScopeType;
  roles: { id: string; name: string }[];
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(
  undefined,
);

/**
 * Normalizes legacy permission strings like "clients.create" into canonical "client:create"
 */
function normalizePermissionKey(key: string): string {
  if (!key) return "";
  let normalized = key.includes(".") ? key.replace(".", ":") : key;

  // Handle common plural legacy prefixes
  if (normalized.startsWith("clients:")) {
    normalized = "client:" + normalized.slice(8);
  } else if (normalized.startsWith("tasks:")) {
    normalized = "task:" + normalized.slice(6);
  } else if (normalized.startsWith("invoices:")) {
    normalized = "invoice:" + normalized.slice(9);
  } else if (normalized === "settings:manage_users") {
    normalized = "user:edit";
  }

  return normalized;
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<PermissionsContextValue>(() => {
    if (!user) {
      return {
        isSuperAdmin: false,
        can: () => false,
        cannot: () => true,
        getScope: () => "assigned_only",
        roles: [],
      };
    }

    // Platform Super Admin / Owner bypasses all checks
    const isSuperAdmin = Boolean(
      user.isOwner ||
      user.isSuperAdmin ||
      user.role?.toLowerCase().includes("super admin"),
    );

    const effectiveMap = user.effectivePermissions || {};

    const can = (perm: Permission | string): boolean => {
      if (isSuperAdmin) return true;
      if (!perm) return true;

      const canonicalKey = normalizePermissionKey(perm);
      if (effectiveMap[canonicalKey]?.allowed) return true;
      if (effectiveMap[perm]?.allowed) return true;

      // Fallback for Admin role if effectiveMap is empty during transition
      if (user.role?.toLowerCase() === "admin") {
        return true;
      }

      return false;
    };

    const cannot = (perm: Permission | string): boolean => !can(perm);

    const getScope = (resource: string): ScopeType => {
      if (isSuperAdmin) return "everything";

      const normResource = resource.endsWith("s")
        ? resource.slice(0, -1)
        : resource;

      for (const [key, val] of Object.entries(effectiveMap)) {
        if (key.startsWith(`${normResource}:`) && val.allowed) {
          if (val.scope === "everything") return "everything";
          if (val.scope === "team_only") return "team_only";
        }
      }

      return "assigned_only";
    };

    return {
      isSuperAdmin,
      can,
      cannot,
      getScope,
      roles: user.roles || (user.role ? [{ id: "role", name: user.role }] : []),
    };
  }, [user]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx)
    throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
}

export { Can } from "@/components/shared/Can";
