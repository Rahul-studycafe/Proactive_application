"use client";

import { type ReactNode } from "react";
import { usePermissions } from "@/contexts/PermissionsContext";

interface CanProps {
  /**
   * The canonical permission key (e.g. "client:create", "invoice:delete", "report:export")
   * or an array of alternative permissions (renders if ANY are granted).
   */
  do: string | string[];
  /**
   * Content to render if permitted, or a render function receiving (allowed: boolean)
   */
  children: ReactNode | ((allowed: boolean) => ReactNode);
  /**
   * Optional fallback content to render when access is denied
   */
  fallback?: ReactNode;
  /**
   * If true, renders the child even when denied, passing allowed=false so buttons can be disabled
   */
  passThrough?: boolean;
}

/**
 * Declarative CASL-style Permission Gate.
 * Eliminates repetitive if/else checks across JSX markup.
 *
 * Example 1: Hide button when denied
 * <Can do="client:create">
 *   <Button>Add Client</Button>
 * </Can>
 *
 * Example 2: Pass an array of permissions (allowed if user has any of them)
 * <Can do={["client:services_manage", "client:edit"]}>
 *   <Button>Add Service</Button>
 * </Can>
 *
 * Example 3: Keep button visible but disabled with explanatory tooltip
 * <Can do="invoice:delete" passThrough>
 *   {(allowed) => (
 *     <Button disabled={!allowed} title={!allowed ? "Requires invoice:delete" : undefined}>
 *       Delete
 *     </Button>
 *   )}
 * </Can>
 */
export function Can({
  do: action,
  children,
  fallback = null,
  passThrough = false,
}: CanProps) {
  const { can } = usePermissions();
  const allowed = Array.isArray(action)
    ? action.some((a) => can(a))
    : can(action);

  if (passThrough) {
    if (typeof children === "function") {
      return <>{children(allowed)}</>;
    }
    return <>{allowed ? children : fallback}</>;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  if (typeof children === "function") {
    return <>{children(true)}</>;
  }

  return <>{children}</>;
}
