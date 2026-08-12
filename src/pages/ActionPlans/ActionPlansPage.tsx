import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import PageMeta from "../../components/common/PageMeta";

import {
  getActiveProjects,
} from "../../services/project/project.service";

import {
  deleteActionPlan,
  getActionPlans,
  getActionPlanPriorityLabel,
  getActionPlanSummary,
  updateActionPlanStatus,
  type ActionPlan,
  type ActionPlanPriority,
  type ActionPlanStatus,
  type ActionPlanSummary,
} from "../../services/action_plan/actionPlan.service";

/* =========================================================
   TYPES
   ========================================================= */

type ProjectOption = {
  _id: string;
  label: string;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_SUMMARY: ActionPlanSummary = {
  total: 0,
  pending: 0,
  inProgress: 0,
  complete: 0,
  onHold: 0,
  critical: 0,
  overdue: 0,
  completionPercentage: 0,
};

const PAGE_SIZE = 20;

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
          };
        };
      };

    return (
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

const extractProjectRecords = (
  value: unknown
): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [];
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    Array.isArray(
      record.projects
    )
  ) {
    return record.projects;
  }

  if (
    record.data &&
    typeof record.data ===
      "object"
  ) {
    const nested =
      record.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        nested.projects
      )
    ) {
      return nested.projects;
    }
  }

  return [];
};

const normalizeProject = (
  value: unknown
): ProjectOption | null => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const project =
    value as Record<
      string,
      unknown
    >;

  const id =
    typeof project._id ===
      "string"
      ? project._id
      : "";

  if (!id) {
    return null;
  }

  const code =
    typeof project.projectCode ===
      "string"
      ? project.projectCode
      : typeof project.referenceNo ===
          "string"
        ? project.referenceNo
        : typeof project.projectReferenceNo ===
            "string"
          ? project.projectReferenceNo
          : "";

  const name =
    typeof project.projectName ===
      "string"
      ? project.projectName
      : typeof project.title ===
          "string"
        ? project.title
        : typeof project.name ===
            "string"
          ? project.name
          : "Unnamed Project";

  return {
    _id:
      id,

    label:
      code
        ? `${code} — ${name}`
        : name,
  };
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

const getTaskLabel = (
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

    const description =
      actionPlan.taskId.description ||
      "";

    if (
      serialNo &&
      description
    ) {
      return `Task ${serialNo} — ${description}`;
    }

    if (serialNo) {
      return `Task ${serialNo}`;
    }

    return (
      description ||
      "Task"
    );
  }

  return actionPlan.taskSerialNo
    ? `Task ${actionPlan.taskSerialNo}`
    : "Task";
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
   ACTION PLANS PAGE
   ========================================================= */

