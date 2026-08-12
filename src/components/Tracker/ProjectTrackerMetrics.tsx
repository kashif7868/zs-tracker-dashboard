import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  buildTaskDashboardSummary,
  getTasks,
  type Task,
} from "../../services/task_register/task.service";

import {
  getProjectDashboardStats,
  type ProjectDashboardStats,
} from "../../services/project/project.service";

/* =========================================================
   ICONS
   ========================================================= */

const TaskRegisterIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-6"
    aria-hidden="true"
  >
    <path d="M12 3L20 6V11C20 16 16.6 19.7 12 21C7.4 19.7 4 16 4 11V6L12 3Z" />
    <path d="M12 8V13" />
    <path d="M12 16H12.01" />
  </svg>
);

const ProjectsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-6"
    aria-hidden="true"
  >
    <path d="M3 7.5L12 3L21 7.5L12 12L3 7.5Z" />
    <path d="M3 12L12 16.5L21 12" />
    <path d="M3 16.5L12 21L21 16.5" />
  </svg>
);

const ActiveProjectIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-6"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7V12L15.5 14" />
  </svg>
);

const CompletedProjectIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-6"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12L11 15L16.5 9.5" />
  </svg>
);

/* =========================================================
   TYPES
   ========================================================= */

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;

  icon: ReactNode;

  iconWrapperClassName: string;
  detailClassName: string;
  accentClassName: string;

  pulse?: boolean;
};

