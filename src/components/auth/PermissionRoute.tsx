import type {
  ReactNode,
} from "react";

import {
  Navigate,
  Outlet,
} from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  hasAllUserPermissions,
  hasAnyUserPermission,
  hasUserPermission,
} from "../../services/auth.service";

/* =========================================================
   PROPS
   ========================================================= */

type PermissionRouteProps = {
  /**
   * User ke paas yeh single permission honi chahiye.
   */
  permission?: string;

  /**
   * Listed permissions mein se kam az kam ek required hai.
   */
  anyOf?: string[];

  /**
   * Listed tamam permissions required hain.
   */
  allOf?: string[];

  /**
   * Sirf admin aur super_admin users.
   */
  adminOnly?: boolean;

  /**
   * Unauthorized user ko kahan bhejna hai.
   */
  redirectTo?: string;

  /**
   * Component wrapper aur nested route,
   * dono styles support hoti hain.
   */
  children?: ReactNode;
};

/* =========================================================
   PERMISSION ROUTE
   ========================================================= */

export default function PermissionRoute({
  permission,
  anyOf = [],
  allOf = [],
  adminOnly = false,
  redirectTo = "/",
  children,
}: PermissionRouteProps) {
  const {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
  } = useAuth();

  /* =======================================================
     LOADING
     ======================================================= */

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400" />

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     AUTHENTICATION CHECK
     ======================================================= */

  if (
    !isAuthenticated ||
    !user
  ) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }

  /* =======================================================
     ADMIN-ONLY CHECK
     ======================================================= */

  if (
    adminOnly &&
    !isAdmin
  ) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          message:
            "You are not authorized to access this page.",
        }}
      />
    );
  }

  /* =======================================================
     PERMISSION CHECKS
     ======================================================= */

  let hasAccess = true;

  if (
    permission?.trim()
  ) {
    hasAccess =
      hasAccess &&
      hasUserPermission(
        user,
        permission
      );
  }

  if (
    anyOf.length > 0
  ) {
    hasAccess =
      hasAccess &&
      hasAnyUserPermission(
        user,
        anyOf
      );
  }

  if (
    allOf.length > 0
  ) {
    hasAccess =
      hasAccess &&
      hasAllUserPermissions(
        user,
        allOf
      );
  }

  if (!hasAccess) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          message:
            "You do not have permission to access this page.",
        }}
      />
    );
  }

  /* =======================================================
     AUTHORIZED CONTENT
     ======================================================= */

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
}