import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import PageMeta from "../../components/common/PageMeta";

import ProjectCompletionCard from "../../components/Tracker/ProjectCompletionCard";
import ProjectTrackerMetrics from "../../components/Tracker/ProjectTrackerMetrics";
import TaskCategoryCard from "../../components/Tracker/TaskCategoryCard";
import RecentTasks from "../../components/Tracker/RecentTasks";
import TaskWorkActivityChart from "../../components/Tracker/TaskWorkActivityChart";
import TaskResolutionChart from "../../components/Tracker/TaskResolutionChart";

import {
  getDocuments,
  getDocumentFormatLabel,
  getDocumentProjectReference,
  getDocumentStatusLabel,
  type ProjectDocumentRecord,
} from "../../services/documents/document.service";

/* =========================================================
   TYPES
   ========================================================= */

type DocumentDashboardData = {
  total: number;
  completed: number;
  generating: number;
  failed: number;
  recent: ProjectDocumentRecord[];
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_DOCUMENT_DATA: DocumentDashboardData = {
  total: 0,
  completed: 0,
  generating: 0,
  failed: 0,
  recent: [],
};

/* =========================================================
   HELPERS
   ========================================================= */

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
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

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
      "Document summary could not be loaded."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Document summary could not be loaded.";
};

/* =========================================================
   ICONS
   ========================================================= */

const DocumentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-5"
    aria-hidden="true"
  >
    <path d="M6 2H14L19 7V22H6Z" />

    <path d="M14 2V7H19" />

    <path d="M9 12H16" />

    <path d="M9 16H16" />
  </svg>
);

const ArrowIcon = () => (
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
    <path d="M5 12H19" />

    <path d="M14 7L19 12L14 17" />
  </svg>
);

/* =========================================================
   DASHBOARD
   ========================================================= */

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | Project Tracker"
        description="Project Tracker dashboard for project tasks, Before/After Evidence, completion progress and generated reports."
      />

      <div className="w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="w-full min-w-0 max-w-full space-y-5 sm:space-y-6">
          {/* =================================================
              DASHBOARD HEADER
              ================================================= */}

          <section className="relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-emerald-500" />

            <div className="px-5 py-5 sm:px-6">
              <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between">
                {/* LEFT */}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      Zorays Solar
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" />

                      Live Dashboard
                    </span>
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[28px]">
                    Project Tracker
                  </h1>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Project tasks, Before/After Evidence, completion progress
                    and project reporting in one live workspace.
                  </p>
                </div>

                {/* RIGHT */}

                <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:w-auto">
                  <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Module
                    </p>

                    <p className="mt-0.5 truncate text-xs font-bold text-gray-800 dark:text-white">
                      Task Register
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Evidence
                    </p>

                    <p className="mt-0.5 truncate text-xs font-bold text-gray-800 dark:text-white">
                      Before & After
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              PRIMARY OVERVIEW
              ================================================= */}

          <section className="grid w-full min-w-0 max-w-full grid-cols-1 items-stretch gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:gap-6">
            {/* KPI CARDS */}

            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <ProjectTrackerMetrics />
            </div>

            {/* PROJECT COMPLETION */}

            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <ProjectCompletionCard />
            </div>
          </section>
          {/* =================================================
              TASK RESOLUTION STATISTICS
              ================================================= */}

          <section className="w-full min-w-0 max-w-full overflow-hidden">
            <TaskResolutionChart />
          </section>

          {/* =================================================
              DOCUMENTS & REPORTS
              ================================================= */}

          <section className="w-full min-w-0 max-w-full overflow-hidden">
            <DocumentsDashboardCard />
          </section>

          {/* =================================================
              BOTTOM DASHBOARD
              ================================================= */}

          <section className="grid w-full min-w-0 max-w-full grid-cols-1 items-stretch gap-4 sm:gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] xl:gap-6">
            {/* TASK WORKFLOW */}

            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <TaskCategoryCard />
            </div>

            {/* RECENT TASKS */}

            <div className="w-full min-w-0 max-w-full overflow-hidden">
              <RecentTasks />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   DOCUMENTS DASHBOARD CARD
   ========================================================= */

