import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isAxiosError } from "axios";

import {
  Link,
  useLocation,
  useParams,
} from "react-router";

import {
  archiveProject,
  createProjectClientAccess,
  getProjectById,
  getProjectReferenceNumber,
  revokeProjectClientAccess,
  type OverallRiskLevel,
  type Project,
  type ProjectProgress,
  type ProjectStatus,
  type ProjectType,
} from "../../services/project/project.service";

/* =========================================================
   TYPES
   ========================================================= */

type LocationState = {
  successMessage?: string;
};

type ActionLoading =
  | "archive"
  | "generate-access"
  | "revoke-access"
  | null;

type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

type ProgressCardProps = {
  label: string;
  value: number;
  description: string;
};

type SummaryCardProps = {
  label: string;
  value: number;
  description: string;
  tone:
    | "gray"
    | "blue"
    | "red"
    | "orange"
    | "amber"
    | "emerald";
};

type StatusProgressProps = {
  label: string;
  value: number;
  total: number;
  barClassName: string;
};

/* =========================================================
   DEFAULT VALUES
   ========================================================= */

const EMPTY_PROGRESS: ProjectProgress = {
  overall: 0,
  rectification: 0,
  evidence: 0,
  testing: 0,
  actionPlan: 0,
};

/* =========================================================
   FORMAT HELPERS
   ========================================================= */

