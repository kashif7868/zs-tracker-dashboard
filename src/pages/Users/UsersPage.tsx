import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignUserRole,
  deleteUser,
  getUserAvatarUrl,
  getUserById,
  getUsers,
  removeUserRole,
  updateUser,
  updateUserStatus,
  type DashboardUser,
  type UpdateUserPayload,
  type UserStatus,
} from "../../services/user/user.service";

import {
  getActiveRoles,
  type DashboardRole,
} from "../../services/role/role.service";

/* =========================================================
   TYPES
   ========================================================= */

type EditUserFormState = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
};

/* =========================================================
   HELPERS
   ========================================================= */

const getErrorMessage = (
  error: unknown
): string => {
  if (
    error &&
    typeof error === "object"
  ) {
    const possibleError =
      error as {
        message?: string;

        response?: {
          data?: {
            message?: string;
          };
        };
      };

    return (
      possibleError.response?.data
        ?.message ||
      possibleError.message ||
      "Something went wrong."
    );
  }

  return "Something went wrong.";
};

const formatDate = (
  value: string
): string => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

const formatDateTime = (
  value: string | null
): string => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const getInitials = (
  name: string
): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (
    parts.length === 0
  ) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join("");
};

const getRoleLabel = (
  user: DashboardUser
): string => {
  if (
    user.roleDetails?.name
  ) {
    return user.roleDetails.name;
  }

  if (
    !user.role ||
    user.role === "user"
  ) {
    return "Unassigned";
  }

  return user.role
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

const getStatusClasses = (
  status: UserStatus
): string => {
  if (
    status === "active"
  ) {
    return [
      "border-emerald-200",
      "bg-emerald-50",
      "text-emerald-700",
      "dark:border-emerald-900",
      "dark:bg-emerald-950/40",
      "dark:text-emerald-300",
    ].join(" ");
  }

  if (
    status === "blocked"
  ) {
    return [
      "border-red-200",
      "bg-red-50",
      "text-red-700",
      "dark:border-red-900",
      "dark:bg-red-950/40",
      "dark:text-red-300",
    ].join(" ");
  }

  return [
    "border-amber-200",
    "bg-amber-50",
    "text-amber-700",
    "dark:border-amber-900",
    "dark:bg-amber-950/40",
    "dark:text-amber-300",
  ].join(" ");
};

const createEditForm = (
  user: DashboardUser
): EditUserFormState => {
  return {
    name: user.name,
    email: user.email,
    countryCode:
      user.countryCode,
    phone: user.phone,
  };
};

/* =========================================================
   USERS PAGE
   ========================================================= */

export default function UsersPage() {
  const [
    users,
    setUsers,
  ] = useState<
    DashboardUser[]
  >([]);

  const [
    roles,
    setRoles,
  ] = useState<
    DashboardRole[]
  >([]);

  const [
    totalUsers,
    setTotalUsers,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    UserStatus | ""
  >("");

  const [
    verificationFilter,
    setVerificationFilter,
  ] = useState<
    "" |
    "verified" |
    "unverified"
  >("");

  const [
    actionKey,
    setActionKey,
  ] = useState("");

  /* =======================================================
     VIEW USER
     ======================================================= */

  const [
    viewUser,
    setViewUser,
  ] =
    useState<
      DashboardUser | null
    >(null);

  const [
    viewLoading,
    setViewLoading,
  ] = useState(false);

  /* =======================================================
     EDIT USER
     ======================================================= */

  const [
    editUser,
    setEditUser,
  ] =
    useState<
      DashboardUser | null
    >(null);

  const [
    editForm,
    setEditForm,
  ] =
    useState<EditUserFormState>({
      name: "",
      email: "",
      countryCode: "",
      phone: "",
    });

  const [
    editSaving,
    setEditSaving,
  ] = useState(false);

  /* =======================================================
     ROLE ASSIGNMENT
     ======================================================= */

  const [
    roleUser,
    setRoleUser,
  ] =
    useState<
      DashboardUser | null
    >(null);

  const [
    selectedRoleId,
    setSelectedRoleId,
  ] = useState("");

  const [
    roleSaving,
    setRoleSaving,
  ] = useState(false);

  /* =======================================================
     COUNTS
     ======================================================= */

  const counts =
    useMemo(() => {
      return {
        active:
          users.filter(
            (user) =>
              user.status ===
              "active"
          ).length,

        assigned:
          users.filter(
            (user) =>
              user.role !== "user"
          ).length,

        unassigned:
          users.filter(
            (user) =>
              user.role === "user"
          ).length,
      };
    }, [users]);

  /* =======================================================
     LOAD USERS AND ROLES
     ======================================================= */

  const loadUsers =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            usersResult,
            activeRoles,
          ] =
            await Promise.all([
              getUsers({
                search:
                  search.trim() ||
                  undefined,

                role:
                  roleFilter ||
                  undefined,

                status:
                  statusFilter,

                isVerified:
                  verificationFilter ===
                  "verified"
                    ? true
                    : verificationFilter ===
                        "unverified"
                      ? false
                      : "",
              }),

              getActiveRoles(),
            ]);

          setUsers(
            usersResult.users
          );

          setTotalUsers(
            usersResult.count
          );

          setRoles(
            activeRoles
          );
        } catch (loadError) {
          setError(
            getErrorMessage(
              loadError
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        roleFilter,
        search,
        statusFilter,
        verificationFilter,
      ]
    );

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          void loadUsers();
        },
        300
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [loadUsers]);

  /* =======================================================
     REPLACE UPDATED USER
     ======================================================= */

  const replaceUser = (
    updatedUser: DashboardUser
  ) => {
    setUsers(
      (currentUsers) =>
        currentUsers.map(
          (user) =>
            user._id ===
            updatedUser._id
              ? updatedUser
              : user
        )
    );

    setViewUser(
      (currentViewUser) =>
        currentViewUser?._id ===
        updatedUser._id
          ? updatedUser
          : currentViewUser
    );
  };

  /* =======================================================
     VIEW USER
     ======================================================= */

  const handleViewUser =
    async (
      user: DashboardUser
    ) => {
      setViewUser(user);
      setViewLoading(true);
      setError("");

      try {
        const latestUser =
          await getUserById(
            user._id
          );

        setViewUser(
          latestUser
        );
      } catch (viewError) {
        setError(
          getErrorMessage(
            viewError
          )
        );
      } finally {
        setViewLoading(false);
      }
    };

  /* =======================================================
     EDIT USER
     ======================================================= */

  const openEditUser = (
    user: DashboardUser
  ) => {
    setEditUser(user);

    setEditForm(
      createEditForm(user)
    );

    setError("");
    setSuccess("");
  };

  const closeEditUser = () => {
    if (editSaving) {
      return;
    }

    setEditUser(null);
  };

  const handleEditSubmit =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      if (!editUser) {
        return;
      }

      if (
        !editForm.name.trim()
      ) {
        setError(
          "User name is required."
        );

        return;
      }

      if (
        !editForm.email.trim()
      ) {
        setError(
          "User email is required."
        );

        return;
      }

      const payload:
        UpdateUserPayload = {
        name:
          editForm.name
            .trim()
            .replace(
              /\s+/g,
              " "
            ),

        email:
          editForm.email
            .trim()
            .toLowerCase(),

        countryCode:
          editForm.countryCode
            .trim(),

        phone:
          editForm.phone
            .trim(),
      };

      try {
        setEditSaving(true);
        setError("");
        setSuccess("");

        const updatedUser =
          await updateUser(
            editUser._id,
            payload
          );

        replaceUser(
          updatedUser
        );

        setEditUser(null);

        setSuccess(
          "User updated successfully."
        );
      } catch (editError) {
        setError(
          getErrorMessage(
            editError
          )
        );
      } finally {
        setEditSaving(false);
      }
    };

  /* =======================================================
     ASSIGN OR CHANGE ROLE
     ======================================================= */

  const openRoleModal = (
    user: DashboardUser
  ) => {
    const currentRole =
      roles.find(
        (role) =>
          role.slug ===
          user.role
      );

    setRoleUser(user);

    setSelectedRoleId(
      currentRole?._id ||
      ""
    );

    setError("");
    setSuccess("");
  };

  const closeRoleModal = () => {
    if (roleSaving) {
      return;
    }

    setRoleUser(null);
    setSelectedRoleId("");
  };

  const handleAssignRole =
    async () => {
      if (
        !roleUser ||
        !selectedRoleId
      ) {
        setError(
          "Please select a Role."
        );

        return;
      }

      try {
        setRoleSaving(true);
        setError("");
        setSuccess("");

        const updatedUser =
          await assignUserRole(
            roleUser._id,
            {
              roleId:
                selectedRoleId,
            }
          );

        replaceUser(
          updatedUser
        );

        setRoleUser(null);
        setSelectedRoleId("");

        setSuccess(
          "Role assigned successfully."
        );
      } catch (roleError) {
        setError(
          getErrorMessage(
            roleError
          )
        );
      } finally {
        setRoleSaving(false);
      }
    };

  /* =======================================================
     REMOVE ROLE
     ======================================================= */

  const handleRemoveRole =
    async (
      user: DashboardUser
    ) => {
      const confirmed =
        window.confirm(
          `Remove the assigned Role from ${user.name}?`
        );

      if (!confirmed) {
        return;
      }

      const key =
        `remove-${user._id}`;

      try {
        setActionKey(key);
        setError("");
        setSuccess("");

        const updatedUser =
          await removeUserRole(
            user._id
          );

        replaceUser(
          updatedUser
        );

        setSuccess(
          "Role removed successfully."
        );
      } catch (removeError) {
        setError(
          getErrorMessage(
            removeError
          )
        );
      } finally {
        setActionKey("");
      }
    };

  /* =======================================================
     UPDATE STATUS
     ======================================================= */

  const handleStatusChange =
    async (
      user: DashboardUser,
      status: UserStatus
    ) => {
      if (
        status ===
        user.status
      ) {
        return;
      }

      const key =
        `status-${user._id}`;

      try {
        setActionKey(key);
        setError("");
        setSuccess("");

        const updatedUser =
          await updateUserStatus(
            user._id,
            status
          );

        replaceUser(
          updatedUser
        );

        setSuccess(
          `User status changed to ${status}.`
        );
      } catch (statusError) {
        setError(
          getErrorMessage(
            statusError
          )
        );
      } finally {
        setActionKey("");
      }
    };

  /* =======================================================
     DELETE USER
     ======================================================= */

  const handleDeleteUser =
    async (
      user: DashboardUser
    ) => {
      const confirmed =
        window.confirm(
          `Permanently delete ${user.name}? This action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      const key =
        `delete-${user._id}`;

      try {
        setActionKey(key);
        setError("");
        setSuccess("");

        await deleteUser(
          user._id
        );

        setUsers(
          (currentUsers) =>
            currentUsers.filter(
              (currentUser) =>
                currentUser._id !==
                user._id
            )
        );

        setTotalUsers(
          (currentTotal) =>
            Math.max(
              currentTotal - 1,
              0
            )
        );

        if (
          viewUser?._id ===
          user._id
        ) {
          setViewUser(null);
        }

        setSuccess(
          "User deleted successfully."
        );
      } catch (deleteError) {
        setError(
          getErrorMessage(
            deleteError
          )
        );
      } finally {
        setActionKey("");
      }
    };

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-hidden">
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Administration
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
              Users
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View, edit and manage
              registered user access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CompactCount
              label="Total"
              value={totalUsers}
            />

            <CompactCount
              label="Active"
              value={counts.active}
            />

            <CompactCount
              label="Assigned"
              value={counts.assigned}
            />

            <CompactCount
              label="Unassigned"
              value={counts.unassigned}
            />

            <button
              type="button"
              onClick={() =>
                void loadUsers()
              }
              disabled={
                loading ||
                Boolean(actionKey)
              }
              className="h-10 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          ALERTS
          =================================================== */}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {success}
        </div>
      ) : null}

      {/* ===================================================
          FILTERS
          =================================================== */}

      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(170px,0.8fr)_minmax(160px,0.7fr)_minmax(170px,0.7fr)]">
          <label className="min-w-0 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Search
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Name, email or phone..."
              className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </label>

          <label className="min-w-0 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Role
            </span>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">
                All Roles
              </option>

              <option value="user">
                Unassigned
              </option>

              {roles.map(
                (role) => (
                  <option
                    key={role._id}
                    value={role.slug}
                  >
                    {role.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="min-w-0 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Status
            </span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | UserStatus
                    | ""
                )
              }
              className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">
                All Statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="blocked">
                Blocked
              </option>
            </select>
          </label>

          <label className="min-w-0 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Verification
            </span>

            <select
              value={
                verificationFilter
              }
              onChange={(event) =>
                setVerificationFilter(
                  event.target
                    .value as
                    | ""
                    | "verified"
                    | "unverified"
                )
              }
              className="h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="">
                All Users
              </option>

              <option value="verified">
                Verified
              </option>

              <option value="unverified">
                Unverified
              </option>
            </select>
          </label>
        </div>
      </section>

      {/* ===================================================
          USERS RECORDS
          =================================================== */}

      <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="font-bold text-gray-950 dark:text-white">
              Registered Users
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {users.length} record
              {users.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-2 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active
            </span>

            <span className="flex items-center gap-2 text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Inactive
            </span>

            <span className="flex items-center gap-2 text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Blocked
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No users found.
          </div>
        ) : (
          <>
            {/* =============================================
                DESKTOP TABLE
                ============================================= */}

            <div className="hidden min-w-0 max-w-full xl:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[14%]" />
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[11%]" />
                  <col className="w-[26%]" />
                </colgroup>

                <thead className="bg-gray-50 dark:bg-gray-950/60">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-4 py-4">
                      Role
                    </th>

                    <th className="px-4 py-4">
                      Verified
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>

                    <th className="px-4 py-4">
                      Registered
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {users.map(
                    (user) => {
                      const busy =
                        actionKey.includes(
                          user._id
                        );

                      return (
                        <tr
                          key={user._id}
                          className="align-middle transition hover:bg-gray-50/70 dark:hover:bg-gray-800/30"
                        >
                          <td className="min-w-0 px-5 py-4">
                            <UserIdentity
                              user={user}
                            />
                          </td>

                          <td className="min-w-0 px-4 py-4">
                            <RoleBadge
                              user={user}
                            />
                          </td>

                          <td className="px-4 py-4">
                            <VerificationBadge
                              verified={
                                user.isVerified
                              }
                            />
                          </td>

                          <td className="px-4 py-4">
                            <select
                              value={
                                user.status
                              }
                              disabled={busy}
                              onChange={(
                                event
                              ) =>
                                void handleStatusChange(
                                  user,
                                  event.target
                                    .value as UserStatus
                                )
                              }
                              className={`h-9 w-full max-w-[135px] rounded-lg border px-3 text-xs font-semibold outline-none ${getStatusClasses(
                                user.status
                              )}`}
                            >
                              <option value="active">
                                Active
                              </option>

                              <option value="inactive">
                                Inactive
                              </option>

                              <option value="blocked">
                                Blocked
                              </option>
                            </select>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(
                              user.createdAt
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <UserActions
                              user={user}
                              busy={busy}
                              onView={() =>
                                void handleViewUser(
                                  user
                                )
                              }
                              onEdit={() =>
                                openEditUser(
                                  user
                                )
                              }
                              onRole={() =>
                                openRoleModal(
                                  user
                                )
                              }
                              onRemoveRole={() =>
                                void handleRemoveRole(
                                  user
                                )
                              }
                              onDelete={() =>
                                void handleDeleteUser(
                                  user
                                )
                              }
                            />
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* =============================================
                MOBILE / TABLET CARDS
                ============================================= */}

            <div className="grid gap-4 p-4 xl:hidden">
              {users.map(
                (user) => {
                  const busy =
                    actionKey.includes(
                      user._id
                    );

                  return (
                    <article
                      key={user._id}
                      className="min-w-0 rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <UserIdentity
                        user={user}
                      />

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <MobileDetail
                          label="Role"
                        >
                          <RoleBadge
                            user={user}
                          />
                        </MobileDetail>

                        <MobileDetail
                          label="Verification"
                        >
                          <VerificationBadge
                            verified={
                              user.isVerified
                            }
                          />
                        </MobileDetail>

                        <MobileDetail
                          label="Registered"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(
                              user.createdAt
                            )}
                          </span>
                        </MobileDetail>

                        <MobileDetail
                          label="Status"
                        >
                          <select
                            value={
                              user.status
                            }
                            disabled={busy}
                            onChange={(
                              event
                            ) =>
                              void handleStatusChange(
                                user,
                                event.target
                                  .value as UserStatus
                              )
                            }
                            className={`h-9 w-full rounded-lg border px-3 text-xs font-semibold outline-none ${getStatusClasses(
                              user.status
                            )}`}
                          >
                            <option value="active">
                              Active
                            </option>

                            <option value="inactive">
                              Inactive
                            </option>

                            <option value="blocked">
                              Blocked
                            </option>
                          </select>
                        </MobileDetail>
                      </div>

                      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                        <UserActions
                          user={user}
                          busy={busy}
                          onView={() =>
                            void handleViewUser(
                              user
                            )
                          }
                          onEdit={() =>
                            openEditUser(
                              user
                            )
                          }
                          onRole={() =>
                            openRoleModal(
                              user
                            )
                          }
                          onRemoveRole={() =>
                            void handleRemoveRole(
                              user
                            )
                          }
                          onDelete={() =>
                            void handleDeleteUser(
                              user
                            )
                          }
                        />
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* ===================================================
          VIEW USER MODAL
          =================================================== */}

      {viewUser ? (
        <ModalOverlay>
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <ModalHeader
              eyebrow="User Details"
              title={
                viewUser.name ||
                "User"
              }
              onClose={() =>
                setViewUser(null)
              }
              disabled={viewLoading}
            />

            <div className="p-6">
              {viewLoading ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading user details...
                </div>
              ) : (
                <>
                  <div className="flex min-w-0 items-center gap-4">
                    <UserAvatar
                      user={viewUser}
                      size="large"
                      rounded="rounded-2xl"
                    />

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-gray-950 dark:text-white">
                        {viewUser.name}
                      </h3>

                      <p className="truncate text-sm text-gray-500">
                        {viewUser.email}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <RoleBadge
                          user={viewUser}
                        />

                        <VerificationBadge
                          verified={
                            viewUser.isVerified
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <InformationItem
                      label="Role"
                      value={getRoleLabel(
                        viewUser
                      )}
                    />

                    <InformationItem
                      label="Status"
                      value={
                        viewUser.status
                      }
                    />

                    <InformationItem
                      label="Email Verification"
                      value={
                        viewUser.isVerified
                          ? "Verified"
                          : "Unverified"
                      }
                    />

                    <InformationItem
                      label="Provider"
                      value={
                        viewUser.provider ||
                        "local"
                      }
                    />

                    <InformationItem
                      label="Phone"
                      value={
                        [
                          viewUser.countryCode,
                          viewUser.phone,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        "—"
                      }
                    />

                    <InformationItem
                      label="Registered"
                      value={formatDateTime(
                        viewUser.createdAt
                      )}
                    />

                    <InformationItem
                      label="Role Assigned"
                      value={formatDateTime(
                        viewUser.roleAssignedAt
                      )}
                    />

                    <InformationItem
                      label="Permissions"
                      value={
                        viewUser.permissions.includes(
                          "*"
                        )
                          ? "Full Access"
                          : `${viewUser.permissions.length} permissions`
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-200 p-5 dark:border-gray-800">
              <button
                type="button"
                onClick={() =>
                  setViewUser(null)
                }
                className="h-10 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
              >
                Close
              </button>
            </div>
          </div>
        </ModalOverlay>
      ) : null}

      {/* ===================================================
          EDIT USER MODAL
          =================================================== */}

      {editUser ? (
        <ModalOverlay>
          <form
            onSubmit={
              handleEditSubmit
            }
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <ModalHeader
              eyebrow="User Management"
              title="Edit User"
              onClose={
                closeEditUser
              }
              disabled={
                editSaving
              }
            />

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <FormField
                label="Full Name"
              >
                <input
                  value={
                    editForm.name
                  }
                  onChange={(event) =>
                    setEditForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        name:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </FormField>

              <FormField
                label="Email"
              >
                <input
                  type="email"
                  value={
                    editForm.email
                  }
                  onChange={(event) =>
                    setEditForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,
                        email:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </FormField>

              <FormField
                label="Country Code"
              >
                <input
                  value={
                    editForm.countryCode
                  }
                  onChange={(event) =>
                    setEditForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,

                        countryCode:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="+92"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </FormField>

              <FormField
                label="Phone"
              >
                <input
                  value={
                    editForm.phone
                  }
                  onChange={(event) =>
                    setEditForm(
                      (
                        currentForm
                      ) => ({
                        ...currentForm,

                        phone:
                          event.target
                            .value,
                      })
                    )
                  }
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </FormField>

              <div className="sm:col-span-2">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                  Profile picture is managed through the user's Profile page and dedicated image-upload endpoint.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-800">
              <button
                type="button"
                onClick={
                  closeEditUser
                }
                disabled={
                  editSaving
                }
                className="h-10 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  editSaving
                }
                className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {editSaving
                  ? "Saving..."
                  : "Update User"}
              </button>
            </div>
          </form>
        </ModalOverlay>
      ) : null}

      {/* ===================================================
          ROLE MODAL
          =================================================== */}

      {roleUser ? (
        <ModalOverlay>
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <ModalHeader
              eyebrow="Access Management"
              title={
                roleUser.role ===
                "user"
                  ? "Assign Role"
                  : "Change Role"
              }
              onClose={
                closeRoleModal
              }
              disabled={
                roleSaving
              }
            />

            <div className="p-6">
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                <UserAvatar
                  user={roleUser}
                  size="medium"
                />

                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-950 dark:text-white">
                    {roleUser.name}
                  </p>

                  <p className="mt-1 truncate text-sm text-gray-500">
                    {roleUser.email}
                  </p>

                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Current Role
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {getRoleLabel(
                      roleUser
                    )}
                  </p>
                </div>
              </div>

              <FormField
                label="Select Role"
              >
                <select
                  value={
                    selectedRoleId
                  }
                  onChange={(event) =>
                    setSelectedRoleId(
                      event.target.value
                    )
                  }
                  className="mt-3 h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">
                    Select a Role
                  </option>

                  {roles.map(
                    (role) => (
                      <option
                        key={role._id}
                        value={role._id}
                      >
                        {role.name}
                        {role.isSystemRole
                          ? " — System"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </FormField>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 p-5 dark:border-gray-800">
              <button
                type="button"
                onClick={
                  closeRoleModal
                }
                disabled={
                  roleSaving
                }
                className="h-10 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleAssignRole()
                }
                disabled={
                  roleSaving ||
                  !selectedRoleId
                }
                className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {roleSaving
                  ? "Saving..."
                  : roleUser.role ===
                      "user"
                    ? "Assign Role"
                    : "Change Role"}
              </button>
            </div>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  );
}

/* =========================================================
   USER AVATAR
   ========================================================= */

function UserAvatar({
  user,
  size = "medium",
  rounded = "rounded-xl",
}: {
  user: DashboardUser;

  size?:
    | "medium"
    | "large";

  rounded?: string;
}) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false);

  const avatarUrl =
    useMemo(
      () =>
        getUserAvatarUrl(
          user.avatar
        ),
      [user.avatar]
    );

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const sizeClasses =
    size === "large"
      ? "h-16 w-16 text-lg"
      : "h-11 w-11 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ${sizeClasses} ${rounded}`}
    >
      {avatarUrl &&
      !imageFailed ? (
        <img
          src={avatarUrl}
          alt={user.name}
          onError={() =>
            setImageFailed(true)
          }
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(
          user.name
        )
      )}
    </div>
  );
}

