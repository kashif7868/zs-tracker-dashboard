import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import PageMeta from "../../components/common/PageMeta";

import {
  deleteActionPlan,
  getActionPlanById,
  getActionPlanPriorityLabel,
  getActionPlanStatusLabel,
  updateActionPlan,
  updateActionPlanStatus,
  type ActionPlan,
  type ActionPlanPriority,
  type ActionPlanStatus,
} from "../../services/action_plan/actionPlan.service";

/* =========================================================
   TYPES
   ========================================================= */

type EditFormState = {
  title: string;
  description: string;
  priority: ActionPlanPriority;
  targetDate: string;
};

/* =========================================================
   HELPERS
   ========================================================= */

const getErrorMessage = (
  error: unknown
): string => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const requestError =
      error as {
        response?: {
          data?: {
            message?: string;

            errors?: Array<{
              message?: string;
              msg?: string;
            }>;
          };
        };
      };

    return (
      requestError.response
        ?.data?.errors?.[0]
        ?.message ||
      requestError.response
        ?.data?.errors?.[0]
        ?.msg ||
      requestError.response
        ?.data?.message ||
      "Request could not be completed."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Request could not be completed.";
};

const getActionPlanIdFromPath =
  (): string => {
    const parts =
      window.location.pathname
        .split("/")
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(Boolean);

    const actionPlansIndex =
      parts.findIndex(
        (
          item
        ) =>
          item.toLowerCase() ===
          "action-plans"
      );

    if (
      actionPlansIndex === -1 ||
      !parts[
        actionPlansIndex + 1
      ] ||
      parts[
        actionPlansIndex + 1
      ] === "create"
    ) {
      return "";
    }

    return decodeURIComponent(
      parts[
        actionPlansIndex + 1
      ]
    );
  };

const formatDate = (
  value?: string | null
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

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const toDateInputValue = (
  value?: string | null
): string => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};

const getProjectLabel = (
  actionPlan: ActionPlan
): string => {
  if (
    typeof actionPlan.projectId ===
      "object" &&
    actionPlan.projectId
  ) {
    const project =
      actionPlan.projectId;

    const code =
      project.projectCode ||
      project.referenceNo ||
      project.projectReferenceNo ||
      actionPlan.projectCode;

    const name =
      project.projectName ||
      project.title ||
      "";

    if (
      code &&
      name
    ) {
      return `${code} — ${name}`;
    }

    return (
      code ||
      name ||
      actionPlan.projectCode ||
      "—"
    );
  }

  return (
    actionPlan.projectCode ||
    "—"
  );
};

const getTaskSerialNo = (
  actionPlan: ActionPlan
): string => {
  if (
    typeof actionPlan.taskId ===
      "object" &&
    actionPlan.taskId
  ) {
    const serialNo =
      actionPlan.taskId.serialNo ??
      actionPlan.taskSerialNo;

    return serialNo
      ? String(serialNo)
      : "—";
  }

  return actionPlan.taskSerialNo
    ? String(
        actionPlan.taskSerialNo
      )
    : "—";
};

const getTaskDescription = (
  actionPlan: ActionPlan
): string => {
  if (
    typeof actionPlan.taskId ===
      "object" &&
    actionPlan.taskId
  ) {
    return (
      actionPlan.taskId.description ||
      "—"
    );
  }

  return "—";
};

const getStatusClassName = (
  status: ActionPlanStatus
): string => {
  if (
    status === "complete"
  ) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
  }

  if (
    status === "in_progress"
  ) {
    return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  }

  if (
    status === "on_hold"
  ) {
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
  }

  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

const getPriorityClassName = (
  priority:
    ActionPlanPriority
): string => {
  if (
    priority === "critical"
  ) {
    return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  }

  if (
    priority === "high"
  ) {
    return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
  }

  if (
    priority === "low"
  ) {
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }

  return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
};

/* =========================================================
   ACTION PLAN DETAILS PAGE
   ========================================================= */