const formatDate = (
  value?: string | null
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

const formatDateTime = (
  value?: string | null
): string => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

const formatProjectType = (
  projectType?: ProjectType
): string => {
  switch (projectType) {
    case "electrical_audit":
      return "Electrical Audit";

    case "energy_audit":
      return "Energy Audit";

    case "risk_rectification":
      return "Risk Rectification";

    case "solar_installation":
      return "Solar Installation";

    case "testing_commissioning":
      return "Testing & Commissioning";

    case "other":
      return "Other";

    default:
      return "Risk Rectification";
  }
};

const formatRiskLevel = (
  riskLevel?: OverallRiskLevel
): string => {
  switch (riskLevel) {
    case "low":
      return "Low";

    case "medium":
      return "Medium";

    case "high":
      return "High";

    case "critical":
      return "Critical";

    case "high_to_critical":
      return "High to Critical";

    default:
      return "Not Assessed";
  }
};

const clampPercentage = (
  value?: number
): number => {
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

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

const getProjectReference = (
  project: Project
): string => {
  const reference =
    getProjectReferenceNumber(
      project
    );

  if (reference) {
    return reference;
  }

  return `PRJ-${project._id
    .slice(-6)
    .toUpperCase()}`;
};

const getProjectLeadName = (
  project: Project
): string => {
  if (
    project.projectLead &&
    typeof project.projectLead ===
      "object"
  ) {
    return (
      project.projectLead.name ||
      project.projectLead.email ||
      "Not assigned"
    );
  }

  return project.projectLead
    ? String(project.projectLead)
    : "Not assigned";
};

const getCreatedByName = (
  project: Project
): string => {
  return (
    project.createdBy?.name ||
    project.createdBy?.email ||
    "Not available"
  );
};

const getErrorMessage = (
  error: unknown
): string => {
  if (isAxiosError(error)) {
    const responseData =
      error.response?.data;

    if (
      typeof responseData ===
        "object" &&
      responseData !== null
    ) {
      const data =
        responseData as {
          message?: unknown;
          error?: unknown;
        };

      if (
        typeof data.message ===
        "string"
      ) {
        return data.message;
      }

      if (
        typeof data.error ===
        "string"
      ) {
        return data.error;
      }
    }

    if (
      error.code ===
      "ERR_NETWORK"
    ) {
      return "Backend server se connection nahi ho saka.";
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Project details load nahi ho sake.";
};

const copyText = async (
  value: string
): Promise<void> => {
  if (
    navigator.clipboard?.writeText
  ) {
    await navigator.clipboard.writeText(
      value
    );

    return;
  }

  const textarea =
    document.createElement(
      "textarea"
    );

  textarea.value = value;
  textarea.style.position =
    "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(
    textarea
  );

  textarea.focus();
  textarea.select();

  document.execCommand(
    "copy"
  );

  document.body.removeChild(
    textarea
  );
};

/* =========================================================
   STYLE HELPERS
   ========================================================= */

const getStatusClasses = (
  status?: ProjectStatus
): string => {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "completed":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";

    case "on_hold":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400";

    case "awaiting_verification":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";

    case "archived":
      return "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";

    case "draft":
    default:
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400";
  }
};

const getRiskLevelClasses = (
  riskLevel?: OverallRiskLevel
): string => {
  switch (riskLevel) {
    case "critical":
    case "high_to_critical":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400";

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400";

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400";

    case "low":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400";

    default:
      return "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
};

/* =========================================================
   UI COMPONENTS
   ========================================================= */

function InfoRow({
  label,
  value,
}: InfoRowProps) {
  const displayValue =
    value === undefined ||
    value === null ||
    value === ""
      ? "Not provided"
      : String(value);

  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <span className="break-words text-sm font-medium text-gray-800 dark:text-gray-200 sm:max-w-[62%] sm:text-right">
        {displayValue}
      </span>
    </div>
  );
}

function CardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      {description ? (
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ProgressCard({
  label,
  value,
  description,
}: ProgressCardProps) {
  const percentage =
    clampPercentage(value);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </p>

        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {percentage}%
        </span>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  tone,
}: SummaryCardProps) {
  const toneClasses = {
    gray:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",

    blue:
      "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",

    red:
      "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",

    orange:
      "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",

    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div
        className={`inline-flex min-w-12 items-center justify-center rounded-xl px-3 py-2 text-lg font-bold ${toneClasses[tone]}`}
      >
        {value}
      </div>

      <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
        {label}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function StatusProgress({
  label,
  value,
  total,
  barClassName,
}: StatusProgressProps) {
  const percentage =
    total > 0
      ? Math.min(
          Math.round(
            (value / total) *
              100
          ),
          100
        )
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>

        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  to,
  disabled = false,
}: {
  title: string;
  description: string;
  to?: string;
  disabled?: boolean;
}) {
  const content: ReactNode = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </p>

        {disabled ? (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Coming Soon
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </>
  );

  if (
    disabled ||
    !to
  ) {
    return (
      <div className="cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-50 p-5 opacity-70 dark:border-gray-800 dark:bg-gray-900">
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-700"
    >
      {content}
    </Link>
  );
}

/* =========================================================
   ICONS
   ========================================================= */

const BackIcon = () => (
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
    <path d="M19 12H5" />
    <path d="M11 18L5 12L11 6" />
  </svg>
);

const EditIcon = () => (
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
    <path d="M12 20H5C4.4 20 4 19.6 4 19V12" />

    <path d="M16.5 3.5C17.3 2.7 18.7 2.7 19.5 3.5C20.3 4.3 20.3 5.7 19.5 6.5L10 16L6 17L7 13L16.5 3.5Z" />
  </svg>
);

const ArchiveIcon = () => (
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
    <rect
      x="3"
      y="4"
      width="18"
      height="5"
      rx="1"
    />

    <path d="M5 9V20H19V9" />
    <path d="M10 13H14" />
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

const FolderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7"
    aria-hidden="true"
  >
    <path d="M3 7.5C3 6.7 3.7 6 4.5 6H9L11 8H19.5C20.3 8 21 8.7 21 9.5V18.5C21 19.3 20.3 20 19.5 20H4.5C3.7 20 3 19.3 3 18.5V7.5Z" />

    <path d="M3 10H21" />
  </svg>
);

const CopyIcon = () => (
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
    <rect
      x="8"
      y="8"
      width="12"
      height="12"
      rx="2"
    />

    <path d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8" />
  </svg>
);

/* =========================================================
   PROJECT DETAILS PAGE
   ========================================================= */

export default function ProjectDetailsPage() {
  const {
    projectId,
  } = useParams<{
    projectId: string;
  }>();

  const location =
    useLocation();

  const locationState =
    location.state as
      | LocationState
      | null;

  const [
    project,
    setProject,
  ] =
    useState<Project | null>(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] =
    useState<ActionLoading>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState(
      locationState
        ?.successMessage ||
        ""
    );

  const [
    clientAccessToken,
    setClientAccessToken,
  ] =
    useState("");

  const [
    copiedToken,
    setCopiedToken,
  ] =
    useState(false);

  /* =======================================================
     LOAD PROJECT
     ======================================================= */

  const fetchProject =
    useCallback(
      async () => {
        if (!projectId) {
          setProject(null);

          setErrorMessage(
            "Project ID available nahi hai."
          );

          setIsLoading(false);

          return;
        }

        try {
          setIsLoading(true);
          setErrorMessage("");

          const response =
            await getProjectById(
              projectId
            );

          setProject(response);

          setClientAccessToken(
            response
              .clientAccessToken ||
              response
                .clientAccess
                ?.accessToken ||
              ""
          );
        } catch (error) {
          console.error(
            "Unable to load project:",
            error
          );

          setProject(null);

          setErrorMessage(
            getErrorMessage(
              error
            )
          );
        } finally {
          setIsLoading(false);
        }
      },
      [projectId]
    );

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  /* =======================================================
     MESSAGE TIMERS
     ======================================================= */

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId =
      window.setTimeout(
        () => {
          setSuccessMessage("");
        },
        5000
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [successMessage]);

  useEffect(() => {
    if (!copiedToken) {
      return;
    }

    const timeoutId =
      window.setTimeout(
        () => {
          setCopiedToken(false);
        },
        2500
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [copiedToken]);

  /* =======================================================
     COMPUTED DATA
     ======================================================= */

  const progress =
    useMemo<ProjectProgress>(
      () =>
        project
          ?.progressBreakdown ||
        EMPTY_PROGRESS,
      [
        project
          ?.progressBreakdown,
      ]
    );

  const totalRiskGroups =
    project?.riskSummary
      .totalRiskGroups ||
    0;

  const isArchived =
    project?.status ===
      "archived" ||
    project?.isArchived ===
      true;

  const isClientAccessEnabled =
    Boolean(
      project
        ?.clientAccessEnabled ||
        project
          ?.clientAccess
          ?.isEnabled
    );

  /* =======================================================
     ARCHIVE
     ======================================================= */

  const handleArchive =
    async () => {
      if (
        !project ||
        actionLoading ||
        isArchived
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to archive "${project.title}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(
          "archive"
        );

        setErrorMessage("");

        const archivedProject =
          await archiveProject(
            project._id
          );

        setProject(
          archivedProject
        );

        setClientAccessToken(
          ""
        );

        setSuccessMessage(
          "Project successfully archive ho gaya."
        );
      } catch (error) {
        console.error(
          "Project archive failed:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );
      } finally {
        setActionLoading(
          null
        );
      }
    };

  /* =======================================================
     GENERATE / REGENERATE CLIENT TOKEN
     ======================================================= */

  const handleGenerateClientAccess =
    async () => {
      if (
        !project ||
        actionLoading
      ) {
        return;
      }

      try {
        setActionLoading(
          "generate-access"
        );

        setErrorMessage("");

        const response =
          await createProjectClientAccess(
            project._id
          );

        const token =
          response
            .clientAccessToken ||
          "";

        setClientAccessToken(
          token
        );

        setProject(
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,

              clientAccessEnabled:
                true,

              ...(token
                ? {
                    clientAccessToken:
                      token,
                  }
                : {}),

              clientAccess: {
                ...current
                  .clientAccess,

                isEnabled:
                  true,

                ...(token
                  ? {
                      accessToken:
                        token,
                    }
                  : {}),
              },
            };
          }
        );

        setSuccessMessage(
          isClientAccessEnabled
            ? "New client access token generate ho gaya."
            : "Client access successfully enable ho gaya."
        );
      } catch (error) {
        console.error(
          "Client access generation failed:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );
      } finally {
        setActionLoading(
          null
        );
      }
    };

  /* =======================================================
     REVOKE CLIENT ACCESS
     ======================================================= */

  const handleRevokeClientAccess =
    async () => {
      if (
        !project ||
        actionLoading
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to revoke client access?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(
          "revoke-access"
        );

        setErrorMessage("");

        await revokeProjectClientAccess(
          project._id
        );

        setClientAccessToken(
          ""
        );

        setProject(
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,

              clientAccessEnabled:
                false,

              clientAccessToken:
                undefined,

              clientAccess: {
                ...current
                  .clientAccess,

                isEnabled:
                  false,

                accessToken:
                  undefined,
              },
            };
          }
        );

        setSuccessMessage(
          "Client access successfully revoke ho gaya."
        );
      } catch (error) {
        console.error(
          "Client access revoke failed:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );
      } finally {
        setActionLoading(
          null
        );
      }
    };

  /* =======================================================
     COPY TOKEN
     ======================================================= */

  const handleCopyToken =
    async () => {
      if (!clientAccessToken) {
        return;
      }

      try {
        await copyText(
          clientAccessToken
        );

        setCopiedToken(
          true
        );
      } catch (error) {
        console.error(
          "Copy failed:",
          error
        );

        setErrorMessage(
          "Access token copy nahi ho saka."
        );
      }
    };

  /* =======================================================
     LOADING
     ======================================================= */

  if (isLoading) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({
            length: 5,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
              />
            )
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 xl:col-span-2" />

          <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  /* =======================================================
     PROJECT NOT FOUND
     ======================================================= */

  if (!project) {
    return (
      <section className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm dark:border-red-500/20 dark:bg-gray-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <FolderIcon />
        </div>

        <h1 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
          Project details unavailable
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
          {errorMessage ||
            "Requested project nahi mila."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/projects"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <BackIcon />

            Back to Projects
          </Link>

          <button
            type="button"
            onClick={() => {
              void fetchProject();
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <RefreshIcon />

            Try Again
          </button>
        </div>
      </section>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="min-w-0 space-y-6">
      {/* ===================================================
          MESSAGES
          =================================================== */}

      {successMessage ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {successMessage}
          </p>

          <button
            type="button"
            onClick={() => {
              setSuccessMessage(
                ""
              );
            }}
            className="text-lg font-bold text-emerald-700 dark:text-emerald-400"
            aria-label="Close success message"
          >
            ×
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
            }}
            className="text-lg font-bold text-red-700 dark:text-red-400"
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      ) : null}

      {/* ===================================================
          PROJECT HEADER
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <FolderIcon />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                    project.status
                  )}`}
                >
                  {formatStatus(
                    project.status
                  )}
                </span>

                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskLevelClasses(
                    project
                      .overallRiskLevel
                  )}`}
                >
                  {formatRiskLevel(
                    project
                      .overallRiskLevel
                  )}{" "}
                  Risk
                </span>

                <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {formatProjectType(
                    project.projectType
                  )}
                </span>
              </div>

              <h1 className="mt-3 break-words text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {project.title}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {getProjectReference(
                    project
                  )}
                </span>

                <span>
                  Created{" "}
                  {formatDate(
                    project.createdAt
                  )}
                </span>

                {project.site.city ? (
                  <span>
                    {project.site.city}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/projects"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <BackIcon />

              Projects
            </Link>

            <button
              type="button"
              onClick={() => {
                void fetchProject();
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              aria-label="Refresh project"
              title="Refresh project"
            >
              <RefreshIcon />
            </button>

            {!isArchived ? (
              <>
                <Link
                  to={`/projects/${project._id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <EditIcon />

                  Edit Project
                </Link>

                <button
                  type="button"
                  onClick={
                    handleArchive
                  }
                  disabled={
                    actionLoading !==
                    null
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <ArchiveIcon />

                  {actionLoading ===
                  "archive"
                    ? "Archiving..."
                    : "Archive"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="border-t border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overall Project Progress
            </span>

            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {clampPercentage(
                progress.overall
              )}
              %
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-all duration-500"
              style={{
                width: `${clampPercentage(
                  progress.overall
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          EXECUTION PROGRESS
          =================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Execution Progress
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Yeh progress actual tracker,
            evidence, action-plan aur
            testing records se calculate
            hogi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ProgressCard
            label="Overall"
            value={
              progress.overall
            }
            description="Complete project progress."
          />

          <ProgressCard
            label="Rectification"
            value={
              progress.rectification
            }
            description="Completed corrective work."
          />

          <ProgressCard
            label="Evidence"
            value={
              progress.evidence
            }
            description="Before and after evidence completion."
          />

          <ProgressCard
            label="Testing"
            value={
              progress.testing
            }
            description="Testing and verification completion."
          />

          <ProgressCard
            label="Action Plan"
            value={
              progress.actionPlan
            }
            description="Month-wise planned actions completed."
          />
        </div>
      </section>

      {/* ===================================================
          RISK SUMMARY
          =================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tracker Summary
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Project findings aur supporting
            evidence ka current summary.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            label="Risk Groups"
            value={
              project.riskSummary
                .totalRiskGroups
            }
            description="Total tracker findings."
            tone="gray"
          />

          <SummaryCard
            label="Evidence"
            value={
              project.riskSummary
                .totalEvidence
            }
            description="Before and after evidence."
            tone="blue"
          />

          <SummaryCard
            label="Extreme"
            value={
              project.riskSummary
                .extreme
            }
            description="Immediate critical action."
            tone="red"
          />

          <SummaryCard
            label="High"
            value={
              project.riskSummary.high
            }
            description="Urgent corrective action."
            tone="orange"
          />

          <SummaryCard
            label="Medium"
            value={
              project.riskSummary
                .medium
            }
            description="Planned corrective action."
            tone="amber"
          />

          <SummaryCard
            label="Low"
            value={
              project.riskSummary.low
            }
            description="Routine monitoring."
            tone="emerald"
          />
        </div>
      </section>

      {/* ===================================================
          MAIN INFORMATION
          =================================================== */}

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader
              title="Project Overview"
              description="Main project scope aur management information."
            />

            <div className="p-5 sm:p-6">
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                {project.description ||
                  "No project description has been added."}
              </p>

              <div className="mt-6">
                <InfoRow
                  label="Project Reference No."
                  value={
                    getProjectReference(
                      project
                    )
                  }
                />

                <InfoRow
                  label="Project Type"
                  value={
                    formatProjectType(
                      project.projectType
                    )
                  }
                />

                <InfoRow
                  label="Status"
                  value={
                    formatStatus(
                      project.status
                    )
                  }
                />

                <InfoRow
                  label="Overall Risk Level"
                  value={
                    formatRiskLevel(
                      project
                        .overallRiskLevel
                    )
                  }
                />

                <InfoRow
                  label="System Capacity"
                  value={
                    project
                      .systemCapacityKW !==
                    undefined
                      ? `${project.systemCapacityKW} kW`
                      : null
                  }
                />

                <InfoRow
                  label="Project Lead"
                  value={
                    getProjectLeadName(
                      project
                    )
                  }
                />

                <InfoRow
                  label="Created By"
                  value={
                    getCreatedByName(
                      project
                    )
                  }
                />

                <InfoRow
                  label="Created At"
                  value={
                    formatDateTime(
                      project.createdAt
                    )
                  }
                />

                <InfoRow
                  label="Last Updated"
                  value={
                    formatDateTime(
                      project.updatedAt
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader
              title="Site Information"
              description="Audit aur rectification site ki location details."
            />

            <div className="px-5 py-2 sm:px-6">
              <InfoRow
                label="Site Name"
                value={
                  project.site.name
                }
              />

              <InfoRow
                label="Complete Address"
                value={
                  project.site
                    .location
                }
              />

              <InfoRow
                label="City"
                value={
                  project.site.city
                }
              />

              <InfoRow
                label="Province"
                value={
                  project.site
                    .province
                }
              />

              <InfoRow
                label="Country"
                value={
                  project.site.country
                }
              />
            </div>
          </div>

          {project.notes ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <CardHeader
                title="Internal Notes"
              />

              <div className="p-5 sm:p-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                  {project.notes}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader
              title="Client Information"
            />

            <div className="px-5 py-2">
              <InfoRow
                label="Client Name"
                value={
                  project.client.name
                }
              />

              <InfoRow
                label="Company"
                value={
                  project.client
                    .company
                }
              />

              <InfoRow
                label="Email"
                value={
                  project.client.email
                }
              />

              <InfoRow
                label="Phone"
                value={
                  project.client.phone
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader
              title="Audit & Schedule"
            />

            <div className="px-5 py-2">
              <InfoRow
                label="Audit Date"
                value={
                  formatDate(
                    project.auditDate
                  )
                }
              />

              <InfoRow
                label="Project Start"
                value={
                  formatDate(
                    project.startDate
                  )
                }
              />

              <InfoRow
                label="Expected Completion"
                value={
                  formatDate(
                    project
                      .expectedCompletionDate
                  )
                }
              />

              <InfoRow
                label="Actual Completion"
                value={
                  formatDate(
                    project
                      .actualCompletionDate
                  )
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader
              title="Project Settings"
            />

            <div className="px-5 py-2">
              <InfoRow
                label="Risk Register ID"
                value={
                  project.settings
                    .riskRegisterIdEnabled
                    ? "Enabled"
                    : "Disabled"
                }
              />

              <InfoRow
                label="Client Access"
                value={
                  isClientAccessEnabled
                    ? "Enabled"
                    : "Disabled"
                }
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader
              title="Tracker Status"
            />

            <div className="space-y-5 p-5">
              <StatusProgress
                label="Open"
                value={
                  project.riskSummary
                    .open
                }
                total={
                  totalRiskGroups
                }
                barClassName="bg-red-500"
              />

              <StatusProgress
                label="In Progress"
                value={
                  project.riskSummary
                    .inProgress
                }
                total={
                  totalRiskGroups
                }
                barClassName="bg-orange-500"
              />

              <StatusProgress
                label="Awaiting Verification"
                value={
                  project.riskSummary
                    .awaitingVerification
                }
                total={
                  totalRiskGroups
                }
                barClassName="bg-amber-500"
              />

              <StatusProgress
                label="Closed"
                value={
                  project.riskSummary
                    .closed
                }
                total={
                  totalRiskGroups
                }
                barClassName="bg-emerald-500"
              />
            </div>
          </div>

          {/* ===============================================
              CLIENT ACCESS
              =============================================== */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <CardHeader
              title="Client Access"
              description="Secure project access token manage karein."
            />

            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isClientAccessEnabled
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {isClientAccessEnabled
                    ? "Enabled"
                    : "Disabled"}
                </span>

                {isClientAccessEnabled &&
                !clientAccessToken ? (
                  <span className="text-xs text-gray-400">
                    Token hidden
                  </span>
                ) : null}
              </div>

              {clientAccessToken ? (
                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Access Token
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        clientAccessToken
                      }
                      className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyToken();
                      }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <CopyIcon />

                      {copiedToken
                        ? "Copied"
                        : "Copy"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-gray-400">
                    Is token ko secure
                    location mein save
                    karein. Database mein
                    sirf hashed token save
                    hota hai.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={
                    handleGenerateClientAccess
                  }
                  disabled={
                    actionLoading !==
                      null ||
                    isArchived
                  }
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading ===
                  "generate-access"
                    ? "Generating..."
                    : isClientAccessEnabled
                      ? "Regenerate Access Token"
                      : "Enable Client Access"}
                </button>

                {isClientAccessEnabled ? (
                  <button
                    type="button"
                    onClick={
                      handleRevokeClientAccess
                    }
                    disabled={
                      actionLoading !==
                        null ||
                      isArchived
                    }
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-red-200 px-4 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    {actionLoading ===
                    "revoke-access"
                      ? "Revoking..."
                      : "Revoke Client Access"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          PROJECT MODULES
          =================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Project Modules
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Current working modules aur
            future project modules.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ModuleCard
            title="Risk Register"
            description="Findings, descriptions, remarks aur status manage karein."
            to={`/risks?projectId=${project._id}`}
          />

          <ModuleCard
            title="Evidence"
            description="Before aur after evidence review karein."
            to={`/evidence?projectId=${project._id}`}
          />

          <ModuleCard
            title="Action Plans"
            description="Month-wise actions, owners aur deadlines track hongi."
            disabled
          />

          <ModuleCard
            title="Testing & Controls"
            description="Electrical tests aur verification records manage hongay."
            disabled
          />

          <ModuleCard
            title="Documents"
            description="PDF, Word aur Excel progress reports generate hongi."
            disabled
          />
        </div>
      </section>
    </div>
  );
}