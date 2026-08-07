import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router";

import {
  getProjectReferenceNumber,
  getProjects,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
} from "../../services/project/project.service";

/* =========================================================
   TYPES
   ========================================================= */

type StatusFilter = ProjectStatus | "";

type PriorityFilter = ProjectPriority | "";

/* =========================================================
   CONSTANTS
   ========================================================= */

const PAGE_LIMIT = 10;

const statusOptions: Array<{
  value: StatusFilter;
  label: string;
}> = [
  {
    value: "",
    label: "All Statuses",
  },
  {
    value: "draft",
    label: "Draft",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "on_hold",
    label: "On Hold",
  },
  {
    value: "awaiting_verification",
    label: "Awaiting Verification",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

const priorityOptions: Array<{
  value: PriorityFilter;
  label: string;
}> = [
  {
    value: "",
    label: "All Risk Levels",
  },
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "critical",
    label: "Critical",
  },
];

/* =========================================================
   FORMAT HELPERS
   ========================================================= */

const formatDate = (
  value?: string
): string => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
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

const formatStatus = (
  status?: ProjectStatus
): string => {
  switch (status) {
    case "draft":
      return "Draft";

    case "active":
      return "Active";

    case "on_hold":
      return "On Hold";

    case "awaiting_verification":
      return "Awaiting Verification";

    case "completed":
      return "Completed";

    case "archived":
      return "Archived";

    default:
      return "Draft";
  }
};

const formatPriority = (
  priority?: ProjectPriority
): string => {
  switch (priority) {
    case "low":
      return "Low";

    case "medium":
      return "Medium";

    case "high":
      return "High";

    case "critical":
      return "Critical";

    default:
      return "Medium";
  }
};

/* =========================================================
   STYLE HELPERS
   ========================================================= */

const getStatusClasses = (
  status?: ProjectStatus
): string => {
  switch (status) {
    case "active":
      return [
        "border-emerald-200",
        "bg-emerald-50",
        "text-emerald-700",
        "dark:border-emerald-500/20",
        "dark:bg-emerald-500/10",
        "dark:text-emerald-400",
      ].join(" ");

    case "completed":
      return [
        "border-blue-200",
        "bg-blue-50",
        "text-blue-700",
        "dark:border-blue-500/20",
        "dark:bg-blue-500/10",
        "dark:text-blue-400",
      ].join(" ");

    case "on_hold":
      return [
        "border-orange-200",
        "bg-orange-50",
        "text-orange-700",
        "dark:border-orange-500/20",
        "dark:bg-orange-500/10",
        "dark:text-orange-400",
      ].join(" ");

    case "awaiting_verification":
      return [
        "border-amber-200",
        "bg-amber-50",
        "text-amber-700",
        "dark:border-amber-500/20",
        "dark:bg-amber-500/10",
        "dark:text-amber-400",
      ].join(" ");

    case "archived":
      return [
        "border-gray-200",
        "bg-gray-100",
        "text-gray-600",
        "dark:border-gray-700",
        "dark:bg-gray-800",
        "dark:text-gray-400",
      ].join(" ");

    case "draft":
    default:
      return [
        "border-violet-200",
        "bg-violet-50",
        "text-violet-700",
        "dark:border-violet-500/20",
        "dark:bg-violet-500/10",
        "dark:text-violet-400",
      ].join(" ");
  }
};

const getPriorityDotClasses = (
  priority?: ProjectPriority
): string => {
  switch (priority) {
    case "critical":
      return "bg-red-500";

    case "high":
      return "bg-orange-500";

    case "low":
      return "bg-blue-500";

    case "medium":
    default:
      return "bg-amber-500";
  }
};

/* =========================================================
   PROJECT HELPERS
   ========================================================= */

const getProjectReference = (
  project: Project
): string => {
  const referenceNumber =
    getProjectReferenceNumber(
      project
    );

  if (referenceNumber) {
    return referenceNumber;
  }

  return `PRJ-${project._id
    .slice(-6)
    .toUpperCase()}`;
};

const getClientName = (
  project: Project
): string => {
  return (
    project.client?.company?.trim() ||
    project.client?.name?.trim() ||
    "Client not assigned"
  );
};

const getProjectLocation = (
  project: Project
): string => {
  const locationParts = [
    project.site?.name,
    project.site?.city,
    project.site?.province,
  ].filter(
    (
      value
    ): value is string =>
      Boolean(value?.trim())
  );

  if (locationParts.length > 0) {
    return locationParts.join(", ");
  }

  return (
    project.site?.location?.trim() ||
    project.location?.trim() ||
    project.siteAddress?.trim() ||
    "Location not set"
  );
};

const getProjectProgress = (
  project: Project
): number => {
  const value =
    project.progressBreakdown
      ?.overall ??
    project.progress ??
    0;

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.min(
    Math.max(
      Math.round(value),
      0
    ),
    100
  );
};

const getExpectedCompletionDate = (
  project: Project
): string | undefined => {
  return (
    project.expectedCompletionDate ||
    project.expectedEndDate
  );
};

/* =========================================================
   ICONS
   ========================================================= */

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <circle
      cx="11"
      cy="11"
      r="7"
    />

    <path d="M20 20L16.65 16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M12 5V19" />
    <path d="M5 12H19" />
  </svg>
);

const FolderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M3 7.5C3 6.7 3.7 6 4.5 6H9L11 8H19.5C20.3 8 21 8.7 21 9.5V18.5C21 19.3 20.3 20 19.5 20H4.5C3.7 20 3 19.3 3 18.5V7.5Z" />

    <path d="M3 10H21" />
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
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M5 12H19" />
    <path d="M13 6L19 12L13 18" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M20 6V11H15" />
    <path d="M4 18V13H9" />
    <path d="M18.5 9A7 7 0 0 0 6.7 6.5L4 9" />
    <path d="M5.5 15A7 7 0 0 0 17.3 17.5L20 15" />
  </svg>
);

/* =========================================================
   PROJECTS PAGE
   ========================================================= */

export default function ProjectsPage() {
  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<StatusFilter>("");

  const [
    priority,
    setPriority,
  ] =
    useState<PriorityFilter>("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    totalProjects,
    setTotalProjects,
  ] = useState(0);

  const [
    totalPages,
    setTotalPages,
  ] = useState(0);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =======================================================
     SEARCH DEBOUNCE
     ======================================================= */

  useEffect(() => {
    const timeoutId =
      window.setTimeout(
        () => {
          setSearchQuery(
            searchInput.trim()
          );

          setPage(1);
        },
        450
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [searchInput]);

  /* =======================================================
     FETCH PROJECTS
     ======================================================= */

  const fetchProjects =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setIsLoading(true);
          }

          setErrorMessage("");

          const result =
            await getProjects({
              page,

              limit:
                PAGE_LIMIT,

              search:
                searchQuery ||
                undefined,

              status:
                status ||
                undefined,

              priority:
                priority ||
                undefined,

              sortBy:
                "createdAt",

              sortOrder:
                "desc",
            });

          setProjects(
            result.projects
          );

          setTotalProjects(
            result.total
          );

          setTotalPages(
            result.totalPages
          );
        } catch (error) {
          console.error(
            "Unable to load projects:",
            error
          );

          setProjects([]);
          setTotalProjects(0);
          setTotalPages(0);

          setErrorMessage(
            "Projects load nahi ho sake. Backend server, API URL aur authentication check karein."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        page,
        priority,
        searchQuery,
        status,
      ]
    );

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  /* =======================================================
     CURRENT PAGE STATISTICS
     ======================================================= */

  const visibleStats =
    useMemo(() => {
      return {
        active:
          projects.filter(
            (project) =>
              project.status ===
              "active"
          ).length,

        completed:
          projects.filter(
            (project) =>
              project.status ===
              "completed"
          ).length,

        critical:
          projects.filter(
            (project) =>
              project.priority ===
              "critical"
          ).length,
      };
    }, [projects]);

  /* =======================================================
     FILTER HELPERS
     ======================================================= */

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatus("");
    setPriority("");
    setPage(1);
  };

  const hasFilters =
    Boolean(searchInput) ||
    Boolean(status) ||
    Boolean(priority);

  return (
    <div className="min-w-0 space-y-6">
      {/* ===================================================
          HEADER
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              Project Management
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              Project details, clients,
              schedules, tracker progress
              aur status manage karein.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void fetchProjects();
              }}
              disabled={isLoading}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5"
              aria-label="Refresh projects"
              title="Refresh projects"
            >
              <span
                className={
                  isLoading
                    ? "animate-spin"
                    : ""
                }
              >
                <RefreshIcon />
              </span>
            </button>

            <Link
              to="/projects/create"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <PlusIcon />

              Add Project
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-gray-800 sm:grid-cols-4 sm:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total Projects
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {totalProjects}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Active on Page
            </p>

            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {visibleStats.active}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Completed on Page
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {visibleStats.completed}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Critical on Page
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {visibleStats.critical}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          FILTERS
          =================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_220px_200px_auto]">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>

            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(
                  event.target.value
                );
              }}
              placeholder="Search project, reference, client or site..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent py-2.5 pl-12 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target
                  .value as StatusFilter
              );

              setPage(1);
            }}
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {statusOptions.map(
              (option) => (
                <option
                  key={
                    option.value ||
                    "all-statuses"
                  }
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <select
            value={priority}
            onChange={(event) => {
              setPriority(
                event.target
                  .value as PriorityFilter
              );

              setPage(1);
            }}
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            {priorityOptions.map(
              (option) => (
                <option
                  key={
                    option.value ||
                    "all-risk-levels"
                  }
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
          >
            Reset
          </button>
        </div>
      </section>

      {/* ===================================================
          ERROR
          =================================================== */}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => {
              void fetchProjects();
            }}
            className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-4 dark:text-red-400"
          >
            Try again
          </button>
        </section>
      ) : null}

      {/* ===================================================
          PROJECT LIST
          =================================================== */}

      {!errorMessage ? (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({
                length: 5,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
                  />
                )
              )}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <FolderIcon />
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">
                No projects found
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                {hasFilters
                  ? "Current filters ke mutabiq koi project nahi mila. Filters reset karke dobara check karein."
                  : "Abhi koi project create nahi hua. Apna pehla project add karein."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-500 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                >
                  Reset Filters
                </button>
              ) : (
                <Link
                  to="/projects/create"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <PlusIcon />

                  Create Project
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* =============================================
                  DESKTOP TABLE
                  ============================================= */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/70 text-left dark:border-gray-800 dark:bg-white/[0.02]">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Project
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Client
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Risk Level
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Progress
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Completion
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {projects.map(
                      (project) => {
                        const progress =
                          getProjectProgress(
                            project
                          );

                        return (
                          <tr
                            key={project._id}
                            className="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                  <FolderIcon />
                                </div>

                                <div className="min-w-0">
                                  <Link
                                    to={`/projects/${project._id}`}
                                    className="block max-w-[260px] truncate text-sm font-semibold text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                                  >
                                    {project.title}
                                  </Link>

                                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {getProjectReference(
                                      project
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="max-w-[190px] truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                                {getClientName(
                                  project
                                )}
                              </p>

                              <p className="mt-1 max-w-[190px] truncate text-xs text-gray-400">
                                {getProjectLocation(
                                  project
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                  project.status
                                )}`}
                              >
                                {formatStatus(
                                  project.status
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${getPriorityDotClasses(
                                    project.priority
                                  )}`}
                                />

                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {formatPriority(
                                    project.priority
                                  )}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="w-[130px]">
                                <div className="mb-1.5 flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-500">
                                    Overall
                                  </span>

                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {progress}%
                                  </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                  <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{
                                      width:
                                        `${progress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatDate(
                                  getExpectedCompletionDate(
                                    project
                                  )
                                )}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                to={`/projects/${project._id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                              >
                                View

                                <ArrowIcon />
                              </Link>
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
                {projects.map(
                  (project) => {
                    const progress =
                      getProjectProgress(
                        project
                      );

                    return (
                      <article
                        key={project._id}
                        className="p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <FolderIcon />
                          </div>

                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/projects/${project._id}`}
                              className="block truncate text-sm font-semibold text-gray-900 dark:text-white"
                            >
                              {project.title}
                            </Link>

                            <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              {getProjectReference(
                                project
                              )}
                            </p>
                          </div>

                          <Link
                            to={`/projects/${project._id}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                            aria-label={`View ${project.title}`}
                          >
                            <ArrowIcon />
                          </Link>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">
                              Client
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                              {getClientName(
                                project
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">
                              Completion
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {formatDate(
                                getExpectedCompletionDate(
                                  project
                                )
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 truncate text-xs text-gray-400">
                          {getProjectLocation(
                            project
                          )}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              project.status
                            )}`}
                          >
                            {formatStatus(
                              project.status
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            <span
                              className={`h-2 w-2 rounded-full ${getPriorityDotClasses(
                                project.priority
                              )}`}
                            />

                            {formatPriority(
                              project.priority
                            )}
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              Overall Progress
                            </span>

                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {progress}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{
                                width:
                                  `${progress}%`,
                              }}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>

              {/* =============================================
                  PAGINATION
                  ============================================= */}

              <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page{" "}

                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {page}
                  </span>

                  {" "}of{" "}

                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {Math.max(
                      totalPages,
                      1
                    )}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPage(
                        (
                          currentPage
                        ) =>
                          Math.max(
                            currentPage -
                              1,
                            1
                          )
                      );
                    }}
                    disabled={
                      page <= 1 ||
                      isLoading
                    }
                    className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPage(
                        (
                          currentPage
                        ) =>
                          Math.min(
                            currentPage +
                              1,
                            Math.max(
                              totalPages,
                              1
                            )
                          )
                      );
                    }}
                    disabled={
                      page >=
                        totalPages ||
                      isLoading ||
                      totalPages === 0
                    }
                    className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}