export default function ActionPlanDetailsPage() {
  const actionPlanId =
    useMemo(
      () =>
        getActionPlanIdFromPath(),
      []
    );

  const [
    actionPlan,
    setActionPlan,
  ] =
    useState<ActionPlan | null>(
      null
    );

  const [
    editForm,
    setEditForm,
  ] =
    useState<EditFormState>({
      title: "",
      description: "",
      priority: "medium",
      targetDate: "",
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    statusLoading,
    setStatusLoading,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    editMode,
    setEditMode,
  ] =
    useState(false);

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

  /* =======================================================
     LOAD
     ======================================================= */

  const loadActionPlan =
    useCallback(
      async () => {
        if (!actionPlanId) {
          setError(
            "Action Plan ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setError("");

          const result =
            await getActionPlanById(
              actionPlanId
            );

          setActionPlan(
            result
          );

          setEditForm({
            title:
              result.title,

            description:
              result.description ||
              "",

            priority:
              result.priority,

            targetDate:
              toDateInputValue(
                result.targetDate
              ),
          });
        } catch (
          requestError
        ) {
          setActionPlan(
            null
          );

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        actionPlanId,
      ]
    );

  useEffect(() => {
    void loadActionPlan();
  }, [
    loadActionPlan,
  ]);

  /* =======================================================
     SAVE DETAILS
     ======================================================= */

  const handleSave =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !actionPlan
      ) {
        return;
      }

      const title =
        editForm.title.trim();

      if (
        title.length < 3
      ) {
        setError(
          "Action Plan title must contain at least 3 characters."
        );

        return;
      }

      if (
        editForm.description
          .trim()
          .length > 5000
      ) {
        setError(
          "Action Plan description cannot exceed 5000 characters."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError("");
        setSuccess("");

        const updated =
          await updateActionPlan(
            actionPlan._id,
            {
              title,

              description:
                editForm.description
                  .trim(),

              priority:
                editForm.priority,

              targetDate:
                editForm.targetDate ||
                null,
            }
          );

        setActionPlan(
          (
            current
          ) =>
            current
              ? {
                  ...current,
                  ...updated,
                }
              : updated
        );

        setEditMode(
          false
        );

        setSuccess(
          "Action Plan updated successfully."
        );

        await loadActionPlan();
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError
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
      status:
        ActionPlanStatus
    ) => {
      if (
        !actionPlan
      ) {
        return;
      }

      try {
        setStatusLoading(
          true
        );

        setError("");
        setSuccess("");

        const updated =
          await updateActionPlanStatus(
            actionPlan._id,
            status
          );

        setActionPlan(
          (
            current
          ) =>
            current
              ? {
                  ...current,
                  ...updated,
                }
              : updated
        );

        setSuccess(
          "Action Plan status updated successfully."
        );

        await loadActionPlan();
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setStatusLoading(
          false
        );
      }
    };

  /* =======================================================
     DELETE
     ======================================================= */

  const handleDelete =
    async () => {
      if (
        !actionPlan
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete Action Plan "${actionPlan.title}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleting(
          true
        );

        setError("");

        await deleteActionPlan(
          actionPlan._id
        );

        window.location.href =
          "/action-plans";
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError
          )
        );

        setDeleting(
          false
        );
      }
    };

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <>
        <PageMeta
          title="Action Plan | Zorays Project Tracker"
          description="Action Plan details."
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          Loading Action Plan...
        </div>
      </>
    );
  }

  /* =======================================================
     NOT FOUND
     ======================================================= */

  if (!actionPlan) {
    return (
      <>
        <PageMeta
          title="Action Plan | Zorays Project Tracker"
          description="Action Plan details."
        />

        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error ||
              "Action Plan could not be loaded."}
          </div>

          <a
            href="/action-plans"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-bold text-white dark:bg-white dark:text-gray-900"
          >
            Back to Action Plans
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${actionPlan.title} | Zorays Project Tracker`}
        description="Action Plan details and status management."
      />

      <div className="space-y-6">
        {/* HEADER */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  Corrective Work
                </p>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClassName(
                    actionPlan.status
                  )}`}
                >
                  {getActionPlanStatusLabel(
                    actionPlan.status
                  )}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getPriorityClassName(
                    actionPlan.priority
                  )}`}
                >
                  {getActionPlanPriorityLabel(
                    actionPlan.priority
                  )}
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {actionPlan.title}
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {getProjectLabel(
                  actionPlan
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/action-plans"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                Back
              </a>

              <button
                type="button"
                disabled={
                  saving ||
                  deleting ||
                  statusLoading
                }
                onClick={() => {
                  setEditMode(
                    (
                      current
                    ) =>
                      !current
                  );

                  setSuccess("");
                  setError("");
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
              >
                {editMode
                  ? "Cancel Edit"
                  : "Edit"}
              </button>

              <button
                type="button"
                disabled={
                  deleting ||
                  saving ||
                  statusLoading
                }
                onClick={() => {
                  void handleDelete();
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </section>

        {/* ALERTS */}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
            {success}
          </div>
        ) : null}

        {/* STATUS CONTROL */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Work Status
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                Action Plan Status
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Action Plan status is independent from the linked Task completion status.
              </p>
            </div>

            <div className="w-full lg:w-72">
              <label
                htmlFor="action-plan-status"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Status
              </label>

              <select
                id="action-plan-status"
                value={
                  actionPlan.status
                }
                disabled={
                  statusLoading ||
                  deleting ||
                  saving
                }
                onChange={
                  (
                    event
                  ) => {
                    void handleStatusChange(
                      event.target.value as ActionPlanStatus
                    );
                  }
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="pending">
                  Pending
                </option>
                <option value="in_progress">
                  In Progress
                </option>
                <option value="complete">
                  Complete
                </option>
                <option value="on_hold">
                  On Hold
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* CONTEXT */}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Project
            </p>

            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
              {getProjectLabel(
                actionPlan
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Task
            </p>

            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
              Task #{getTaskSerialNo(
                actionPlan
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Target Date
            </p>

            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
              {formatDate(
                actionPlan.targetDate
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Completed At
            </p>

            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
              {formatDate(
                actionPlan.completedAt
              )}
            </p>
          </article>
        </section>

        {/* TASK */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
            Linked Task
          </p>

          <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            Task #{getTaskSerialNo(
              actionPlan
            )}
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300">
            {getTaskDescription(
              actionPlan
            )}
          </p>
        </section>

        {/* VIEW / EDIT DETAILS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          {!editMode ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Corrective Action
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                Action Details
              </h2>

              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Title
                </p>

                <p className="mt-2 text-base font-bold text-gray-900 dark:text-white">
                  {actionPlan.title}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                  {actionPlan.description ||
                    "No additional description."}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${getPriorityClassName(
                    actionPlan.priority
                  )}`}
                >
                  Priority:{" "}
                  {getActionPlanPriorityLabel(
                    actionPlan.priority
                  )}
                </span>
              </div>
            </>
          ) : (
            <form
              onSubmit={
                handleSave
              }
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Edit Action Plan
              </p>

              <div className="mt-5">
                <label
                  htmlFor="edit-action-plan-title"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Title
                </label>

                <input
                  id="edit-action-plan-title"
                  type="text"
                  maxLength={250}
                  value={
                    editForm.title
                  }
                  disabled={
                    saving
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setEditForm(
                        (
                          current
                        ) => ({
                          ...current,
                          title:
                            event.target.value,
                        })
                      );
                    }
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="edit-action-plan-description"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>

                <textarea
                  id="edit-action-plan-description"
                  rows={7}
                  maxLength={5000}
                  value={
                    editForm.description
                  }
                  disabled={
                    saving
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setEditForm(
                        (
                          current
                        ) => ({
                          ...current,
                          description:
                            event.target.value,
                        })
                      );
                    }
                  }
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-action-plan-priority"
                    className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                  >
                    Priority
                  </label>

                  <select
                    id="edit-action-plan-priority"
                    value={
                      editForm.priority
                    }
                    disabled={
                      saving
                    }
                    onChange={
                      (
                        event
                      ) => {
                        setEditForm(
                          (
                            current
                          ) => ({
                            ...current,
                            priority:
                              event.target.value as ActionPlanPriority,
                          })
                        );
                      }
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="low">
                      Low
                    </option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="high">
                      High
                    </option>
                    <option value="critical">
                      Critical
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-action-plan-target-date"
                    className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                  >
                    Target Date
                  </label>

                  <input
                    id="edit-action-plan-target-date"
                    type="date"
                    value={
                      editForm.targetDate
                    }
                    disabled={
                      saving
                    }
                    onChange={
                      (
                        event
                      ) => {
                        setEditForm(
                          (
                            current
                          ) => ({
                            ...current,
                            targetDate:
                              event.target.value,
                          })
                        );
                      }
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() => {
                    setEditMode(
                      false
                    );

                    setEditForm({
                      title:
                        actionPlan.title,

                      description:
                        actionPlan.description ||
                        "",

                      priority:
                        actionPlan.priority,

                      targetDate:
                        toDateInputValue(
                          actionPlan.targetDate
                        ),
                    });
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* AUDIT */}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Created
            </p>

            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
              {formatDate(
                actionPlan.createdAt
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Last Updated
            </p>

            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
              {formatDate(
                actionPlan.updatedAt
              )}
            </p>
          </article>
        </section>
      </div>
    </>
  );
}