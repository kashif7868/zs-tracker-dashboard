import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

/* =========================================================
   ACCESS RESTRICTION SCREEN
   ========================================================= */

type AccessRestrictionProps = {
  title: string;
  message: string;
};

function AccessRestriction({
  title,
  message,
}: AccessRestrictionProps) {
  const navigate =
    useNavigate();

  const {
    logout,
  } = useAuth();

  const handleLogout =
    async () => {
      await logout();

      navigate(
        "/signin",
        {
          replace: true,
        }
      );
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          Zorays Solar Project Tracker
        </p>

        <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
          {message}
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              void handleLogout();
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROTECTED DASHBOARD ROUTE

   Dashboard access allowed:

   - admin
   - super_admin
   - active assigned custom Roles

   Dashboard access denied:

   - unauthenticated users
   - role: user
   - inactive accounts
   - blocked accounts
   - inactive assigned Roles
   ========================================================= */

export default function ProtectedRoute() {
  const location =
    useLocation();

  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuth();

  /* =======================================================
     AUTHENTICATION LOADING
     ======================================================= */

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <span className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600 dark:border-gray-700 dark:border-t-emerald-400" />

            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading project tracker...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT AUTHENTICATED

     Requested URL preserve hogi taa ke successful login ke
     baad user original page par wapas ja sake.
     ======================================================= */

  if (
    !isAuthenticated ||
    !user
  ) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: {
            pathname:
              location.pathname,

            search:
              location.search,
          },
        }}
      />
    );
  }

  /* =======================================================
     ACCOUNT STATUS
     ======================================================= */

  if (
    user.status ===
    "blocked"
  ) {
    return (
      <AccessRestriction
        title="Account Blocked"
        message="Your account has been blocked. Please contact an administrator if you believe this restriction should be reviewed."
      />
    );
  }

  if (
    user.status ===
    "inactive"
  ) {
    return (
      <AccessRestriction
        title="Account Inactive"
        message="Your account is currently inactive. Dashboard access will become available after your account is activated."
      />
    );
  }

  /* =======================================================
     ROLE
     ======================================================= */

  const normalizedRole =
    typeof user.role ===
      "string"
      ? user.role
          .trim()
          .toLowerCase()
      : "";

  /* =======================================================
     ROLE NOT ASSIGNED

     New registrations initially receive role: user.

     Yeh authenticated account hai, is liye user ko Sign In
     par redirect nahi karna. Warna authentication redirect
     loop ban sakta hai.
     ======================================================= */

  if (
    !normalizedRole ||
    normalizedRole ===
      "user"
  ) {
    return (
      <AccessRestriction
        title="Role Assignment Required"
        message="Your account has been created successfully, but a dashboard Role has not been assigned yet. An administrator must assign an active Role before you can access the project tracker."
      />
    );
  }

  /* =======================================================
     INACTIVE CUSTOM ROLE

     System admin/super_admin roles ko roleDetails absent hone
     ki surat mein block nahi karna.
     ======================================================= */

  const isSystemAdministrator =
    normalizedRole ===
      "admin" ||
    normalizedRole ===
      "super_admin";

  if (
    !isSystemAdministrator &&
    user.roleDetails?.status ===
      "inactive"
  ) {
    return (
      <AccessRestriction
        title="Role Inactive"
        message="Your assigned Role is currently inactive. Please contact an administrator to restore dashboard access."
      />
    );
  }

  /* =======================================================
     AUTHORIZED USER

     Individual pages/modules ko permissions ke through
     separately control kiya jayega.
     ======================================================= */

  return <Outlet />;
}