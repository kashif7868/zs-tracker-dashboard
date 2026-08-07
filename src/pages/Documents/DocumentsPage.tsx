import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "react-router";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

import {
  getProjectDisplayName,
  getProjectReferenceNumber,
  getProjects,
  type Project,
} from "../../services/project/project.service";

import {
  deleteDocument,
  formatDocumentFileSize,
  generateDocument,
  getDocumentFormatLabel,
  getDocumentGeneratedByName,
  getDocumentLayoutLabel,
  getDocumentProjectReference,
  getDocuments,
  saveDocumentDownload,
  type DocumentFormat,
  type DocumentLayout,
  type DocumentRiskStatusFilter,
  type DocumentStatus,
  type ProjectDocumentRecord,
} from "../../services/documents/document.service";

/* =========================================================
   CONSTANTS
   ========================================================= */

const PAGE_LIMIT = 20;

const INPUT_CLASSES =
  "h-11 w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10";

const TEXTAREA_CLASSES =
  "w-full min-w-0 rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10";

/* =========================================================
   TYPES
   ========================================================= */

type HistoryStatusFilter = "all" | DocumentStatus;
type HistoryFormatFilter = "all" | DocumentFormat;
type HistoryLayoutFilter = "all" | DocumentLayout;

type DocumentDashboardSummary = {
  totalDocuments: number;
  completedDocuments: number;
  failedDocuments: number;
  generatingDocuments: number;
};

type GenerationFormState = {
  projectId: string;
  title: string;
  description: string;
  layout: DocumentLayout;
  format: DocumentFormat;
  statusFilter: DocumentRiskStatusFilter;
  includeProjectDetails: boolean;
  includeRiskRegisterId: boolean;
  includeBeforeEvidence: boolean;
  includeAfterEvidence: boolean;
  includeEvidenceImages: boolean;
  dateFrom: string;
  dateTo: string;
};

const EMPTY_SUMMARY: DocumentDashboardSummary = {
  totalDocuments: 0,
  completedDocuments: 0,
  failedDocuments: 0,
  generatingDocuments: 0,
};

const INITIAL_GENERATION_FORM: GenerationFormState = {
  projectId: "",
  title: "",
  description: "",
  layout: "risk_register",
  format: "pdf",
  statusFilter: "all",
  includeProjectDetails: true,
  includeRiskRegisterId: true,
  includeBeforeEvidence: true,
  includeAfterEvidence: true,
  includeEvidenceImages: true,
  dateFrom: "",
  dateTo: "",
};

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

const DownloadIcon = () => (
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
    <path d="M12 3V15" />
    <path d="M7 10L12 15L17 10" />
    <path d="M5 20H19" />
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

const DocumentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
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

const GenerateIcon = () => (
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
    <path d="M12 3V15" />
    <path d="M7 10L12 15L17 10" />
    <path d="M5 21H19" />
    <path d="M5 17V21" />
    <path d="M19 17V21" />
  </svg>
);

/* =========================================================
   HELPERS
   ========================================================= */

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
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
      requestError.response?.data?.errors?.[0]?.message ||
      requestError.response?.data?.errors?.[0]?.msg ||
      requestError.response?.data?.message ||
      requestError.response?.data?.error ||
      "Request could not be completed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request could not be completed.";
};

const formatDate = (value?: string): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/* =========================================================
   SUMMARY DATA
   ========================================================= */

