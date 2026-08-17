import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ROLE_PERMISSION_GROUPS,
  buildRoleDashboardSummary,
  createRole,
  deleteRole,
  getRoles,
  updateRole,
  updateRoleStatus,
  type DashboardRole,
  type RoleStatus,
} from "../../services/role/role.service";

/* =========================================================
   TYPES
   ========================================================= */

type SettingsSection =
  | "roles"
  | "permissions"
  | "reports";

type RoleFormState = {
  name: string;
  slug: string;
  description: string;
  status: RoleStatus;
  permissions: string[];
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_ROLE_FORM: RoleFormState = {
  name: "",
  slug: "",
  description: "",
  status: "active",
  permissions: [],
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

const createSlug = (
  value: string
): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
};

const formatPermissionName = (
  permission: string
): string => {
  return permission
    .replace(
      /[._]/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const normalizeVisibleModuleText = (
  value: string
): string => {
  return value
    .replace(
      /\bRisk Register\b/gi,
      "Task Register"
    )
    .replace(
      /\bRisks\b/gi,
      "Tasks"
    )
    .replace(
      /\bRisk\b/gi,
      "Task"
    );
};

/* =========================================================
   SETTINGS PAGE
   ========================================================= */

export default function SettingsPage() {
  const [
    activeSection,
    setActiveSection,
  ] =
    useState<SettingsSection>(
      "roles"
    );

  const [
    roles,
    setRoles,
  ] =
    useState<DashboardRole[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      RoleStatus | ""
    >("");

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    editingRole,
    setEditingRole,
  ] =
    useState<
      DashboardRole | null
    >(null);

  const [
    form,
    setForm,
  ] =
    useState<RoleFormState>(
      EMPTY_ROLE_FORM
    );

  const [
    slugManuallyChanged,
    setSlugManuallyChanged,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    actionKey,
    setActionKey,
  ] =
    useState("");

  /* =======================================================
     SUMMARY
     ======================================================= */

  const summary =
    useMemo(
      () =>
        buildRoleDashboardSummary(
          roles
        ),
      [
        roles,
      ]
    );

  /* =======================================================
     LOAD ROLES
     ======================================================= */

  const loadRoles =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const result =
            await getRoles({
              search:
                search.trim() ||
                undefined,

              status:
                statusFilter,

              page: 1,

              limit: 100,

              sortBy:
                "name",

              sortOrder:
                "asc",
            });

          setRoles(
            result.roles
          );
        } catch (
          loadError
        ) {
          setError(
            getErrorMessage(
              loadError
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        search,
        statusFilter,
      ]
    );

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          void loadRoles();
        },
        250
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    loadRoles,
  ]);

  /* =======================================================
     MODAL
     ======================================================= */

  const openCreateModal =
    () => {
      setEditingRole(
        null
      );

      setForm(
        EMPTY_ROLE_FORM
      );

      setSlugManuallyChanged(
        false
      );

      setError("");

      setSuccess("");

      setModalOpen(
        true
      );
    };

  const openEditModal = (
    role: DashboardRole
  ) => {
    if (
      role.isSystemRole
    ) {
      return;
    }

    setEditingRole(
      role
    );

    setForm({
      name:
        role.name,

      slug:
        role.slug,

      description:
        role.description,

      status:
        role.status,

      permissions: [
        ...role.permissions,
      ],
    });

    setSlugManuallyChanged(
      true
    );

    setError("");

    setSuccess("");

    setModalOpen(
      true
    );
  };

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setModalOpen(
        false
      );

      setEditingRole(
        null
      );

      setForm(
        EMPTY_ROLE_FORM
      );
    };

  /* =======================================================
     FORM FIELDS
     ======================================================= */

  const handleNameChange = (
    name: string
  ) => {
    setForm(
      (
        currentForm
      ) => ({
        ...currentForm,

        name,

        slug:
          slugManuallyChanged
            ? currentForm.slug
            : createSlug(
                name
              ),
      })
    );
  };

  const handleSlugChange = (
    slug: string
  ) => {
    setSlugManuallyChanged(
      true
    );

    setForm(
      (
        currentForm
      ) => ({
        ...currentForm,

        slug:
          createSlug(
            slug
          ),
      })
    );
  };

  const togglePermission = (
    permissionKey: string
  ) => {
    setForm(
      (
        currentForm
      ) => {
        const exists =
          currentForm.permissions.includes(
            permissionKey
          );

        return {
          ...currentForm,

          permissions:
            exists
              ? currentForm.permissions.filter(
                  (
                    permission
                  ) =>
                    permission !==
                    permissionKey
                )
              : [
                  ...currentForm.permissions,
                  permissionKey,
                ],
        };
      }
    );
  };

  const selectAllPermissions =
    () => {
      const permissions =
        ROLE_PERMISSION_GROUPS.flatMap(
          (
            group
          ) =>
            group.permissions.map(
              (
                permission
              ) =>
                permission.key
            )
        );

      setForm(
        (
          currentForm
        ) => ({
          ...currentForm,

          permissions,
        })
      );
    };

  const clearPermissions =
    () => {
      setForm(
        (
          currentForm
        ) => ({
          ...currentForm,

          permissions:
            [],
        })
      );
    };

  /* =======================================================
     SAVE ROLE
     ======================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const roleName =
        form.name.trim();

      const roleSlug =
        createSlug(
          form.slug
        );

      if (!roleName) {
        setError(
          "Role name is required."
        );

        return;
      }

      if (!roleSlug) {
        setError(
          "Role slug is required."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError("");

        setSuccess("");

        if (
          editingRole
        ) {
          const updatedRole =
            await updateRole(
              editingRole._id,
              {
                name:
                  roleName,

                slug:
                  roleSlug,

                description:
                  form.description.trim(),

                status:
                  form.status,

                permissions:
                  form.permissions,
              }
            );

          setRoles(
            (
              currentRoles
            ) =>
              currentRoles.map(
                (
                  role
                ) =>
                  role._id ===
                  updatedRole._id
                    ? updatedRole
                    : role
              )
          );

          setSuccess(
            "Role updated successfully."
          );
        } else {
          const createdRole =
            await createRole({
              name:
                roleName,

              slug:
                roleSlug,

              description:
                form.description.trim(),

              status:
                form.status,

              permissions:
                form.permissions,
            });

          setRoles(
            (
              currentRoles
            ) =>
              [
                ...currentRoles,
                createdRole,
              ].sort(
                (
                  a,
                  b
                ) =>
                  a.name.localeCompare(
                    b.name
                  )
              )
          );

          setSuccess(
            "Role created successfully."
          );
        }

        setModalOpen(
          false
        );

        setEditingRole(
          null
        );

        setForm(
          EMPTY_ROLE_FORM
        );
      } catch (
        saveError
      ) {
        setError(
          getErrorMessage(
            saveError
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     STATUS UPDATE
     ======================================================= */

  const handleStatusChange =
    async (
      role:
        DashboardRole,
      status:
        RoleStatus
    ) => {
      if (
        role.isSystemRole ||
        role.status ===
          status
      ) {
        return;
      }

      const key =
        `status-${role._id}`;

      try {
        setActionKey(
          key
        );

        setError("");

        setSuccess("");

        const updatedRole =
          await updateRoleStatus(
            role._id,
            status
          );

        setRoles(
          (
            currentRoles
          ) =>
            currentRoles.map(
              (
                currentRole
              ) =>
                currentRole._id ===
                updatedRole._id
                  ? updatedRole
                  : currentRole
            )
        );

        setSuccess(
          `Role status changed to ${status}.`
        );
      } catch (
        statusError
      ) {
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
     DELETE ROLE
     ======================================================= */

  const handleDeleteRole =
    async (
      role:
        DashboardRole
    ) => {
      if (
        role.isSystemRole
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete the "${role.name}" role?`
        );

      if (!confirmed) {
        return;
      }

      const key =
        `delete-${role._id}`;

      try {
        setActionKey(
          key
        );

        setError("");

        setSuccess("");

        await deleteRole(
          role._id
        );

        setRoles(
          (
            currentRoles
          ) =>
            currentRoles.filter(
              (
                currentRole
              ) =>
                currentRole._id !==
                role._id
            )
        );

        setSuccess(
          "Role deleted successfully."
        );
      } catch (
        deleteError
      ) {
        setError(
          getErrorMessage(
            deleteError
          )
        );
      } finally {
        setActionKey("");
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

        <div className="p-5 pt-6 lg:p-6 lg:pt-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Manage dashboard access for Projects, Task Register, Evidence,
            Action Plans, Documents & Reports and other Project Tracker modules.
          </p>
        </div>
      </section>

      {/* =================================================
          ALERTS
          ================================================= */}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
          {success}
        </div>
      ) : null}

      {/* =================================================
          SETTINGS LAYOUT
          ================================================= */}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* ===============================================
            INTERNAL SETTINGS MENU
            =============================================== */}

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Project Settings
          </p>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "roles"
                )
              }
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeSection ===
                "roles"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Roles & Permissions
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "permissions"
                )
              }
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeSection ===
                "permissions"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Permission Reference
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "reports"
                )
              }
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeSection ===
                "reports"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Documents & Reports
            </button>
          </nav>
        </aside>

        {/* ===============================================
            CONTENT
            =============================================== */}

        <main className="min-w-0">
          {activeSection ===
          "roles" ? (
            <div className="space-y-6">
              {/* =========================================
                  SUMMARY
                  ========================================= */}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  label="Total Roles"
                  value={
                    summary.totalRoles
                  }
                />

                <SummaryCard
                  label="Active Roles"
                  value={
                    summary.activeRoles
                  }
                />

                <SummaryCard
                  label="Custom Roles"
                  value={
                    summary.customRoles
                  }
                />

                <SummaryCard
                  label="Assigned Users"
                  value={
                    summary.assignedUsers
                  }
                />
              </section>

              {/* =========================================
                  ROLE MANAGEMENT
                  ========================================= */}

              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Roles
                      </h2>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Create custom roles and assign module permissions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        openCreateModal
                      }
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Create Role
                    </button>
                  </div>

                  {/* FILTERS */}

                  <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <input
                      value={
                        search
                      }
                      onChange={(
                        event
                      ) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search roles"
                      className="h-11 min-w-0 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                    />

                    <select
                      value={
                        statusFilter
                      }
                      onChange={(
                        event
                      ) =>
                        setStatusFilter(
                          event.target
                            .value as
                            | RoleStatus
                            | ""
                        )
                      }
                      className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
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
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        void loadRoles()
                      }
                      disabled={
                        loading
                      }
                      className="h-11 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* =========================================
                    ROLE LIST
                    ========================================= */}

                {loading ? (
                  <div className="p-10 text-center text-sm text-gray-500">
                    Loading roles...
                  </div>
                ) : roles.length ===
                  0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">
                    No roles found.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {roles.map(
                      (
                        role
                      ) => {
                        const busy =
                          actionKey.includes(
                            role._id
                          );

                        const hasFullAccess =
                          role.permissions.includes(
                            "*"
                          );

                        return (
                          <article
                            key={
                              role._id
                            }
                            className="p-5"
                          >
                            <div className="flex flex-col gap-4">
                              {/* ROLE HEADER */}

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                                      {
                                        role.name
                                      }
                                    </h3>

                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                      {role.isSystemRole
                                        ? "System"
                                        : "Custom"}
                                    </span>
                                  </div>

                                  <p className="mt-1 break-all text-xs text-gray-500">
                                    {
                                      role.slug
                                    }
                                  </p>

                                  {role.description ? (
                                    <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-400">
                                      {
                                        role.description
                                      }
                                    </p>
                                  ) : null}
                                </div>

                                {/* ACTIONS */}

                                <div className="flex flex-wrap gap-2">
                                  {role.isSystemRole ? (
                                    <span className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-800">
                                      Protected
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        disabled={
                                          busy
                                        }
                                        onClick={() =>
                                          openEditModal(
                                            role
                                          )
                                        }
                                        className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-300"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          busy
                                        }
                                        onClick={() =>
                                          void handleDeleteRole(
                                            role
                                          )
                                        }
                                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* ROLE DETAILS */}

                              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <RoleDetail
                                  label="Permissions"
                                  value={
                                    hasFullAccess
                                      ? "Full Access"
                                      : `${role.permissions.length} selected`
                                  }
                                />

                                <RoleDetail
                                  label="Assigned Users"
                                  value={String(
                                    role.assignedUsersCount
                                  )}
                                />

                                <RoleDetail
                                  label="Created"
                                  value={formatDate(
                                    role.createdAt
                                  )}
                                />

                                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950/30">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                    Status
                                  </p>

                                  {role.isSystemRole ? (
                                    <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                      Active
                                    </span>
                                  ) : (
                                    <select
                                      value={
                                        role.status
                                      }
                                      disabled={
                                        busy
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        void handleStatusChange(
                                          role,
                                          event.target
                                            .value as RoleStatus
                                        )
                                      }
                                      className="mt-1 h-8 max-w-full rounded-lg border border-gray-300 bg-white px-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                                    >
                                      <option value="active">
                                        Active
                                      </option>

                                      <option value="inactive">
                                        Inactive
                                      </option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            </div>
          ) : activeSection ===
            "permissions" ? (
            <PermissionReference />
          ) : (
            <ReportConfiguration />
          )}
        </main>
      </div>

      {/* ===================================================
          CREATE / EDIT ROLE MODAL
          =================================================== */}

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={
              handleSubmit
            }
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            {/* HEADER */}

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Access Settings
                </p>

                <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                  {editingRole
                    ? "Edit Role"
                    : "Create Role"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            {/* ROLE FIELDS */}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Name
                </span>

                <input
                  value={
                    form.name
                  }
                  onChange={(
                    event
                  ) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  placeholder="Electrical Engineer"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Slug
                </span>

                <input
                  value={
                    form.slug
                  }
                  onChange={(
                    event
                  ) =>
                    handleSlugChange(
                      event.target.value
                    )
                  }
                  placeholder="electrical_engineer"
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                />
              </label>
            </div>

            {/* DESCRIPTION */}

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </span>

              <textarea
                value={
                  form.description
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      currentForm
                    ) => ({
                      ...currentForm,

                      description:
                        event.target.value,
                    })
                  )
                }
                rows={3}
                placeholder="Describe this role"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </label>

            {/* STATUS */}

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </span>

              <select
                value={
                  form.status
                }
                onChange={(
                  event
                ) =>
                  setForm(
                    (
                      currentForm
                    ) => ({
                      ...currentForm,

                      status:
                        event.target
                          .value as RoleStatus,
                    })
                  )
                }
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </label>

            {/* PERMISSIONS */}

            <div className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Permissions
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Select dashboard access for this role.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={
                      selectAllPermissions
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearPermissions
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {ROLE_PERMISSION_GROUPS.map(
                  (
                    group
                  ) => (
                    <section
                      key={
                        group.key
                      }
                      className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {
                          normalizeVisibleModuleText(
                            normalizeVisibleModuleText(
                    group.label
                  )
                          )
                        }
                      </h4>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {group.permissions.map(
                          (
                            permission
                          ) => (
                            <label
                              key={
                                permission.key
                              }
                              className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 p-3 transition hover:border-emerald-300 dark:border-gray-800"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  form.permissions.includes(
                                    permission.key
                                  )
                                }
                                onChange={() =>
                                  togglePermission(
                                    permission.key
                                  )
                                }
                                className="mt-1 h-4 w-4 accent-emerald-600"
                              />

                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  {
                                    normalizeVisibleModuleText(
                                      permission.label
                                    )
                                  }
                                </span>

                                <span className="mt-1 block text-xs leading-5 text-gray-500">
                                  {
                                    normalizeVisibleModuleText(
                                      normalizeVisibleModuleText(
                            permission.description
                          )
                                    )
                                  }
                                </span>
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </section>
                  )
                )}
              </div>
            </div>

            {/* ACTIONS */}

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="h-11 rounded-xl border border-gray-300 px-5 text-sm font-semibold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingRole
                    ? "Update Role"
                    : "Create Role"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </article>
  );
}

/* =========================================================
   ROLE DETAIL
   ========================================================= */

function RoleDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950/30">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-semibold text-gray-700 dark:text-gray-300">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PERMISSION REFERENCE
   ========================================================= */

function PermissionReference() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        Permission Reference
      </h2>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        These permissions are assigned to custom roles.
      </p>

      <div className="mt-6 space-y-5">
        {ROLE_PERMISSION_GROUPS.map(
          (
            group
          ) => (
            <div
              key={
                group.key
              }
              className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
            >
              <h3 className="font-bold text-gray-900 dark:text-white">
                {
                  normalizeVisibleModuleText(
                    group.label
                  )
                }
              </h3>

              <div className="mt-4 divide-y divide-gray-200 dark:divide-gray-800">
                {group.permissions.map(
                  (
                    permission
                  ) => (
                    <div
                      key={
                        permission.key
                      }
                      className="grid gap-2 py-3 md:grid-cols-[210px_minmax(0,1fr)]"
                    >
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          {
                            permission.key
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {normalizeVisibleModuleText(
                            formatPermissionName(
                              permission.key
                            )
                          )}
                        </p>
                      </div>

                      <p className="min-w-0 break-words text-sm leading-6 text-gray-500 dark:text-gray-400">
                        {
                          normalizeVisibleModuleText(
                            permission.description
                          )
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   DOCUMENTS & REPORTS
   ========================================================= */

function ReportConfiguration() {
  const formatCards = [
    {
      name: "PDF",
      extension: ".pdf",
      description:
        "Client-facing report with project details, Task Register, summary and embedded Before/After Evidence images.",
    },
    {
      name: "Word",
      extension: ".docx",
      description:
        "Editable client report with project information, Task details, Evidence images and professional page formatting.",
    },
    {
      name: "Excel",
      extension: ".xlsx",
      description:
        "Structured Task Register workbook with summary sheets, Evidence Register and embedded image previews.",
    },
  ];

  const reportFeatures = [
    "Project details and Project Reference",
    "Task Register records",
    "In Progress and Complete status",
    "Before Evidence",
    "After Evidence",
    "Embedded Evidence images",
    "Report summary and completion percentage",
    "Ascending Task Sr. No. ordering",
    "Custom report title support",
    "Clean client-facing download filename",
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

        <p className="pt-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
          Documents & Reports
        </p>

        <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
          Report Configuration
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Current Project Tracker report capabilities. Report generation itself
          is managed from the Documents module so this page does not maintain a
          second, conflicting set of report-generation values.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {formatCards.map(
          (
            item
          ) => (
            <article
              key={
                item.name
              }
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {item.name}
                </h3>

                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {item.extension}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </article>
          )
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Current Report Content
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Supported in the current PDF, Word and Excel report flow.
            </p>
          </div>

          <a
            href="/documents"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Open Documents
          </a>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {reportFeatures.map(
            (
              feature
            ) => (
              <div
                key={
                  feature
                }
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30"
              >
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  ✓
                </span>

                <p className="text-sm font-medium leading-5 text-gray-700 dark:text-gray-300">
                  {feature}
                </p>
              </div>
            )
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Download Filename Rule
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Client downloads use the cleanest available report name in this
          priority order.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SettingInfoCard
            number="1"
            title="Custom Report Title"
            description="Used first when a title is entered while generating the report."
          />

          <SettingInfoCard
            number="2"
            title="Project Name"
            description="Used automatically when no custom report title is supplied."
          />

          <SettingInfoCard
            number="3"
            title="Project Reference"
            description="Used as the final project-specific fallback."
          />
        </div>

        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Example
          </p>

          <p className="mt-2 break-all text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            electrical-energy-loss-risk-assessment.pdf
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Module Status
        </h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ModuleStatus
            name="Projects"
            status="Active"
          />

          <ModuleStatus
            name="Task Register"
            status="Active"
          />

          <ModuleStatus
            name="Evidence"
            status="Active"
          />

          <ModuleStatus
            name="Action Plans"
            status="Active"
          />

          <ModuleStatus
            name="Documents & Reports"
            status="Active"
          />

          <ModuleStatus
            name="Testing & Controls"
            status="Planned"
          />
        </div>
      </section>
    </div>
  );
}

function SettingInfoCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
          {number}
        </span>

        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            {title}
          </h4>

          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function ModuleStatus({
  name,
  status,
}: {
  name: string;
  status:
    | "Active"
    | "Planned";
}) {
  const active =
    status === "Active";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/30">
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {name}
      </span>

      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
          active
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        }`}
      >
        {status}
      </span>
    </div>
  );
}