/* =========================================================
   USER IDENTITY
   ========================================================= */

function UserIdentity({
  user,
}: {
  user: DashboardUser;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar
        user={user}
      />

      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-950 dark:text-white">
          {user.name ||
            "Unnamed User"}
        </p>

        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
          {user.email}
        </p>

        {user.phone ? (
          <p className="truncate text-xs text-gray-400">
            {[
              user.countryCode,
              user.phone,
            ]
              .filter(Boolean)
              .join(" ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* =========================================================
   ROLE BADGE
   ========================================================= */

function RoleBadge({
  user,
}: {
  user: DashboardUser;
}) {
  const unassigned =
    user.role === "user";

  return (
    <div className="min-w-0">
      <span
        className={`inline-flex max-w-full rounded-full border px-3 py-1 text-xs font-semibold ${
          unassigned
            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        }`}
      >
        <span className="truncate">
          {getRoleLabel(
            user
          )}
        </span>
      </span>

      {unassigned ? (
        <p className="mt-1 truncate text-xs text-amber-600 dark:text-amber-400">
          Login pending
        </p>
      ) : null}
    </div>
  );
}

/* =========================================================
   VERIFICATION BADGE
   ========================================================= */

function VerificationBadge({
  verified,
}: {
  verified: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        verified
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
      }`}
    >
      {verified
        ? "Verified"
        : "Pending"}
    </span>
  );
}

/* =========================================================
   USER ACTIONS
   ========================================================= */

type UserActionsProps = {
  user: DashboardUser;
  busy: boolean;

  onView: () => void;
  onEdit: () => void;
  onRole: () => void;
  onRemoveRole: () => void;
  onDelete: () => void;
};

function UserActions({
  user,
  busy,
  onView,
  onEdit,
  onRole,
  onRemoveRole,
  onDelete,
}: UserActionsProps) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
      <ActionButton
        label="View"
        onClick={onView}
        disabled={busy}
        variant="neutral"
      />

      <ActionButton
        label="Edit"
        onClick={onEdit}
        disabled={busy}
        variant="neutral"
      />

      <ActionButton
        label={
          user.role === "user"
            ? "Assign Role"
            : "Change Role"
        }
        onClick={onRole}
        disabled={busy}
        variant="primary"
      />

      {user.role !== "user" ? (
        <ActionButton
          label="Remove Role"
          onClick={
            onRemoveRole
          }
          disabled={busy}
          variant="warning"
        />
      ) : null}

      <ActionButton
        label="Delete"
        onClick={onDelete}
        disabled={busy}
        variant="danger"
      />
    </div>
  );
}

/* =========================================================
   ACTION BUTTON
   ========================================================= */

function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;

  variant:
    | "neutral"
    | "primary"
    | "warning"
    | "danger";
}) {
  const classes = {
    neutral:
      "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",

    primary:
      "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40",

    warning:
      "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40",

    danger:
      "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-0 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes[variant]}`}
    >
      {label}
    </button>
  );
}

/* =========================================================
   COMPACT COUNT
   ========================================================= */

function CompactCount({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950">
      <span className="text-xs text-gray-500">
        {label}
      </span>

      <span className="ml-2 text-sm font-bold text-gray-950 dark:text-white">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   MOBILE DETAIL
   ========================================================= */

function MobileDetail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 p-3 dark:bg-gray-950">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      {children}
    </div>
  );
}

/* =========================================================
   MODAL
   ========================================================= */

function ModalOverlay({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      {children}
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  onClose,
  disabled,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-800">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
          {eyebrow}
        </p>

        <h2 className="mt-2 truncate text-xl font-bold text-gray-950 dark:text-white">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
      >
        Close
      </button>
    </div>
  );
}

/* =========================================================
   FORM FIELD
   ========================================================= */

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>

      {children}
    </label>
  );
}

/* =========================================================
   INFORMATION ITEM
   ========================================================= */

function InformationItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold capitalize text-gray-800 dark:text-gray-200">
        {value}
      </p>
    </div>
  );
}