import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  getTasks,
  getTaskProjectReference,
  getTaskSerialLabel,
  type Task,
  type TaskStatus,
} from "../../services/task_register/task.service";

/* =========================================================
   TYPES
   ========================================================= */

type WorkFilter =
  | "all"
  | TaskStatus;

/* =========================================================
   CONSTANTS
   ========================================================= */

const RECENT_TASK_LIMIT = 6;

/* =========================================================
   ICONS
   ========================================================= */

const ProgressIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M12 7V12L15 14" />
  </svg>
);

const CompleteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M8 12L11 15L16 9" />
  </svg>
);

const ImageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="2"
    />

    <circle
      cx="8.5"
      cy="9"
      r="1.5"
    />

    <path d="M21 15L16 10L6 20" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
    aria-hidden="true"
  >
    <path d="M20 6V11H15" />
    <path d="M4 18V13H9" />
    <path d="M6.1 8.5A7 7 0 0 1 18.8 7L20 11" />
    <path d="M18 15.5A7 7 0 0 1 5.2 17L4 13" />
  </svg>
);

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
      "Recent Tasks could not be loaded."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Recent Tasks could not be loaded.";
};

const formatDate = (
  value?: string
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
    "en-GB",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(date);
};

const getTaskReference = (
  task: Task
): string => {
  const registerId =
    task.taskRegisterId
      ?.trim();

  if (registerId) {
    return registerId;
  }

  return `Task #${getTaskSerialLabel(
    task
  )}`;
};

/* =========================================================
   STATUS BADGE
   ========================================================= */

function TaskStatusBadge({
  status,
}: {
  status: TaskStatus;
}) {
  if (
    status === "complete"
  ) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <span className="flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CompleteIcon />
        </span>

        Complete
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
      <span className="relative flex size-4 items-center justify-center">
        <span className="absolute size-4 animate-ping rounded-full bg-amber-400 opacity-20" />

        <span className="relative flex size-4 items-center justify-center rounded-full bg-amber-500 text-white">
          <ProgressIcon />
        </span>
      </span>

      In Progress
    </span>
  );
}

/* =========================================================
   EVIDENCE BADGE
   ========================================================= */