const getDocumentDashboardSummary = async (
  projectId?: string
): Promise<DocumentDashboardSummary> => {
  const firstPage = await getDocuments({
    ...(projectId ? { projectId } : {}),
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const allDocuments = [...firstPage.documents];

  for (
    let currentPage = 2;
    currentPage <= firstPage.pagination.totalPages;
    currentPage += 1
  ) {
    const nextPage = await getDocuments({
      ...(projectId ? { projectId } : {}),
      page: currentPage,
      limit: firstPage.pagination.limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    allDocuments.push(...nextPage.documents);
  }

  return {
    totalDocuments: allDocuments.length,
    completedDocuments: allDocuments.filter(
      (document) => document.status === "completed"
    ).length,
    failedDocuments: allDocuments.filter(
      (document) => document.status === "failed"
    ).length,
    generatingDocuments: allDocuments.filter(
      (document) => document.status === "generating"
    ).length,
  };
};

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function SummaryCard({
  title,
  value,
  description,
  accentClassName,
  pulse = false,
}: {
  title: string;
  value: string | number;
  description: string;
  accentClassName: string;
  pulse?: boolean;
}) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`} />

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

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const className =
    status === "completed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400"
      : status === "failed"
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-400";

  const label =
    status === "completed"
      ? "Completed"
      : status === "failed"
        ? "Failed"
        : "Generating";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${className}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "completed"
            ? "bg-emerald-500"
            : status === "failed"
              ? "bg-red-500"
              : "animate-pulse bg-amber-500"
        }`}
      />
      {label}
    </span>
  );
}

function FormatBadge({ format }: { format: DocumentFormat }) {
  const classes =
    format === "pdf"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400"
      : format === "docx"
        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-500/10 dark:text-blue-400"
        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400";

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${classes}`}
    >
      {getDocumentFormatLabel(format)}
    </span>
  );
}

function CheckboxField({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex min-w-0 items-start gap-3 rounded-xl border p-3.5 transition ${
        disabled
          ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900/50"
          : checked
            ? "cursor-pointer border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-500/5"
            : "cursor-pointer border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-900"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />

      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </span>

        {description ? (
          <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function LoadingHistory() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedProjectId = searchParams.get("projectId")?.trim() || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [selectedProjectId, setSelectedProjectId] = useState(
    requestedProjectId
  );
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [historyStatus, setHistoryStatus] =
    useState<HistoryStatusFilter>("all");
  const [historyFormat, setHistoryFormat] =
    useState<HistoryFormatFilter>("all");
  const [historyLayout, setHistoryLayout] =
    useState<HistoryLayoutFilter>("all");

  const [documents, setDocuments] = useState<ProjectDocumentRecord[]>([]);
  const [summary, setSummary] =
    useState<DocumentDashboardSummary>(EMPTY_SUMMARY);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [generationForm, setGenerationForm] = useState<GenerationFormState>({
    ...INITIAL_GENERATION_FORM,
    projectId: requestedProjectId,
  });
  const [generating, setGenerating] = useState(false);

  const [downloadingDocumentId, setDownloadingDocumentId] = useState("");
  const [deletingDocumentId, setDeletingDocumentId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* =======================================================
     QUERY PARAMETER SYNC
     ======================================================= */

  useEffect(() => {
    if (requestedProjectId !== selectedProjectId) {
      setSelectedProjectId(requestedProjectId);
      setPage(1);
    }

    if (requestedProjectId && !generationForm.projectId) {
      setGenerationForm((current) => ({
        ...current,
        projectId: requestedProjectId,
      }));
    }
  }, [requestedProjectId, selectedProjectId, generationForm.projectId]);

  /* =======================================================
     LOAD PROJECTS
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        setProjectsLoading(true);

        const result = await getProjects({
          page: 1,
          limit: 100,
          sortBy: "title",
          sortOrder: "asc",
        });

        if (cancelled) {
          return;
        }

        setProjects(result.projects);

        if (result.projects.length === 1 && !requestedProjectId) {
          const onlyProject = result.projects[0];

          setSelectedProjectId(onlyProject._id);
          setGenerationForm((current) => ({
            ...current,
            projectId: onlyProject._id,
          }));
          setSearchParams(
            { projectId: onlyProject._id },
            { replace: true }
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [requestedProjectId, setSearchParams]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const generationProject = useMemo(
    () => projects.find((project) => project._id === generationForm.projectId),
    [projects, generationForm.projectId]
  );

  const riskRegisterIdAvailable =
    generationProject?.settings?.riskRegisterIdEnabled === true;

  /* =======================================================
     LOAD DOCUMENTS
     ======================================================= */

  const loadDocuments = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [historyResult, summaryResult] = await Promise.allSettled([
          getDocuments({
            ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
            ...(appliedSearch ? { search: appliedSearch } : {}),
            ...(historyStatus !== "all" ? { status: historyStatus } : {}),
            ...(historyFormat !== "all" ? { format: historyFormat } : {}),
            ...(historyLayout !== "all" ? { layout: historyLayout } : {}),
            page,
            limit: PAGE_LIMIT,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
          getDocumentDashboardSummary(selectedProjectId || undefined),
        ]);

        if (historyResult.status === "rejected") {
          throw historyResult.reason;
        }

        const result = historyResult.value;

        setDocuments(result.documents);
        setTotalRecords(result.pagination.total);
        setTotalPages(Math.max(result.pagination.totalPages, 1));

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
        } else {
          setSummary(EMPTY_SUMMARY);
        }
      } catch (requestError) {
        setDocuments([]);
        setTotalRecords(0);
        setTotalPages(1);
        setSummary(EMPTY_SUMMARY);
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [
      selectedProjectId,
      appliedSearch,
      historyStatus,
      historyFormat,
      historyLayout,
      page,
    ]
  );

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  /* =======================================================
     FILTER HANDLERS
     ======================================================= */

  const handleProjectFilterChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPage(1);

    const nextSearchParams = new URLSearchParams(searchParams);

    if (projectId) {
      nextSearchParams.set("projectId", projectId);
    } else {
      nextSearchParams.delete("projectId");
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setSelectedProjectId("");
    setHistoryStatus("all");
    setHistoryFormat("all");
    setHistoryLayout("all");
    setPage(1);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("projectId");
    setSearchParams(nextSearchParams, { replace: true });
  };

  /* =======================================================
     GENERATION
     ======================================================= */

  const handleGenerationProjectChange = (projectId: string) => {
    const project = projects.find((item) => item._id === projectId);
    const riskRegisterEnabled =
      project?.settings?.riskRegisterIdEnabled === true;

    setGenerationForm((current) => ({
      ...current,
      projectId,
      includeRiskRegisterId: riskRegisterEnabled
        ? current.includeRiskRegisterId
        : false,
    }));
  };

  const handleGenerateDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const projectId = generationForm.projectId.trim();
    const title = generationForm.title.trim();

    if (!projectId) {
      setError("Please select a Project before generating a report.");
      return;
    }

    if (title.length < 3) {
      setError("Report title must contain at least 3 characters.");
      return;
    }

    if (
      generationForm.dateFrom &&
      generationForm.dateTo &&
      new Date(generationForm.dateTo) < new Date(generationForm.dateFrom)
    ) {
      setError("Date To cannot be before Date From.");
      return;
    }

    try {
      setGenerating(true);

      const result = await generateDocument({
        projectId,
        title,
        ...(generationForm.description.trim()
          ? { description: generationForm.description.trim() }
          : {}),
        layout: generationForm.layout,
        format: generationForm.format,
        filters: {
          statusFilter: generationForm.statusFilter,
          includeProjectDetails: generationForm.includeProjectDetails,
          includeRiskRegisterId: riskRegisterIdAvailable
            ? generationForm.includeRiskRegisterId
            : false,
          includeBeforeEvidence: generationForm.includeBeforeEvidence,
          includeAfterEvidence: generationForm.includeAfterEvidence,
          includeEvidenceImages: generationForm.includeEvidenceImages,
          ...(generationForm.dateFrom ? { dateFrom: generationForm.dateFrom } : {}),
          ...(generationForm.dateTo ? { dateTo: generationForm.dateTo } : {}),
          sortBy: "serialNo",
          sortOrder: "asc",
        },
      });

      setSuccessMessage(
        `${result.document.title} generated successfully. ${result.exportedRecords} Risk record${result.exportedRecords === 1 ? "" : "s"} exported.`
      );

      setSelectedProjectId(projectId);
      setPage(1);

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set("projectId", projectId);
      setSearchParams(nextSearchParams, { replace: true });

      setGenerationForm((current) => ({
        ...current,
        title: "",
        description: "",
        dateFrom: "",
        dateTo: "",
      }));

      if (selectedProjectId === projectId) {
        await loadDocuments(true);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setGenerating(false);
    }
  };

  /* =======================================================
     DOCUMENT ACTIONS
     ======================================================= */

  const handleDownload = async (document: ProjectDocumentRecord) => {
    if (document.status !== "completed") {
      return;
    }

    try {
      setDownloadingDocumentId(document._id);
      setError("");
      setSuccessMessage("");
      await saveDocumentDownload(document._id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDownloadingDocumentId("");
    }
  };

  const handleDelete = async (document: ProjectDocumentRecord) => {
    const confirmed = window.confirm(
      `Delete "${document.title}"?\n\nThe generated ${document.format.toUpperCase()} file and its report history record will be permanently deleted.\n\nOriginal Project, Risk and Evidence records will not be changed.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingDocumentId(document._id);
      setError("");
      setSuccessMessage("");

      await deleteDocument(document._id);

      setSuccessMessage(
        "Report history and generated file deleted successfully."
      );

      if (documents.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(currentPage - 1, 1));
        return;
      }

      await loadDocuments(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingDocumentId("");
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <PageMeta
        title="Documents & Reports | Project Tracker"
        description="Generate and manage Project Tracker reports from Project, Risk Register and Evidence records."
      />

      <PageBreadcrumb pageTitle="Documents & Reports" />

      <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden">
        {/* =================================================
            HEADER
            ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

          <div className="flex flex-col gap-5 p-5 pt-6 sm:flex-row sm:items-center sm:justify-between lg:p-6 lg:pt-7">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Project Reporting
              </p>

              <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Documents & Reports
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Generate PDF, DOCX and XLSX reports from Project, Risk Register
                and Evidence data, then manage generated report history.
              </p>

              {selectedProject ? (
                <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    History Project
                  </span>

                  <span className="max-w-full break-words font-semibold text-emerald-700 dark:text-emerald-400">
                    {getProjectDisplayName(selectedProject)}
                  </span>

                  {getProjectReferenceNumber(selectedProject) ? (
                    <span className="max-w-full break-all rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {getProjectReferenceNumber(selectedProject)}
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Showing report history for all Projects.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => {
                void loadDocuments(true);
              }}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto"
            >
              <span className={refreshing ? "animate-spin" : ""}>
                <RefreshIcon />
              </span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* =================================================
            MESSAGES
            ================================================= */}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
            {successMessage}
          </div>
        ) : null}

        {/* =================================================
            SUMMARY
            ================================================= */}

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Reports"
            value={summary.totalDocuments}
            description="Generated report history records"
            accentClassName="bg-slate-500"
          />

          <SummaryCard
            title="Completed"
            value={summary.completedDocuments}
            description="Reports available for download"
            accentClassName="bg-emerald-500"
          />

          <SummaryCard
            title="Generating"
            value={summary.generatingDocuments}
            description="Reports currently being prepared"
            accentClassName="bg-amber-500"
            pulse={summary.generatingDocuments > 0}
          />

          <SummaryCard
            title="Failed"
            value={summary.failedDocuments}
            description="Generation attempts requiring review"
            accentClassName="bg-red-500"
          />
        </section>

        {/* =================================================
            GENERATE REPORT
            ================================================= */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <DocumentIcon />
              </span>

              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Generate Report
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Export existing Risk Register records without changing the
                  underlying Project, Risk or Evidence data.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleGenerateDocument}
            className="space-y-6 p-5 sm:p-6"
          >
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 xl:col-span-2">
                <label
                  htmlFor="generation-project"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Project
                </label>

                <select
                  id="generation-project"
                  value={generationForm.projectId}
                  disabled={projectsLoading || generating}
                  onChange={(event) =>
                    handleGenerationProjectChange(event.target.value)
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {getProjectDisplayName(project)}
                    </option>
                  ))}
                </select>

                {generationProject ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Project Reference: {" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {getProjectReferenceNumber(generationProject) || "—"}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="report-layout"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Layout
                </label>

                <select
                  id="report-layout"
                  value={generationForm.layout}
                  disabled={generating}
                  onChange={(event) =>
                    setGenerationForm((current) => ({
                      ...current,
                      layout: event.target.value as DocumentLayout,
                    }))
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="risk_register">Risk Register</option>
                  <option value="detailed_evidence">Detailed Evidence</option>
                  <option value="summary">Summary</option>
                </select>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="report-format"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Format
                </label>

                <select
                  id="report-format"
                  value={generationForm.format}
                  disabled={generating}
                  onChange={(event) =>
                    setGenerationForm((current) => ({
                      ...current,
                      format: event.target.value as DocumentFormat,
                    }))
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="xlsx">XLSX</option>
                </select>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="min-w-0">
                <label
                  htmlFor="report-title"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Report Title
                </label>

                <input
                  id="report-title"
                  type="text"
                  maxLength={250}
                  value={generationForm.title}
                  disabled={generating}
                  onChange={(event) =>
                    setGenerationForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Electrical Safety Rectification Report"
                  className={INPUT_CLASSES}
                />

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Report title is fully customizable.
                </p>
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="risk-status-export"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Risk Status
                </label>

                <select
                  id="risk-status-export"
                  value={generationForm.statusFilter}
                  disabled={generating}
                  onChange={(event) =>
                    setGenerationForm((current) => ({
                      ...current,
                      statusFilter: event.target.value as DocumentRiskStatusFilter,
                    }))
                  }
                  className={INPUT_CLASSES}
                >
                  <option value="all">All Risks</option>
                  <option value="in_progress">In Progress Only</option>
                  <option value="complete">Complete Only</option>
                </select>
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="report-description"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Description
              </label>

              <textarea
                id="report-description"
                rows={3}
                maxLength={2000}
                value={generationForm.description}
                disabled={generating}
                onChange={(event) =>
                  setGenerationForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional report description..."
                className={TEXTAREA_CLASSES}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Risk Date Range
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Optional. Leave both dates blank to include all matching Risk
                records.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="report-date-from"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Date From
                  </label>

                  <input
                    id="report-date-from"
                    type="date"
                    value={generationForm.dateFrom}
                    disabled={generating}
                    onChange={(event) =>
                      setGenerationForm((current) => ({
                        ...current,
                        dateFrom: event.target.value,
                      }))
                    }
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label
                    htmlFor="report-date-to"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Date To
                  </label>

                  <input
                    id="report-date-to"
                    type="date"
                    value={generationForm.dateTo}
                    disabled={generating}
                    onChange={(event) =>
                      setGenerationForm((current) => ({
                        ...current,
                        dateTo: event.target.value,
                      }))
                    }
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Included Content
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Select the Project, Risk and Evidence content to include in the
                generated report.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <CheckboxField
                  id="include-project-details"
                  label="Project Details"
                  description="Include Project title, reference and status."
                  checked={generationForm.includeProjectDetails}
                  disabled={generating}
                  onChange={(checked) =>
                    setGenerationForm((current) => ({
                      ...current,
                      includeProjectDetails: checked,
                    }))
                  }
                />

                <CheckboxField
                  id="include-risk-register-id"
                  label="Risk Register ID"
                  description={
                    riskRegisterIdAvailable
                      ? "Include optional Risk Register ID values."
                      : "Risk Register ID is disabled in this Project."
                  }
                  checked={
                    riskRegisterIdAvailable && generationForm.includeRiskRegisterId
                  }
                  disabled={generating || !riskRegisterIdAvailable}
                  onChange={(checked) =>
                    setGenerationForm((current) => ({
                      ...current,
                      includeRiskRegisterId: checked,
                    }))
                  }
                />

                <CheckboxField
                  id="include-before-evidence"
                  label="Before Evidence"
                  description="Include Before Evidence information."
                  checked={generationForm.includeBeforeEvidence}
                  disabled={generating}
                  onChange={(checked) =>
                    setGenerationForm((current) => ({
                      ...current,
                      includeBeforeEvidence: checked,
                    }))
                  }
                />

                <CheckboxField
                  id="include-after-evidence"
                  label="After Evidence"
                  description="Include After Evidence information."
                  checked={generationForm.includeAfterEvidence}
                  disabled={generating}
                  onChange={(checked) =>
                    setGenerationForm((current) => ({
                      ...current,
                      includeAfterEvidence: checked,
                    }))
                  }
                />

                <CheckboxField
                  id="include-evidence-images"
                  label="Evidence Images"
                  description="Embed available Evidence images where supported by the selected layout."
                  checked={generationForm.includeEvidenceImages}
                  disabled={
                    generating ||
                    (!generationForm.includeBeforeEvidence &&
                      !generationForm.includeAfterEvidence)
                  }
                  onChange={(checked) =>
                    setGenerationForm((current) => ({
                      ...current,
                      includeEvidenceImages: checked,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-xs leading-5 text-gray-500 dark:text-gray-400">
                Risk Register remains the source of truth. Report generation
                only exports existing records and stores the generated file in
                Documents history.
              </p>

              <button
                type="submit"
                disabled={
                  generating ||
                  !generationForm.projectId ||
                  generationForm.title.trim().length < 3
                }
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <GenerateIcon />
                {generating
                  ? "Generating..."
                  : `Generate ${generationForm.format.toUpperCase()}`}
              </button>
            </div>
          </form>
        </section>

        {/* =================================================
            HISTORY FILTERS
            ================================================= */}

        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              History
            </p>
            <h2 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
              Report History Filters
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Search and filter previously generated reports.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6"
          >
            <div className="min-w-0 xl:col-span-2">
              <label
                htmlFor="document-search"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Search
              </label>
              <input
                id="document-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Title, Project Reference or file name..."
                className={INPUT_CLASSES}
              />
            </div>

            <div className="min-w-0 xl:col-span-2">
              <label
                htmlFor="document-project-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Project
              </label>
              <select
                id="document-project-filter"
                value={selectedProjectId}
                onChange={(event) =>
                  handleProjectFilterChange(event.target.value)
                }
                className={INPUT_CLASSES}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {getProjectDisplayName(project)}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="document-status-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Status
              </label>
              <select
                id="document-status-filter"
                value={historyStatus}
                onChange={(event) => {
                  setHistoryStatus(event.target.value as HistoryStatusFilter);
                  setPage(1);
                }}
                className={INPUT_CLASSES}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="generating">Generating</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="document-format-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Format
              </label>
              <select
                id="document-format-filter"
                value={historyFormat}
                onChange={(event) => {
                  setHistoryFormat(event.target.value as HistoryFormatFilter);
                  setPage(1);
                }}
                className={INPUT_CLASSES}
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="xlsx">XLSX</option>
              </select>
            </div>

            <div className="min-w-0 xl:col-span-2">
              <label
                htmlFor="document-layout-filter"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Layout
              </label>
              <select
                id="document-layout-filter"
                value={historyLayout}
                onChange={(event) => {
                  setHistoryLayout(event.target.value as HistoryLayoutFilter);
                  setPage(1);
                }}
                className={INPUT_CLASSES}
              >
                <option value="all">All Layouts</option>
                <option value="risk_register">Risk Register</option>
                <option value="detailed_evidence">Detailed Evidence</option>
                <option value="summary">Summary</option>
              </select>
            </div>

            <div className="flex flex-wrap items-end gap-2 xl:col-span-4">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              >
                Search
              </button>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* =================================================
            REPORT HISTORY
            ================================================= */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Generated Reports
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {totalRecords} report{totalRecords === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wide">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                Generating
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400">
                <span className="size-1.5 rounded-full bg-red-500" />
                Failed
              </span>
            </div>
          </div>

          {loading ? (
            <LoadingHistory />
          ) : documents.length === 0 ? (
            <div className="px-5 py-14 text-center sm:px-6">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                <DocumentIcon />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                No reports found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No generated reports match the current filters.
              </p>
            </div>
          ) : (
            <div className="min-w-0 divide-y divide-gray-100 dark:divide-gray-800">
              {documents.map((document) => {
                const downloading = downloadingDocumentId === document._id;
                const deleting = deletingDocumentId === document._id;
                const canDownload = document.status === "completed";
                const projectReference =
                  getDocumentProjectReference(document) || "—";

                return (
                  <article
                    key={document._id}
                    className="min-w-0 p-4 transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02] sm:p-5"
                  >
                    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12 xl:items-start">
                      {/* REPORT */}
                      <div className="min-w-0 xl:col-span-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            <DocumentIcon />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <FormatBadge format={document.format} />
                              <DocumentStatusBadge status={document.status} />
                            </div>

                            <h3 className="mt-2 break-words text-sm font-semibold text-gray-900 dark:text-white">
                              {document.title}
                            </h3>

                            {document.description ? (
                              <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {document.description}
                              </p>
                            ) : null}

                            {document.status === "failed" &&
                            document.failureReason ? (
                              <p className="mt-2 break-words text-xs font-medium leading-5 text-red-600 dark:text-red-400">
                                {document.failureReason}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* PROJECT */}
                      <div className="min-w-0 xl:col-span-2">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                          Project
                        </p>
                        <p className="mt-1 break-all text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {projectReference}
                        </p>
                        <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                          {document.projectTitle}
                        </p>
                      </div>

                      {/* REPORT DETAILS */}
                      <div className="min-w-0 xl:col-span-2">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                          Report Details
                        </p>
                        <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {getDocumentLayoutLabel(document.layout)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {document.summary.totalRisks} Risk
                          {document.summary.totalRisks === 1 ? "" : "s"} • {" "}
                          {document.summary.completionPercentage}% complete
                        </p>
                        <p className="mt-1 break-all text-[10px] text-gray-400">
                          {document.fileName || "File not available"}
                          {document.fileSize
                            ? ` • ${formatDocumentFileSize(document.fileSize)}`
                            : ""}
                        </p>
                      </div>

                      {/* GENERATED */}
                      <div className="min-w-0 xl:col-span-2">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                          Generated
                        </p>
                        <p className="mt-1 break-words text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {getDocumentGeneratedByName(document)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(document.generatedAt || document.createdAt)}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          Created {formatDate(document.createdAt)}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex min-w-0 flex-wrap gap-2 xl:col-span-2 xl:justify-end">
                        <button
                          type="button"
                          disabled={!canDownload || downloading || deleting}
                          onClick={() => {
                            void handleDownload(document);
                          }}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-400 xl:flex-none"
                        >
                          <DownloadIcon />
                          {downloading ? "Downloading..." : "Download"}
                        </button>

                        <button
                          type="button"
                          disabled={deleting || downloading}
                          onClick={() => {
                            void handleDelete(document);
                          }}
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400"
                          aria-label="Delete Report"
                          title="Delete Report"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* =================================================
              PAGINATION
              ================================================= */}

          {!loading && totalRecords > 0 ? (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {page}
                </span>{" "}
                of {" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalPages}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(currentPage + 1, totalPages)
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
    </>
  );
}