type DashboardMetricsData = {
  totalTasks: number;

  inProgressTasks: number;

  completeTasks: number;

  completionPercentage: number;

  beforeEvidenceCount: number;

  afterEvidenceCount: number;

  totalEvidenceCount: number;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_PROJECT_STATS: ProjectDashboardStats = {
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  draftProjects: 0,
  onHoldProjects: 0,
  archivedProjects: 0,
};

const EMPTY_METRICS: DashboardMetricsData = {
  totalTasks: 0,

  inProgressTasks: 0,

  completeTasks: 0,

  completionPercentage: 0,

  beforeEvidenceCount: 0,

  afterEvidenceCount: 0,

  totalEvidenceCount: 0,
};

/* =========================================================
   ERROR HELPER
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
      "Dashboard metrics could not be loaded."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Dashboard metrics could not be loaded.";
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

    const allTasks = [
      ...firstPage.tasks,
    ];

    const totalPages =
      firstPage.pagination
        .totalPages;

    if (
      totalPages <= 1
    ) {
      return allTasks;
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
      (result) => {
        allTasks.push(
          ...result.tasks
        );
      }
    );

    return allTasks;
  };

/* =========================================================
   BUILD TASK METRICS
   ========================================================= */

const buildDashboardMetrics = (
  tasks: Task[]
): DashboardMetricsData => {
  const taskSummary =
    buildTaskDashboardSummary(
      tasks
    );

  const evidenceCounts =
    tasks.reduce(
      (
        current,
        task
      ) => {
        current.beforeEvidenceCount +=
          task.evidenceSummary
            ?.beforeCount ??
          0;

        current.afterEvidenceCount +=
          task.evidenceSummary
            ?.afterCount ??
          0;

        return current;
      },

      {
        beforeEvidenceCount:
          0,

        afterEvidenceCount:
          0,
      }
    );

  return {
    totalTasks:
      taskSummary.totalTasks,

    inProgressTasks:
      taskSummary
        .inProgressTasks,

    completeTasks:
      taskSummary
        .completeTasks,

    completionPercentage:
      taskSummary
        .completionPercentage,

    beforeEvidenceCount:
      evidenceCounts
        .beforeEvidenceCount,

    afterEvidenceCount:
      evidenceCounts
        .afterEvidenceCount,

    totalEvidenceCount:
      evidenceCounts
        .beforeEvidenceCount +
      evidenceCounts
        .afterEvidenceCount,
  };
};

/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  title,
  value,
  detail,
  icon,
  iconWrapperClassName,
  detailClassName,
  accentClassName,
  pulse = false,
}: MetricCardProps) {
  return (
    <article className="group relative flex min-h-[210px] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700">
      {/* TOP ACCENT */}

      <div
        className={`absolute inset-x-0 top-0 h-[4px] ${accentClassName}`}
      />

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        {/* TOP ROW */}

        <div className="flex min-w-0 items-start justify-between gap-3">
          {/* ICON */}

          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${iconWrapperClassName}`}
          >
            {icon}
          </div>

          {/* STATUS BADGE */}

          <div className="flex min-w-0 flex-1 justify-end">
            <span
              className={`inline-flex max-w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-center text-[11px] font-bold leading-[1.25] ${detailClassName}`}
            >
              {pulse ? (
                <span className="relative flex size-2 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-30" />

                  <span className="relative inline-flex size-2 rounded-full bg-current" />
                </span>
              ) : null}

              <span className="min-w-0 break-words">
                {detail}
              </span>
            </span>
          </div>
        </div>

        {/* METRIC */}

        <div className="mt-auto pt-7">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
            <h3 className="min-w-0 text-[38px] font-bold leading-none tracking-tight text-gray-900 dark:text-white sm:text-[42px]">
              {value}
            </h3>

            <span className="mb-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400 dark:border-gray-800 dark:bg-gray-900 sm:flex">
              →
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   LOADING CARD
   ========================================================= */

function LoadingMetricCard() {
  return (
    <article className="flex min-h-[210px] w-full min-w-0 max-w-full animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="size-12 shrink-0 rounded-2xl bg-gray-200 dark:bg-gray-800" />

        <div className="h-7 w-24 max-w-[45%] rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="mt-auto pt-7">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />

        <div className="mt-3 h-10 w-16 rounded bg-gray-200 dark:bg-gray-800" />
      </div>
    </article>
  );
}

/* =========================================================
   DASHBOARD METRICS
   ========================================================= */

export default function ProjectTrackerMetrics() {
  const [
    projectStats,
    setProjectStats,
  ] =
    useState<ProjectDashboardStats>(
      EMPTY_PROJECT_STATS
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
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD METRICS
     ======================================================= */

  const loadMetrics =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const [
            projectResult,
            taskResult,
          ] =
            await Promise.all([
              getProjectDashboardStats(),
              fetchAllTasks(),
            ]);

          setProjectStats(
            projectResult
          );

          setTasks(
            taskResult
          );
        } catch (
          requestError
        ) {
          setProjectStats(
            EMPTY_PROJECT_STATS
          );

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
        }
      },
      []
    );

  useEffect(() => {
    void loadMetrics();
  }, [
    loadMetrics,
  ]);

  /* =======================================================
     CALCULATED METRICS
     ======================================================= */

  const metrics =
    useMemo(
      () =>
        tasks.length > 0
          ? buildDashboardMetrics(
              tasks
            )
          : EMPTY_METRICS,
      [
        tasks,
      ]
    );

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="grid w-full min-w-0 max-w-full grid-cols-1 auto-rows-fr gap-4 sm:grid-cols-2 sm:gap-5">
        {Array.from({
          length: 4,
        }).map(
          (
            _,
            index
          ) => (
            <LoadingMetricCard
              key={
                index
              }
            />
          )
        )}
      </div>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full">
      {/* ERROR */}

      {error ? (
        <div className="mb-4 flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 break-words text-sm font-semibold text-red-700 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadMetrics();
            }}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* METRICS */}

      <div className="grid w-full min-w-0 max-w-full grid-cols-1 auto-rows-fr gap-4 sm:grid-cols-2 sm:gap-5">
        <MetricCard
          title="Total Projects"
          value={String(
            projectStats.totalProjects
          )}
          detail={`${projectStats.activeProjects} Active`}
          icon={
            <ProjectsIcon />
          }
          iconWrapperClassName="bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
          detailClassName="bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
          accentClassName="bg-slate-500"
        />

        <MetricCard
          title="Active Projects"
          value={String(
            projectStats.activeProjects
          )}
          detail="Current Work"
          icon={
            <ActiveProjectIcon />
          }
          iconWrapperClassName="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          detailClassName="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          accentClassName="bg-amber-500"
          pulse={
            projectStats.activeProjects >
            0
          }
        />

        <MetricCard
          title="Completed Projects"
          value={String(
            projectStats.completedProjects
          )}
          detail={`${projectStats.completedProjects} Completed`}
          icon={
            <CompletedProjectIcon />
          }
          iconWrapperClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          detailClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          accentClassName="bg-emerald-500"
        />

        <MetricCard
          title="Total Tasks"
          value={String(
            metrics.totalTasks
          )}
          detail={`${metrics.inProgressTasks} In Progress · ${metrics.completeTasks} Complete`}
          icon={
            <TaskRegisterIcon />
          }
          iconWrapperClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          detailClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          accentClassName="bg-blue-500"
        />
      </div>
    </div>
  );
}