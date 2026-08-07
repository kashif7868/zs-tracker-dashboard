import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router";

import {
  getActiveProjects,
  getProjectDisplayName,
  getProjectReferenceNumber,
  type Project,
} from "../../services/project/project.service";

import {
  deleteRisk,
  getRiskDashboardSummary,
  getRiskProjectReference,
  getRisks,
  type Risk,
  type RiskDashboardSummary,
  type RiskStatus,
} from "../../services/risk/risk.service";

/* =========================================================
   TYPES
   ========================================================= */

type StatusFilter =
  | "all"
  | RiskStatus;

/* =========================================================
   CONSTANTS
   ========================================================= */

const PAGE_LIMIT = 20;

const EMPTY_SUMMARY: RiskDashboardSummary = {
  totalRisks: 0,
  inProgressRisks: 0,
  completeRisks: 0,
  completionPercentage: 0,
};

const STATUS_LABELS: Record<
  RiskStatus,
  string
> = {
  in_progress: "In Progress",
  complete: "Complete",
};

const INPUT_CLASSES =
  "h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10";

/* =========================================================
   ICONS
   ========================================================= */

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

const ProgressIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
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
    className="size-4"
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

const ViewIcon = () => (
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
    <path d="M2.5 12S6 6.5 12 6.5S21.5 12 21.5 12S18 17.5 12 17.5S2.5 12 2.5 12Z" />

    <circle
      cx="12"
      cy="12"
      r="2.5"
    />
  </svg>
);

const EditIcon = () => (
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
    <path d="M12 20H5A1 1 0 0 1 4 19V12" />

    <path d="M16.5 3.5A2.12 2.12 0 0 1 19.5 6.5L10 16L6 17L7 13L16.5 3.5Z" />
  </svg>
);

const DeleteIcon = () => (
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
    <path d="M4 7H20" />
    <path d="M9 7V4H15V7" />
    <path d="M7 7L8 20H16L17 7" />
    <path d="M10 11V16" />
    <path d="M14 11V16" />
  </svg>
);

const ImageIcon = () => (
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
    const requestError = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;

          errors?: Array<{
            message?: string;
            msg?: string;
          }>;
        };
      };
    };

    return (
      requestError.response?.data
        ?.errors?.[0]?.message ||
      requestError.response?.data
        ?.errors?.[0]?.msg ||
      requestError.response?.data
        ?.message ||
      requestError.response?.data
        ?.error ||
      "Request could not be completed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request could not be completed.";
};

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

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

const getRiskDisplayTitle = (
  risk: Risk
): string => {
  return (
    risk.riskRegisterId?.trim() ||
    `Risk #${risk.serialNo}`
  );
};

/* =========================================================
   STATUS BADGE
   ========================================================= */

function RiskStatusBadge({
  status,
}: {
  status: RiskStatus;
}) {
  if (
    status === "complete"
  ) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CompleteIcon />
        </span>

        Complete
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
      <span className="relative flex size-5 items-center justify-center">
        <span className="absolute size-5 animate-ping rounded-full bg-amber-400 opacity-25" />

        <span className="relative flex size-5 items-center justify-center rounded-full bg-amber-500 text-white">
          <ProgressIcon />
        </span>
      </span>

      In Progress
    </span>
  );
}

/* =========================================================
   EVIDENCE COUNT
   ========================================================= */

function EvidenceCount({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <div className="inline-flex min-w-[76px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
      <ImageIcon />

      <span className="text-sm font-bold text-gray-900 dark:text-white">
        {count}
      </span>

      <span className="sr-only">
        {label}
      </span>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

type SummaryCardProps = {
  title: string;
  value: number | string;
  description: string;
  accentClassName: string;
  pulse?: boolean;
};

function SummaryCard({
  title,
  value,
  description,
  accentClassName,
  pulse = false,
}: SummaryCardProps) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`}
      />

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {title}
        </p>

        {pulse ? (
          <span className="relative mt-1 flex size-3">
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full opacity-30 ${accentClassName}`}
            />

            <span
              className={`relative inline-flex size-3 rounded-full ${accentClassName}`}
            />
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </article>
  );
}

