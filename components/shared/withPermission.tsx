"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { AccessRestricted } from "@/components/shared/AccessRestricted";

export interface WithPermissionOptions {
  /**
   * If true, only Super Admins (Practice Owners) are allowed access
   */
  superAdminOnly?: boolean;
  /**
   * Custom title displayed on the Access Restricted screen
   */
  title?: string;
  /**
   * Custom description explaining why access is restricted
   */
  description?: string;
  /**
   * Return destination link (e.g. "/clients", "/tasks")
   */
  backHref?: string;
  /**
   * Label for the return button
   */
  backLabel?: string;
}

/**
 * Enterprise Higher-Order Component (HOC) for declarative Page-Level Route Protection.
 * Gating directly visited URLs in Next.js App Router.
 *
 * Example:
 * export default withPermission(NewClientPage, "client:create", {
 *   title: "Client Creation Restricted",
 *   description: "You do not have permissions to create new clients.",
 *   backHref: "/clients",
 *   backLabel: "Return to Clients",
 * });
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string | string[],
  options: WithPermissionOptions = {}
): React.FC<P> {
  const GuardedPage: React.FC<P> = (props: P) => {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { can, isSuperAdmin } = usePermissions();

    // 1. Loading state while authentication and effective permissions initialize
    if (isAuthLoading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Verifying permissions...</span>
          </div>
        </div>
      );
    }

    // 2. Unauthenticated state is handled by AppLayoutClient redirect
    if (!isAuthenticated) {
      return null;
    }

    // 3. Super Admin Only check
    if (options.superAdminOnly && !isSuperAdmin) {
      return (
        <AccessRestricted
          title={options.title || "Super Admin Access Required"}
          description={
            options.description ||
            "This area is reserved exclusively for the Practice Super Admin / Owner."
          }
          backHref={options.backHref || "/"}
          backLabel={options.backLabel || "Return to Dashboard"}
        />
      );
    }

    // 4. Role & Action Permissions evaluation
    const isAllowed =
      isSuperAdmin ||
      (Array.isArray(requiredPermission)
        ? requiredPermission.some((perm) => can(perm))
        : can(requiredPermission));

    if (!isAllowed) {
      const permLabel = Array.isArray(requiredPermission)
        ? requiredPermission.join(" or ")
        : requiredPermission;

      return (
        <AccessRestricted
          title={options.title || "Access Restricted"}
          description={
            options.description ||
            `You do not have the required permission (${permLabel}) to access this page. Please contact your Practice Administrator.`
          }
          backHref={options.backHref || "/"}
          backLabel={options.backLabel || "Return to Dashboard"}
        />
      );
    }

    // 5. Permitted: render wrapped component
    return <WrappedComponent {...props} />;
  };

  GuardedPage.displayName = `withPermission(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return GuardedPage;
}

/**
 * RouteGuard comp<JSX></JSX> route protection
 */
export function RouteGuard({
  children,
  permission,
  superAdminOnly,
  title,
  description,
  backHref,
  backLabel,
}: {
  children: React.ReactNode;
  permission?: string | string[];
  superAdminOnly?: boolean;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { can, isSuperAdmin } = usePermissions();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (superAdminOnly && !isSuperAdmin) {
    return (
      <AccessRestricted
        title={title || "Super Admin Access Required"}
        description={
          description ||
          "This area is reserved exclusively for the Practice Super Admin / Owner."
        }
        backHref={backHref}
        backLabel={backLabel}
      />
    );
  }

  if (permission) {
    const isAllowed =
      isSuperAdmin ||
      (Array.isArray(permission)
        ? permission.some((perm) => can(perm))
        : can(permission));

    if (!isAllowed) {
      return (
        <AccessRestricted
          title={title}
          description={description}
          backHref={backHref}
          backLabel={backLabel}
        />
      );
    }
  }

  return <>{children}</>;
}