function EvidenceBadge({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 dark:border-gray-700 dark:bg-gray-900">
      <span className="shrink-0 text-gray-400">
        <ImageIcon />
      </span>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="text-xs font-bold text-gray-800 dark:text-white/90">
          {count}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function LoadingRows() {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
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
            className="animate-pulse px-4 py-4 sm:px-5"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="size-10 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-36 max-w-full rounded bg-gray-100 dark:bg-gray-800" />

                <div className="mt-2 h-3 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />

                <div className="mt-3 flex gap-2">
                  <div className="h-8 w-20 rounded-lg bg-gray-100 dark:bg-gray-800" />

                  <div className="h-8 w-20 rounded-lg bg-gray-100 dark:bg-gray-800" />

                  <div className="h-8 w-24 rounded-full bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function RecentTasks() {
  const [
    selectedFilter,
    setSelectedFilter,
  ] =
    useState<WorkFilter>(
      "all"
    );

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
     LOAD RECENT TASKS
     ======================================================= */

  const loadRecentTasks =
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
            await getTasks({
              ...(selectedFilter !==
              "all"
                ? {
                    status:
                      selectedFilter,
                  }
                : {}),

              page: 1,

              limit:
                RECENT_TASK_LIMIT,

              sortBy:
                "createdAt",

              sortOrder:
                "desc",
            });

          setTasks(
            result.tasks
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
      [
        selectedFilter,
      ]
    );

  useEffect(() => {
    void loadRecentTasks();
  }, [
    loadRecentTasks,
  ]);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="flex h-full w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* HEADER */}

      <div className="border-b border-gray-100 px-4 py-5 dark:border-gray-800 sm:px-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Recent Tasks
              </h3>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />

                Live
              </span>
            </div>

            <p className="mt-1.5 text-sm leading-5 text-gray-500 dark:text-gray-400">
              Latest Task Register activity and Before/After Evidence status.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <select
              value={
                selectedFilter
              }
              disabled={
                loading ||
                refreshing
              }
              onChange={(
                event
              ) =>
                setSelectedFilter(
                  event.target
                    .value as WorkFilter
                )
              }
              aria-label="Filter recent tasks"
              className="h-9 min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition hover:bg-gray-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:ring-emerald-500/10"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="complete">
                Complete
              </option>
            </select>

            <button
              type="button"
              title="Refresh Recent Tasks"
              disabled={
                loading ||
                refreshing
              }
              onClick={() => {
                void loadRecentTasks(
                  true
                );
              }}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                <RefreshIcon />
              </span>
            </button>

            <Link
              to="/tasks"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-emerald-400"
            >
              See All
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words text-xs font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadRecentTasks();
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>

      {/* COLUMN HEADERS */}

      {!loading &&
      tasks.length > 0 ? (
        <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(100px,0.65fr)_minmax(130px,0.8fr)_auto] gap-4 border-b border-gray-100 bg-gray-50/60 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-gray-950/20 lg:grid">
          <span>
            Task
          </span>

          <span>
            Project Ref.
          </span>

          <span>
            Evidence
          </span>

          <span className="text-right">
            Status
          </span>
        </div>
      ) : null}

      {/* TASK LIST */}

      <div className="min-w-0 flex-1">
        {loading ? (
          <LoadingRows />
        ) : tasks.length ===
          0 ? (
          <div className="flex min-h-[390px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800">
              0
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              No matching Task records
            </p>

            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
              Current status filter has no Task Register records.
            </p>

            <Link
              to="/tasks/create"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              Create Task
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map(
              (
                task
              ) => {
                const beforeCount =
                  task.evidenceSummary
                    ?.beforeCount ??
                  0;

                const afterCount =
                  task.evidenceSummary
                    ?.afterCount ??
                  0;

                const projectReference =
                  getTaskProjectReference(
                    task
                  );

                return (
                  <article
                    key={
                      task._id
                    }
                    className={`min-w-0 px-4 py-4 transition sm:px-5 ${
                      task.status ===
                      "complete"
                        ? "bg-emerald-50/10 hover:bg-emerald-50/30 dark:bg-emerald-950/[0.03] dark:hover:bg-emerald-950/10"
                        : "hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* DESKTOP */}

                    <div className="hidden min-w-0 grid-cols-[minmax(0,1.8fr)_minmax(100px,0.65fr)_minmax(130px,0.8fr)_auto] items-center gap-4 lg:grid">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 px-2 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {getTaskSerialLabel(
                            task
                          )}
                        </div>

                        <div className="min-w-0">
                          <Link
                            to={`/tasks/${task._id}`}
                            className="block truncate text-sm font-semibold text-gray-800 transition hover:text-emerald-600 dark:text-white/90 dark:hover:text-emerald-400"
                          >
                            {getTaskReference(
                              task
                            )}
                          </Link>

                          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-500 dark:text-gray-400">
                            {
                              task.description
                            }
                          </p>

                          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                            Updated{" "}
                            {formatDate(
                              task.updatedAt
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <span className="inline-flex max-w-full rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <span className="truncate">
                            {projectReference ||
                              "—"}
                          </span>
                        </span>
                      </div>

                      <div className="grid min-w-0 grid-cols-2 gap-2">
                        <EvidenceBadge
                          count={
                            beforeCount
                          }
                          label="Before"
                        />

                        <EvidenceBadge
                          count={
                            afterCount
                          }
                          label="After"
                        />
                      </div>

                      <div className="flex justify-end">
                        <TaskStatusBadge
                          status={
                            task.status
                          }
                        />
                      </div>
                    </div>

                    {/* MOBILE */}

                    <div className="min-w-0 lg:hidden">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 px-2 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {getTaskSerialLabel(
                            task
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/tasks/${task._id}`}
                                className="block truncate text-sm font-semibold text-gray-800 transition hover:text-emerald-600 dark:text-white/90 dark:hover:text-emerald-400"
                              >
                                {getTaskReference(
                                  task
                                )}
                              </Link>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {
                                  task.description
                                }
                              </p>
                            </div>

                            <TaskStatusBadge
                              status={
                                task.status
                              }
                            />
                          </div>

                          <div className="mt-3 flex min-w-0 items-center gap-2 text-[10px]">
                            <span className="shrink-0 font-semibold uppercase tracking-wide text-gray-400">
                              Project
                            </span>

                            <span className="min-w-0 truncate font-bold text-gray-600 dark:text-gray-300">
                              {projectReference ||
                                "—"}
                            </span>
                          </div>

                          <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
                            <EvidenceBadge
                              count={
                                beforeCount
                              }
                              label="Before"
                            />

                            <EvidenceBadge
                              count={
                                afterCount
                              }
                              label="After"
                            />
                          </div>

                          <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                            Updated{" "}
                            {formatDate(
                              task.updatedAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}

      {!loading &&
      tasks.length > 0 ? (
        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/40 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/20 sm:px-5">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Showing latest{" "}
            {
              tasks.length
            }{" "}
            Task
            {tasks.length === 1
              ? ""
              : "s"}
          </p>

          <Link
            to="/tasks"
            className="shrink-0 text-[11px] font-bold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400"
          >
            View Task Register
          </Link>
        </div>
      ) : null}
    </section>
  );
}