/* =========================================================
   LOADING TABLE
   ========================================================= */

function LoadingTable() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function RisksPage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const requestedProjectId =
    searchParams
      .get("projectId")
      ?.trim() || "";

  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState(
    requestedProjectId
  );

  const [
    risks,
    setRisks,
  ] = useState<Risk[]>([]);

  const [
    summary,
    setSummary,
  ] =
    useState<RiskDashboardSummary>(
      EMPTY_SUMMARY
    );

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all"
    );

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    totalRecords,
    setTotalRecords,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    deletingRiskId,
    setDeletingRiskId,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     SYNC PROJECT QUERY
     ======================================================= */

  useEffect(() => {
    if (
      requestedProjectId !==
      selectedProjectId
    ) {
      setSelectedProjectId(
        requestedProjectId
      );

      setPage(1);
    }
  }, [
    requestedProjectId,
    selectedProjectId,
  ]);

  /* =======================================================
     LOAD ACTIVE PROJECTS
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProjects =
      async () => {
        try {
          const result =
            await getActiveProjects();

          if (cancelled) {
            return;
          }

          setProjects(result);

          if (
            !requestedProjectId &&
            result.length === 1
          ) {
            const onlyProjectId =
              result[0]._id;

            setSelectedProjectId(
              onlyProjectId
            );

            setSearchParams(
              {
                projectId:
                  onlyProjectId,
              },
              {
                replace: true,
              }
            );
          }
        } catch (requestError) {
          if (!cancelled) {
            setError(
              getErrorMessage(
                requestError
              )
            );
          }
        }
      };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [
    requestedProjectId,
    setSearchParams,
  ]);

  /* =======================================================
     LOAD RISK REGISTER
     ======================================================= */

  const loadRiskRegister =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        try {
          if (
            showRefreshLoader
          ) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const [
            risksResult,
            summaryResult,
          ] =
            await Promise.allSettled([
              getRisks({
                ...(selectedProjectId
                  ? {
                      projectId:
                        selectedProjectId,
                    }
                  : {}),

                ...(statusFilter !==
                "all"
                  ? {
                      status:
                        statusFilter,
                    }
                  : {}),

                ...(appliedSearch
                  ? {
                      search:
                        appliedSearch,
                    }
                  : {}),

                page,
                limit: PAGE_LIMIT,
                sortBy: "serialNo",
                sortOrder: "asc",
              }),

              getRiskDashboardSummary(
                selectedProjectId ||
                  undefined
              ),
            ]);

          if (
            risksResult.status ===
            "rejected"
          ) {
            throw risksResult.reason;
          }

          const result =
            risksResult.value;

          setRisks(
            result.risks
          );

          setTotalPages(
            result.pagination
              .totalPages
          );

          setTotalRecords(
            result.pagination.total
          );

          if (
            summaryResult.status ===
            "fulfilled"
          ) {
            setSummary(
              summaryResult.value
            );
          } else {
            setSummary(
              EMPTY_SUMMARY
            );
          }
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError
            )
          );

          setRisks([]);
          setTotalPages(1);
          setTotalRecords(0);
          setSummary(
            EMPTY_SUMMARY
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        selectedProjectId,
        statusFilter,
        appliedSearch,
        page,
      ]
    );

  useEffect(() => {
    void loadRiskRegister();
  }, [loadRiskRegister]);

  /* =======================================================
     SELECTED PROJECT
     ======================================================= */

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (project) =>
            project._id ===
            selectedProjectId
        ),
      [
        projects,
        selectedProjectId,
      ]
    );

  const selectedProjectReference =
    useMemo(
      () =>
        selectedProject
          ? getProjectReferenceNumber(
              selectedProject
            )
          : "",
      [selectedProject]
    );

  const createRiskPath =
    selectedProjectId
      ? `/risks/create?projectId=${encodeURIComponent(
          selectedProjectId
        )}`
      : "/risks/create";

  /* =======================================================
     PROJECT FILTER
     ======================================================= */

  const handleProjectFilterChange = (
    projectId: string
  ) => {
    setSelectedProjectId(
      projectId
    );

    setPage(1);

    const nextSearchParams =
      new URLSearchParams(
        searchParams
      );

    if (projectId) {
      nextSearchParams.set(
        "projectId",
        projectId
      );
    } else {
      nextSearchParams.delete(
        "projectId"
      );
    }

    setSearchParams(
      nextSearchParams,
      {
        replace: true,
      }
    );
  };

  /* =======================================================
     SEARCH
     ======================================================= */

  const handleSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPage(1);

    setAppliedSearch(
      searchInput.trim()
    );
  };

  const handleReset = () => {
    setSearchInput("");
    setAppliedSearch("");
    setSelectedProjectId("");
    setStatusFilter("all");
    setPage(1);

    const nextSearchParams =
      new URLSearchParams(
        searchParams
      );

    nextSearchParams.delete(
      "projectId"
    );

    setSearchParams(
      nextSearchParams,
      {
        replace: true,
      }
    );
  };

  /* =======================================================
     DELETE RISK
     ======================================================= */

  const handleDeleteRisk =
    async (
      risk: Risk
    ) => {
      const riskTitle =
        getRiskDisplayTitle(
          risk
        );

      const confirmed =
        window.confirm(
          `Delete ${riskTitle}?\n\nRisk record, Before Evidence, After Evidence and related image files will be permanently deleted.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingRiskId(
          risk._id
        );

        setError("");

        await deleteRisk(
          risk._id
        );

        if (
          risks.length === 1 &&
          page > 1
        ) {
          setPage(
            (currentPage) =>
              Math.max(
                currentPage - 1,
                1
              )
          );

          return;
        }

        await loadRiskRegister(
          true
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setDeletingRiskId(
          ""
        );
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="w-full min-w-0 space-y-5 p-4 sm:p-5 xl:p-6">
        {/* =================================================
            HEADER
            ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Electrical Safety Management
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Risk Register
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Project risks, Before
                Evidence, After Evidence
                aur completion status
                manage karein.
              </p>

              {selectedProject ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="text-gray-600 dark:text-gray-300">
                    Selected Project:
                  </span>

                  <span className="text-emerald-700 dark:text-emerald-400">
                    {getProjectDisplayName(
                      selectedProject
                    )}
                  </span>

                  {selectedProjectReference ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {
                        selectedProjectReference
                      }
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                disabled={refreshing}
                onClick={() => {
                  void loadRiskRegister(
                    true
                  );
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
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

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <Link
                to={createRiskPath}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Create Risk
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        ) : null}

        {/* =================================================
            SUMMARY
            ================================================= */}

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Risks"
            value={
              summary.totalRisks
            }
            description="Total Risk Register records"
            accentClassName="bg-slate-500"
          />

          <SummaryCard
            title="In Progress"
            value={
              summary.inProgressRisks
            }
            description="Active rectification work"
            accentClassName="bg-amber-500"
            pulse={
              summary.inProgressRisks >
              0
            }
          />

          <SummaryCard
            title="Complete"
            value={
              summary.completeRisks
            }
            description="Before and After Evidence completed"
            accentClassName="bg-emerald-500"
          />

          <SummaryCard
            title="Completion"
            value={`${summary.completionPercentage}%`}
            description="Overall completed risk percentage"
            accentClassName="bg-blue-500"
          />
        </section>

        {/* =================================================
            FILTERS
            ================================================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <form
            onSubmit={handleSearch}
            className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_minmax(220px,280px)_minmax(180px,220px)_auto]"
          >
            <div className="min-w-0">
              <label
                htmlFor="risk-search"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Search
              </label>

              <input
                id="risk-search"
                type="search"
                value={
                  searchInput
                }
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Sr. No., Risk ID, Project Reference or description..."
                className={
                  INPUT_CLASSES
                }
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="project-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Project
              </label>

              <select
                id="project-filter"
                value={
                  selectedProjectId
                }
                onChange={(event) =>
                  handleProjectFilterChange(
                    event.target.value
                  )
                }
                className={
                  INPUT_CLASSES
                }
              >
                <option value="">
                  All Projects
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project._id
                      }
                      value={
                        project._id
                      }
                    >
                      {getProjectDisplayName(
                        project
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="status-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={
                  statusFilter
                }
                onChange={(event) => {
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  );

                  setPage(1);
                }}
                className={
                  INPUT_CLASSES
                }
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
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              >
                Search
              </button>

              <button
                type="button"
                onClick={
                  handleReset
                }
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* =================================================
            RISK TABLE
            ================================================= */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Risk Register Records
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {totalRecords} record
                {totalRecords === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <span className="size-2 animate-pulse rounded-full bg-amber-500" />

                In Progress
              </span>

              <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" />

                Complete
              </span>
            </div>
          </div>

          {loading ? (
            <LoadingTable />
          ) : risks.length === 0 ? (
            <div className="px-5 py-14 text-center sm:px-6">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800">
                0
              </div>

              <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                No risk records found
              </h3>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Current project, search
                ya status filter ke
                mutabiq koi record nahi
                mila.
              </p>

              <Link
                to={createRiskPath}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Create Risk
              </Link>
            </div>
          ) : (
            <>
              {/* =============================================
                  DESKTOP TABLE
                  ============================================= */}

              <div className="hidden w-full min-w-0 overflow-x-auto lg:block">
                <table className="w-full min-w-[1320px] border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-950/50">
                    <tr>
                      <th className="w-24 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        Sr. No.
                      </th>

                      <th className="w-44 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        Risk Register ID
                      </th>

                      <th className="w-48 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        Project Reference
                      </th>

                      <th className="min-w-[380px] px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        Description
                      </th>

                      <th className="w-24 px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        Before
                      </th>

                      <th className="w-24 px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        After
                      </th>

                      <th className="w-44 px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        Status
                      </th>

                      <th className="w-44 px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {risks.map(
                      (risk) => {
                        const beforeCount =
                          risk.evidenceSummary
                            ?.beforeCount ??
                          0;

                        const afterCount =
                          risk.evidenceSummary
                            ?.afterCount ??
                          0;

                        const deleting =
                          deletingRiskId ===
                          risk._id;

                        const projectReference =
                          getRiskProjectReference(
                            risk
                          );

                        return (
                          <tr
                            key={
                              risk._id
                            }
                            className={`transition ${
                              risk.status ===
                              "complete"
                                ? "bg-emerald-50/20 hover:bg-emerald-50/50 dark:bg-emerald-950/5 dark:hover:bg-emerald-950/15"
                                : "hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
                            }`}
                          >
                            <td className="px-4 py-5 align-top">
                              <span className="inline-flex min-w-12 items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {
                                  risk.serialNo
                                }
                              </span>
                            </td>

                            <td className="px-4 py-5 align-top">
                              <Link
                                to={`/risks/${risk._id}`}
                                className="text-sm font-bold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400"
                              >
                                {risk.riskRegisterId ||
                                  `Risk #${risk.serialNo}`}
                              </Link>

                              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                {risk.riskRegisterId
                                  ? "Optional project reference"
                                  : "No ID assigned"}
                              </p>

                              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                {formatDate(
                                  risk.createdAt
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-5 align-top">
                              <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                {projectReference ||
                                  "—"}
                              </span>
                            </td>

                            <td className="min-w-0 px-4 py-5 align-top">
                              <Link
                                to={`/risks/${risk._id}`}
                                className="line-clamp-4 text-sm font-semibold leading-6 text-gray-900 transition hover:text-emerald-600 dark:text-white"
                              >
                                {
                                  risk.description
                                }
                              </Link>
                            </td>

                            <td className="px-4 py-5 text-center align-top">
                              <EvidenceCount
                                count={
                                  beforeCount
                                }
                                label="Before Evidence"
                              />
                            </td>

                            <td className="px-4 py-5 text-center align-top">
                              <EvidenceCount
                                count={
                                  afterCount
                                }
                                label="After Evidence"
                              />
                            </td>

                            <td className="px-4 py-5 text-center align-top">
                              <RiskStatusBadge
                                status={
                                  risk.status
                                }
                              />
                            </td>

                            <td className="px-4 py-5 align-top">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  to={`/risks/${risk._id}`}
                                  title="View Risk"
                                  className="inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-900 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                                >
                                  <ViewIcon />
                                </Link>

                                <Link
                                  to={`/risks/${risk._id}?mode=update`}
                                  title="Update Risk"
                                  className="inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-amber-900 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                                >
                                  <EditIcon />
                                </Link>

                                <button
                                  type="button"
                                  title="Delete Risk"
                                  disabled={
                                    deleting
                                  }
                                  onClick={() => {
                                    void handleDeleteRisk(
                                      risk
                                    );
                                  }}
                                  className="inline-flex size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                >
                                  <span
                                    className={
                                      deleting
                                        ? "animate-pulse"
                                        : ""
                                    }
                                  >
                                    <DeleteIcon />
                                  </span>
                                </button>
                              </div>

                              <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                {
                                  STATUS_LABELS[
                                    risk.status
                                  ]
                                }
                              </p>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* =============================================
                  MOBILE CARDS
                  ============================================= */}

              <div className="divide-y divide-gray-200 dark:divide-gray-800 lg:hidden">
                {risks.map(
                  (risk) => {
                    const beforeCount =
                      risk.evidenceSummary
                        ?.beforeCount ??
                      0;

                    const afterCount =
                      risk.evidenceSummary
                        ?.afterCount ??
                      0;

                    const deleting =
                      deletingRiskId ===
                      risk._id;

                    return (
                      <article
                        key={
                          risk._id
                        }
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                Sr. No.{" "}
                                {
                                  risk.serialNo
                                }
                              </span>

                              <RiskStatusBadge
                                status={
                                  risk.status
                                }
                              />
                            </div>

                            <Link
                              to={`/risks/${risk._id}`}
                              className="mt-3 block text-base font-bold text-gray-900 dark:text-white"
                            >
                              {getRiskDisplayTitle(
                                risk
                              )}
                            </Link>

                            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {getRiskProjectReference(
                                risk
                              ) ||
                                "Reference unavailable"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-5 text-sm leading-6 text-gray-700 dark:text-gray-300">
                          {
                            risk.description
                          }
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <EvidenceCount
                            count={
                              beforeCount
                            }
                            label="Before Evidence"
                          />

                          <EvidenceCount
                            count={
                              afterCount
                            }
                            label="After Evidence"
                          />

                          <span className="text-xs text-gray-400">
                            {formatDate(
                              risk.createdAt
                            )}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                          <Link
                            to={`/risks/${risk._id}`}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                          >
                            <ViewIcon />

                            View
                          </Link>

                          <Link
                            to={`/risks/${risk._id}?mode=update`}
                            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-sm font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
                          >
                            <EditIcon />

                            Update
                          </Link>

                          <button
                            type="button"
                            disabled={
                              deleting
                            }
                            onClick={() => {
                              void handleDeleteRisk(
                                risk
                              );
                            }}
                            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                            aria-label="Delete Risk"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

          {/* =================================================
              PAGINATION
              ================================================= */}

          {!loading &&
          totalRecords > 0 ? (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page{" "}

                <span className="font-bold text-gray-900 dark:text-white">
                  {page}
                </span>

                {" "}of{" "}

                <span className="font-bold text-gray-900 dark:text-white">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    page <= 1 ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (
                        currentPage
                      ) =>
                        Math.max(
                          currentPage -
                            1,
                          1
                        )
                    )
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                      totalPages ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (
                        currentPage
                      ) =>
                        Math.min(
                          currentPage +
                            1,
                          totalPages
                        )
                    )
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}