function DocumentsDashboardCard() {
  const [
    data,
    setData,
  ] =
    useState<DocumentDashboardData>(
      EMPTY_DOCUMENT_DATA
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

  /* =======================================================
     LOAD DOCUMENT DASHBOARD DATA
     ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const loadData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            recentResult,
            completedResult,
            generatingResult,
            failedResult,
          ] =
            await Promise.all([
              getDocuments({
                page: 1,
                limit: 4,
                sortBy:
                  "createdAt",
                sortOrder:
                  "desc",
              }),

              getDocuments({
                status:
                  "completed",
                page: 1,
                limit: 1,
              }),

              getDocuments({
                status:
                  "generating",
                page: 1,
                limit: 1,
              }),

              getDocuments({
                status:
                  "failed",
                page: 1,
                limit: 1,
              }),
            ]);

          if (cancelled) {
            return;
          }

          setData({
            total:
              recentResult
                .pagination
                .total,

            completed:
              completedResult
                .pagination
                .total,

            generating:
              generatingResult
                .pagination
                .total,

            failed:
              failedResult
                .pagination
                .total,

            recent:
              recentResult
                .documents,
          });
        } catch (
          requestError
        ) {
          if (
            cancelled
          ) {
            return;
          }

          setData(
            EMPTY_DOCUMENT_DATA
          );

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      };

    void loadData();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-emerald-500" />

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <DocumentIcon />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Project Reporting
              </p>

              <h2 className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
                Documents & Reports
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Generated project report activity and recent exports.
              </p>
            </div>
          </div>

          <Link
            to="/documents"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-emerald-900 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 sm:w-auto"
          >
            Open Documents

            <ArrowIcon />
          </Link>
        </div>
      </div>

      {/* ===================================================
          CONTENT
          =================================================== */}

      {loading ? (
        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({
              length: 4,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
                />
              )
            )}
          </div>

          <div className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : error ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          {/* =================================================
              SUMMARY
              ================================================= */}

          <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <DocumentMetric
              label="Total Reports"
              value={
                data.total
              }
            />

            <DocumentMetric
              label="Completed"
              value={
                data.completed
              }
              state="completed"
            />

            <DocumentMetric
              label="Generating"
              value={
                data.generating
              }
              state="generating"
            />

            <DocumentMetric
              label="Failed"
              value={
                data.failed
              }
              state="failed"
            />
          </div>

          {/* =================================================
              RECENT REPORTS
              ================================================= */}

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Recent Reports
              </h3>

              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Latest 4
              </p>
            </div>

            {data.recent.length ===
            0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No generated reports yet.
                </p>

                <Link
                  to="/documents"
                  className="mt-2 inline-flex text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  Generate your first report
                </Link>
              </div>
            ) : (
              <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
                {data.recent.map(
                  (
                    document
                  ) => (
                    <RecentDocumentCard
                      key={
                        document._id
                      }
                      document={
                        document
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DOCUMENT METRIC
   ========================================================= */

function DocumentMetric({
  label,
  value,
  state = "default",
}: {
  label: string;
  value: number;
  state?:
    | "default"
    | "completed"
    | "generating"
    | "failed";
}) {
  const valueClass =
    state ===
    "completed"
      ? "text-emerald-600 dark:text-emerald-400"
      : state ===
          "generating"
        ? "text-amber-600 dark:text-amber-400"
        : state ===
            "failed"
          ? "text-red-600 dark:text-red-400"
          : "text-gray-900 dark:text-white";

  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/30">
      <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   RECENT DOCUMENT CARD
   ========================================================= */

function RecentDocumentCard({
  document,
}: {
  document: ProjectDocumentRecord;
}) {
  const statusClass =
    document.status ===
    "completed"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : document.status ===
          "failed"
        ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const projectReference =
    getDocumentProjectReference(
      document
    );

  return (
    <article className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-gray-950/20">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[9px] font-bold uppercase text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {getDocumentFormatLabel(
            document.format
          )}
        </span>

        <span
          className={`inline-flex shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${statusClass}`}
        >
          {getDocumentStatusLabel(
            document.status
          )}
        </span>
      </div>

      <h4 className="mt-3 line-clamp-2 break-words text-sm font-semibold text-gray-900 dark:text-white">
        {document.title ||
          "Untitled Report"}
      </h4>

      <p className="mt-2 truncate text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        {projectReference ||
          document.projectTitle ||
          "Project Reference unavailable"}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-[10px] text-gray-400 dark:border-gray-800">
        <span>
          {
            document.summary
              .totalRisks
          }{" "}
          Tasks
        </span>

        <span>
          {formatDate(
            document.generatedAt ||
              document.createdAt
          )}
        </span>
      </div>
    </article>
  );
}