import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  MoreDotIcon,
} from "../../icons";

import {
  Dropdown,
} from "../ui/dropdown/Dropdown";

import {
  DropdownItem,
} from "../ui/dropdown/DropdownItem";

import {
  buildTaskDashboardSummary,
  getTasks,
  type Task,
} from "../../services/task_register/task.service";

/* =========================================================
   TYPES
   ========================================================= */

type WorkflowMetrics = {
  totalTasks: number;

  complete: number;

  readyToComplete: number;

  beforeOnly: number;

  afterOnly: number;

  noEvidence: number;
};

type WorkflowItem = {
  name: string;
  description: string;

  count: number;
  percentage: number;

  barClassName: string;
  dotClassName: string;
  badgeClassName: string;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_METRICS: WorkflowMetrics = {
  totalTasks: 0,

  complete: 0,

  readyToComplete: 0,

  beforeOnly: 0,

  afterOnly: 0,

  noEvidence: 0,
};

/* =========================================================
   HELPERS
   ========================================================= */

const getErrorMessage = (
  error: unknown
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
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
      "Task workflow data could not be loaded."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Task workflow data could not be loaded.";
};

const calculatePercentage = (
  count: number,
  total: number
): number => {
  if (
    total <= 0
  ) {
    return 0;
  }

  return Math.round(
    (
      count /
      total
    ) *
      100
  );
};

/* =========================================================
   FETCH ALL TASKS
   ========================================================= */

const fetchAllTasks =
  async (): Promise<Task[]> => {
    const firstPage =
      await getTasks({
        page: 1,

        limit: 100,

        sortBy:
          "createdAt",

        sortOrder:
          "desc",
      });

    const tasks = [
      ...firstPage.tasks,
    ];

    const totalPages =
      firstPage.pagination
        .totalPages;

    if (
      totalPages <= 1
    ) {
      return tasks;
    }

    const remainingRequests =
      Array.from(
        {
          length:
            totalPages - 1,
        },

        (
          _,
          index
        ) =>
          getTasks({
            page:
              index + 2,

            limit:
              firstPage.pagination
                .limit,

            sortBy:
              "createdAt",

            sortOrder:
              "desc",
          })
      );

    const remainingPages =
      await Promise.all(
        remainingRequests
      );

    remainingPages.forEach(
      (
        result
      ) => {
        tasks.push(
          ...result.tasks
        );
      }
    );

    return tasks;
  };

/* =========================================================
   BUILD WORKFLOW METRICS
   ========================================================= */

const buildWorkflowMetrics = (
  tasks: Task[]
): WorkflowMetrics => {
  return tasks.reduce(
    (
      metrics,
      task
    ) => {
      metrics.totalTasks +=
        1;

      const beforeCount =
        task.evidenceSummary
          ?.beforeCount ??
        0;

      const afterCount =
        task.evidenceSummary
          ?.afterCount ??
        0;

      const hasBefore =
        beforeCount > 0;

      const hasAfter =
        afterCount > 0;

      /* COMPLETE */

      if (
        task.status ===
        "complete"
      ) {
        metrics.complete +=
          1;

        return metrics;
      }

      /* READY TO COMPLETE */

      if (
        hasBefore &&
        hasAfter
      ) {
        metrics.readyToComplete +=
          1;

        return metrics;
      }

      /* BEFORE ONLY */

      if (
        hasBefore &&
        !hasAfter
      ) {
        metrics.beforeOnly +=
          1;

        return metrics;
      }

      /* AFTER ONLY */

      if (
        !hasBefore &&
        hasAfter
      ) {
        metrics.afterOnly +=
          1;

        return metrics;
      }

      /* NO EVIDENCE */

      metrics.noEvidence +=
        1;

      return metrics;
    },

    {
      ...EMPTY_METRICS,
    }
  );
};

/* =========================================================
   LOADING
   ========================================================= */

function LoadingCard() {
  return (
    <section className="h-full w-full min-w-0 max-w-full animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-6 w-44 max-w-full rounded bg-gray-200 dark:bg-gray-800" />

            <div className="mt-3 h-4 w-64 max-w-full rounded bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="size-9 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {Array.from({
            length: 3,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800"
              />
            )
          )}
        </div>

        <div className="mt-6 space-y-4">
          {Array.from({
            length: 5,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="min-w-0"
              >
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-gray-200 dark:bg-gray-800" />

                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-36 max-w-full rounded bg-gray-200 dark:bg-gray-800" />

                    <div className="mt-2 h-3 w-28 max-w-full rounded bg-gray-100 dark:bg-gray-800" />
                  </div>

                  <div className="h-6 w-12 rounded-full bg-gray-200 dark:bg-gray-800" />
                </div>

                <div className="mt-3 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function TaskCategoryCard() {
  const navigate =
    useNavigate();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    tasks,
    setTasks,
  ] =
    useState<Task[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD DATA
     ======================================================= */

  const loadWorkflowData =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        try {
          if (
            showRefreshLoader
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const result =
            await fetchAllTasks();

          setTasks(
            result
          );
        } catch (
          requestError
        ) {
          setTasks([]);

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },

      []
    );

  useEffect(() => {
    void loadWorkflowData();
  }, [
    loadWorkflowData,
  ]);

  /* =======================================================
     METRICS
     ======================================================= */

  const metrics =
    useMemo(
      () =>
        tasks.length > 0
          ? buildWorkflowMetrics(
              tasks
            )
          : EMPTY_METRICS,

      [
        tasks,
      ]
    );

  const summary =
    useMemo(
      () =>
        buildTaskDashboardSummary(
          tasks
        ),

      [
        tasks,
      ]
    );

  /* =======================================================
     WORKFLOW ITEMS
     ======================================================= */

  const workflowItems =
    useMemo<WorkflowItem[]>(
      () => [
        {
          name:
            "Complete",

          description:
            "Task completed",

          count:
            metrics.complete,

          percentage:
            calculatePercentage(
              metrics.complete,
              metrics.totalTasks
            ),

          barClassName:
            "bg-emerald-500",

          dotClassName:
            "bg-emerald-500",

          badgeClassName:
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
        },

        {
          name:
            "Ready to Complete",

          description:
            "Before and After Evidence available",

          count:
            metrics.readyToComplete,

          percentage:
            calculatePercentage(
              metrics.readyToComplete,
              metrics.totalTasks
            ),

          barClassName:
            "bg-blue-500",

          dotClassName:
            "bg-blue-500",

          badgeClassName:
            "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
        },

        {
          name:
            "Before Evidence Only",

          description:
            "Waiting for After Evidence",

          count:
            metrics.beforeOnly,

          percentage:
            calculatePercentage(
              metrics.beforeOnly,
              metrics.totalTasks
            ),

          barClassName:
            "bg-amber-500",

          dotClassName:
            "bg-amber-500",

          badgeClassName:
            "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
        },

        {
          name:
            "After Evidence Only",

          description:
            "Before Evidence unavailable",

          count:
            metrics.afterOnly,

          percentage:
            calculatePercentage(
              metrics.afterOnly,
              metrics.totalTasks
            ),

          barClassName:
            "bg-orange-500",

          dotClassName:
            "bg-orange-500",

          badgeClassName:
            "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
        },

        {
          name:
            "No Evidence",

          description:
            "Evidence upload required",

          count:
            metrics.noEvidence,

          percentage:
            calculatePercentage(
              metrics.noEvidence,
              metrics.totalTasks
            ),

          barClassName:
            "bg-gray-500",

          dotClassName:
            "bg-gray-400",

          badgeClassName:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        },
      ],

      [
        metrics,
      ]
    );

  /* =======================================================
     DROPDOWN
     ======================================================= */

  const toggleDropdown =
    () => {
      setIsOpen(
        (
          current
        ) =>
          !current
      );
    };

  const closeDropdown =
    () => {
      setIsOpen(
        false
      );
    };

  const openTaskRegister =
    () => {
      closeDropdown();

      navigate(
        "/tasks"
      );
    };

  const createTask =
    () => {
      closeDropdown();

      navigate(
        "/tasks/create"
      );
    };

  const refreshData =
    () => {
      closeDropdown();

      void loadWorkflowData(
        true
      );
    };

  /* =======================================================
     LOADING
     ======================================================= */

  if (
    loading
  ) {
    return (
      <LoadingCard />
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* HEADER */}

      <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Task Workflow Status
              </h3>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />

                Live
              </span>
            </div>

            <p className="mt-1.5 text-sm leading-5 text-gray-500 dark:text-gray-400">
              Evidence readiness and Task completion workflow.
            </p>
          </div>

          {/* OPTIONS */}

          <div className="relative shrink-0">
            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={
                toggleDropdown
              }
              className="dropdown-toggle flex size-9 items-center justify-center rounded-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
              aria-label="Open Task workflow options"
              aria-expanded={
                isOpen
              }
            >
              <MoreDotIcon className="size-6 text-gray-400" />
            </button>

            <Dropdown
              isOpen={
                isOpen
              }
              onClose={
                closeDropdown
              }
              className="w-48 p-2"
            >
              <DropdownItem
                onItemClick={
                  openTaskRegister
                }
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View Task Register
              </DropdownItem>

              <DropdownItem
                onItemClick={
                  createTask
                }
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Create Task
              </DropdownItem>

              <DropdownItem
                onItemClick={
                  refreshData
                }
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Refresh Data
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* ERROR */}

        {error ? (
          <div className="mt-4 flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words text-xs font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() => {
                void loadWorkflowData(
                  true
                );
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
            >
              {refreshing
                ? "Refreshing..."
                : "Retry"}
            </button>
          </div>
        ) : null}
      </div>

      {/* SUMMARY */}

      <div className="grid min-w-0 grid-cols-3 border-b border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20">
        <div className="min-w-0 px-3 py-4 text-center sm:px-4">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Total
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {
              metrics.totalTasks
            }
          </p>
        </div>

        <div className="min-w-0 border-x border-gray-100 px-3 py-4 text-center dark:border-gray-800 sm:px-4">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            In Progress
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {
              summary.inProgressTasks
            }
          </p>
        </div>

        <div className="min-w-0 px-3 py-4 text-center sm:px-4">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Complete
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {
              summary.completeTasks
            }
          </p>
        </div>
      </div>

      {/* WORKFLOW CONTENT */}

      <div className="flex-1 p-5 sm:p-6">
        {metrics.totalTasks ===
        0 ? (
          <div className="flex min-h-[290px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800">
              0
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
              No Task records available
            </p>

            <p className="mt-1.5 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
              Workflow details will appear when Task records are created.
            </p>

            <button
              type="button"
              onClick={
                createTask
              }
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              Create Task
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {workflowItems.map(
              (
                item
              ) => (
                <article
                  key={
                    item.name
                  }
                  className="w-full min-w-0 max-w-full"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${item.dotClassName}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                          {
                            item.name
                          }
                        </p>

                        <span
                          className={`inline-flex min-w-[62px] shrink-0 items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold ${item.badgeClassName}`}
                        >
                          {
                            item.count
                          }{" "}
                          ·{" "}
                          {
                            item.percentage
                          }
                          %
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {
                          item.description
                        }
                      </p>
                    </div>
                  </div>

                  <div className="ml-[22px] mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.barClassName}`}
                      style={{
                        width:
                          `${item.percentage}%`,
                      }}
                    />
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}

      <div className="border-t border-gray-100 bg-gray-50/40 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950/20 sm:px-6">
        <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">
          Ready to Complete requires both Before and After Evidence.
          Completion remains manual.
        </p>
      </div>
    </section>
  );
}