export default function ActionPlansPage() {
  const [
    projects,
    setProjects,
  ] =
    useState<ProjectOption[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "" |
      ActionPlanStatus
    >("");

  const [
    priorityFilter,
    setPriorityFilter,
  ] =
    useState<
      "" |
      ActionPlanPriority
    >("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    actionPlans,
    setActionPlans,
  ] =
    useState<ActionPlan[]>([]);

  const [
    summary,
    setSummary,
  ] =
    useState<ActionPlanSummary>(
      EMPTY_SUMMARY
    );

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(1);

  const [
    totalRecords,
    setTotalRecords,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    projectsLoading,
    setProjectsLoading,
  ] =
    useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] =
    useState("");

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
     LOAD PROJECTS
     ======================================================= */

  const loadProjects =
    useCallback(
      async () => {
        try {
          setProjectsLoading(
            true
          );

          const result =
            await getActiveProjects();

          const projectOptions =
            extractProjectRecords(
              result
            )
              .map(
                normalizeProject
              )
              .filter(
                (
                  project
                ): project is ProjectOption =>
                  project !== null
              )
              .sort(
                (
                  first,
                  second
                ) =>
                  first.label.localeCompare(
                    second.label
                  )
              );

          setProjects(
            projectOptions
          );
        } catch (
          requestError
        ) {
          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setProjectsLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD ACTION PLANS
     ======================================================= */

  const loadActionPlans =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            listResult,
            summaryResult,
          ] =
            await Promise.all([
              getActionPlans({
                ...(selectedProjectId
                  ? {
                      projectId:
                        selectedProjectId,
                    }
                  : {}),

                ...(statusFilter
                  ? {
                      status:
                        statusFilter,
                    }
                  : {}),

                ...(priorityFilter
                  ? {
                      priority:
                        priorityFilter,
                    }
                  : {}),

                ...(search
                  ? {
                      search,
                    }
                  : {}),

                page,
                limit:
                  PAGE_SIZE,

                sortBy:
                  "createdAt",

                sortOrder:
                  "desc",
              }),

              getActionPlanSummary(
                selectedProjectId ||
                undefined
              ),
            ]);

          setActionPlans(
            listResult.actionPlans
          );

          setTotalPages(
            Math.max(
              listResult.pagination
                .totalPages,
              1
            )
          );

          setTotalRecords(
            listResult.pagination
              .total
          );

          setSummary(
            summaryResult
          );
        } catch (
          requestError
        ) {
          setActionPlans([]);
          setSummary(
            EMPTY_SUMMARY
          );

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        selectedProjectId,
        statusFilter,
        priorityFilter,
        search,
        page,
      ]
    );

  /* =======================================================
     EFFECTS
     ======================================================= */

  useEffect(() => {
    void loadProjects();
  }, [
    loadProjects,
  ]);

  useEffect(() => {
    void loadActionPlans();
  }, [
    loadActionPlans,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    selectedProjectId,
    statusFilter,
    priorityFilter,
    search,
  ]);

  /* =======================================================
     SUMMARY CARDS
     ======================================================= */

  const summaryCards =
    useMemo(
      () => [
        {
          label:
            "Total Plans",

          value:
            summary.total,

          note:
            "All corrective actions",
        },

        {
          label:
            "Pending",

          value:
            summary.pending,

          note:
            "Not started yet",
        },

        {
          label:
            "In Progress",

          value:
            summary.inProgress,

          note:
            "Currently under work",
        },

        {
          label:
            "Complete",

          value:
            summary.complete,

          note:
            "Corrective actions closed",
        },

        {
          label:
            "On Hold",

          value:
            summary.onHold,

          note:
            "Temporarily paused",
        },

        {
          label:
            "Overdue",

          value:
            summary.overdue,

          note:
            "Past target date",
        },
      ],
      [
        summary,
      ]
    );

  /* =======================================================
     STATUS UPDATE
     ======================================================= */

  const handleStatusChange =
    async (
      actionPlanId: string,
      status:
        ActionPlanStatus
    ) => {
      try {
        setActionLoadingId(
          actionPlanId
        );

        setError("");
        setSuccess("");

        await updateActionPlanStatus(
          actionPlanId,
          status
        );

        setSuccess(
          "Action Plan status updated successfully."
        );

        await loadActionPlans();
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setActionLoadingId(
          ""
        );
      }
    };

  /* =======================================================
     DELETE
     ======================================================= */

  const handleDelete =
    async (
      actionPlan: ActionPlan
    ) => {
      const confirmed =
        window.confirm(
          `Delete Action Plan "${actionPlan.title}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoadingId(
          actionPlan._id
        );

        setError("");
        setSuccess("");

        await deleteActionPlan(
          actionPlan._id
        );

        setSuccess(
          "Action Plan deleted successfully."
        );

        if (
          actionPlans.length === 1 &&
          page > 1
        ) {
          setPage(
            (
              current
            ) =>
              Math.max(
                current - 1,
                1
              )
          );
        } else {
          await loadActionPlans();
        }
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setActionLoadingId(
          ""
        );
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <PageMeta
        title="Action Plans | Zorays Project Tracker"
        description="Manage project corrective Action Plans."
      />

      <div className="space-y-6">
        {/* HEADER */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Corrective Work
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Action Plans
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Track corrective actions against Project Tasks, target dates, priorities and completion status.
              </p>
            </div>

            <a
              href="/action-plans/create"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Create Action Plan
            </a>
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

        {/* SUMMARY */}

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
          {summaryCards.map(
            (
              card
            ) => (
              <article
                key={
                  card.label
                }
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>

                <p className="mt-1 text-[11px] leading-5 text-gray-400">
                  {card.note}
                </p>
              </article>
            )
          )}
        </section>

        {/* PROGRESS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Action Plan Completion
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {summary.completionPercentage}%
              </p>
            </div>

            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              Critical:{" "}
              <span className="font-bold text-red-600 dark:text-red-400">
                {summary.critical}
              </span>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width:
                  `${Math.min(
                    Math.max(
                      summary.completionPercentage,
                      0
                    ),
                    100
                  )}%`,
              }}
            />
          </div>
        </section>

        {/* FILTERS */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                Project
              </label>

              <select
                value={
                  selectedProjectId
                }
                disabled={
                  projectsLoading
                }
                onChange={
                  (
                    event
                  ) => {
                    setSelectedProjectId(
                      event.target.value
                    );
                  }
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">
                  All Projects
                </option>

                {projects.map(
                  (
                    project
                  ) => (
                    <option
                      key={
                        project._id
                      }
                      value={
                        project._id
                      }
                    >
                      {project.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                Status
              </label>

              <select
                value={
                  statusFilter
                }
                onChange={
                  (
                    event
                  ) => {
                    setStatusFilter(
                      event.target.value as
                        "" |
                        ActionPlanStatus
                    );
                  }
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">
                  All Statuses
                </option>
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

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                Priority
              </label>

              <select
                value={
                  priorityFilter
                }
                onChange={
                  (
                    event
                  ) => {
                    setPriorityFilter(
                      event.target.value as
                        "" |
                        ActionPlanPriority
                    );
                  }
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">
                  All Priorities
                </option>
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

            <form
              onSubmit={
                (
                  event
                ) => {
                  event.preventDefault();

                  setSearch(
                    searchInput.trim()
                  );
                }
              }
            >
              <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
                Search
              </label>

              <div className="flex gap-2">
                <input
                  type="search"
                  value={
                    searchInput
                  }
                  placeholder="Title or description"
                  onChange={
                    (
                      event
                    ) => {
                      setSearchInput(
                        event.target.value
                      );
                    }
                  }
                  className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />

                <button
                  type="submit"
                  className="h-11 rounded-xl bg-gray-900 px-4 text-xs font-bold text-white dark:bg-white dark:text-gray-900"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Corrective Action Register
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {totalRecords} Action Plan
                {totalRecords === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() => {
                void loadActionPlans();
              }}
              className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading Action Plans...
            </div>
          ) : actionPlans.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="font-bold text-gray-900 dark:text-white">
                No Action Plans Found
              </h3>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create a corrective Action Plan against a Project Task.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/70">
                  <tr className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3">
                      Action Plan
                    </th>
                    <th className="px-4 py-3">
                      Project
                    </th>
                    <th className="px-4 py-3">
                      Task
                    </th>
                    <th className="px-4 py-3">
                      Priority
                    </th>
                    <th className="px-4 py-3">
                      Target Date
                    </th>
                    <th className="px-4 py-3">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {actionPlans.map(
                    (
                      actionPlan
                    ) => (
                      <tr
                        key={
                          actionPlan._id
                        }
                        className="align-top"
                      >
                        <td className="px-4 py-4">
                          <a
                            href={`/action-plans/${actionPlan._id}`}
                            className="font-bold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                          >
                            {actionPlan.title}
                          </a>

                          {actionPlan.description ? (
                            <p className="mt-1 max-w-md line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              {actionPlan.description}
                            </p>
                          ) : null}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {getProjectLabel(
                            actionPlan
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          <p className="max-w-xs line-clamp-2">
                            {getTaskLabel(
                              actionPlan
                            )}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getPriorityClassName(
                              actionPlan.priority
                            )}`}
                          >
                            {getActionPlanPriorityLabel(
                              actionPlan.priority
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(
                            actionPlan.targetDate
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <select
                            value={
                              actionPlan.status
                            }
                            disabled={
                              actionLoadingId ===
                              actionPlan._id
                            }
                            onChange={
                              (
                                event
                              ) => {
                                void handleStatusChange(
                                  actionPlan._id,
                                  event.target.value as ActionPlanStatus
                                );
                              }
                            }
                            className={`h-9 rounded-lg border-0 px-2.5 text-xs font-bold outline-none ${getStatusClassName(
                              actionPlan.status
                            )}`}
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
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <a
                              href={`/action-plans/${actionPlan._id}`}
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              View
                            </a>

                            <button
                              type="button"
                              disabled={
                                actionLoadingId ===
                                actionPlan._id
                              }
                              onClick={() => {
                                void handleDelete(
                                  actionPlan
                                );
                              }}
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}

          {!loading &&
          totalPages > 1 ? (
            <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
              <button
                type="button"
                disabled={
                  page <= 1
                }
                onClick={() => {
                  setPage(
                    (
                      current
                    ) =>
                      Math.max(
                        current - 1,
                        1
                      )
                  );
                }}
                className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
              >
                Previous
              </button>

              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Page {page} of{" "}
                {totalPages}
              </p>

              <button
                type="button"
                disabled={
                  page >=
                  totalPages
                }
                onClick={() => {
                  setPage(
                    (
                      current
                    ) =>
                      Math.min(
                        current + 1,
                        totalPages
                      )
                  );
                }}
                className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}