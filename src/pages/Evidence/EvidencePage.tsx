import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import PageMeta from "../../components/common/PageMeta";

import {
  getActiveProjects,
} from "../../services/project/project.service";

import {
  getRiskById,
  getRisksByProject,
  markRiskComplete,
  markRiskInProgress,
  type Risk,
  type RiskEvidence,
  type RiskEvidenceSummary,
} from "../../services/risk/risk.service";

import {
  ALLOWED_EVIDENCE_IMAGE_TYPES,
  MAX_EVIDENCE_IMAGES,
  MAX_EVIDENCE_IMAGE_SIZE,
  deleteAfterEvidences,
  deleteBeforeEvidences,
  deleteEvidence,
  getEvidenceImageUrl,
  uploadAfterEvidence,
  uploadBeforeEvidence,
} from "../../services/evidence/evidence.service";

/* =========================================================
   TYPES
   ========================================================= */

type ProjectOption = {
  _id: string;
  projectCode: string;
  name: string;
  label: string;
};

type EvidenceType =
  | "before"
  | "after";

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_EVIDENCE: RiskEvidenceSummary = {
  before: [],
  after: [],

  beforeCount: 0,
  afterCount: 0,

  canMarkComplete: false,
};

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

/* =========================================================
   PROJECT RESPONSE HELPERS
   ========================================================= */

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

  const response =
    value as Record<
      string,
      unknown
    >;

  if (
    Array.isArray(
      response.projects
    )
  ) {
    return response.projects;
  }

  if (
    Array.isArray(
      response.data
    )
  ) {
    return response.data;
  }

  if (
    response.data &&
    typeof response.data ===
      "object"
  ) {
    const nestedData =
      response.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        nestedData.projects
      )
    ) {
      return nestedData.projects;
    }
  }

  return [];
};

const normalizeProject = (
  rawProject: unknown
): ProjectOption | null => {
  if (
    !rawProject ||
    typeof rawProject !==
      "object"
  ) {
    return null;
  }

  const project =
    rawProject as Record<
      string,
      unknown
    >;

  const projectId =
    typeof project._id ===
    "string"
      ? project._id
      : typeof project.id ===
          "string"
        ? project.id
        : "";

  if (!projectId) {
    return null;
  }

  const projectCode =
    typeof project.projectCode ===
    "string"
      ? project.projectCode.trim()
      : typeof project.code ===
          "string"
        ? project.code.trim()
        : "";

  const projectName =
    typeof project.projectName ===
    "string"
      ? project.projectName.trim()
      : typeof project.name ===
          "string"
        ? project.name.trim()
        : typeof project.title ===
            "string"
          ? project.title.trim()
          : "";

  const displayCode =
    projectCode ||
    "No Project Code";

  const displayName =
    projectName ||
    "Unnamed Project";

  return {
    _id: projectId,

    projectCode:
      projectCode,

    name: displayName,

    label: projectCode
      ? `${displayCode} — ${displayName}`
      : displayName,
  };
};

/* =========================================================
   GENERAL HELPERS
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
      requestError.response?.data
        ?.errors?.[0]?.message ||
      requestError.response?.data
        ?.errors?.[0]?.msg ||
      requestError.response?.data
        ?.message ||
      "Request could not be completed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request could not be completed.";
};

const formatStatus = (
  status: Risk["status"]
): string => {
  return status === "complete"
    ? "Complete"
    : "In Progress";
};

const formatFileSize = (
  size: number
): string => {
  const megabytes =
    size / 1024 / 1024;

  return `${megabytes.toFixed(
    2
  )} MB`;
};

const createEmptyEvidence =
  (): RiskEvidenceSummary => {
    return {
      ...EMPTY_EVIDENCE,
      before: [],
      after: [],
    };
  };

/* =========================================================
   COMPONENT
   ========================================================= */

export default function EvidencePage() {
  const beforeInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const afterInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [projects, setProjects] =
    useState<ProjectOption[]>([]);

  const [
    selectedProjectId,
    setSelectedProjectId,
  ] = useState("");

  const [risks, setRisks] =
    useState<Risk[]>([]);

  const [
    selectedRiskId,
    setSelectedRiskId,
  ] = useState("");

  const [
    selectedRisk,
    setSelectedRisk,
  ] = useState<Risk | null>(
    null
  );

  const [evidence, setEvidence] =
    useState<RiskEvidenceSummary>(
      createEmptyEvidence()
    );

  const [search, setSearch] =
    useState("");

  const [
    beforeFiles,
    setBeforeFiles,
  ] = useState<File[]>([]);

  const [
    afterFiles,
    setAfterFiles,
  ] = useState<File[]>([]);

  const [
    projectsLoading,
    setProjectsLoading,
  ] = useState(true);

  const [
    risksLoading,
    setRisksLoading,
  ] = useState(false);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [alert, setAlert] =
    useState<AlertState>(null);

  /* =======================================================
     LOAD PROJECTS
     ======================================================= */

  const loadProjects =
    useCallback(async () => {
      try {
        setProjectsLoading(true);
        setAlert(null);

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
            .sort((first, second) =>
              first.label.localeCompare(
                second.label
              )
            );

        setProjects(
          projectOptions
        );

        setSelectedProjectId(
          (currentProjectId) => {
            if (
              currentProjectId &&
              projectOptions.some(
                (project) =>
                  project._id ===
                  currentProjectId
              )
            ) {
              return currentProjectId;
            }

            return "";
          }
        );
      } catch (error) {
        setProjects([]);

        setAlert({
          type: "error",
          message:
            getErrorMessage(error),
        });
      } finally {
        setProjectsLoading(false);
      }
    }, []);

  /* =======================================================
     LOAD ALL RISKS FOR SELECTED PROJECT
     ======================================================= */

  const loadProjectRisks =
    useCallback(
      async (
        projectId: string
      ) => {
        if (!projectId) {
          setRisks([]);
          return;
        }

        try {
          setRisksLoading(true);
          setAlert(null);

          const firstPage =
            await getRisksByProject(
              projectId,
              {
                page: 1,
                limit: 100,
                sortBy:
                  "createdAt",
                sortOrder:
                  "desc",
              }
            );

          const allRisks = [
            ...firstPage.risks,
          ];

          const totalPages =
            firstPage.pagination
              .totalPages;

          if (totalPages > 1) {
            const pageRequests =
              Array.from(
                {
                  length:
                    totalPages -
                    1,
                },
                (_, index) =>
                  getRisksByProject(
                    projectId,
                    {
                      page:
                        index + 2,

                      limit:
                        firstPage
                          .pagination
                          .limit,

                      sortBy:
                        "createdAt",

                      sortOrder:
                        "desc",
                    }
                  )
              );

            const remainingPages =
              await Promise.all(
                pageRequests
              );

            remainingPages.forEach(
              (result) => {
                allRisks.push(
                  ...result.risks
                );
              }
            );
          }

          setRisks(allRisks);

          setSelectedRiskId(
            (currentRiskId) => {
              if (
                currentRiskId &&
                allRisks.some(
                  (risk) =>
                    risk._id ===
                    currentRiskId
                )
              ) {
                return currentRiskId;
              }

              return "";
            }
          );
        } catch (error) {
          setRisks([]);

          setSelectedRiskId("");

          setAlert({
            type: "error",
            message:
              getErrorMessage(error),
          });
        } finally {
          setRisksLoading(false);
        }
      },
      []
    );

  /* =======================================================
     LOAD SELECTED RISK DETAILS
     ======================================================= */

  const loadRiskDetails =
    useCallback(
      async (
        riskId: string
      ) => {
        if (!riskId) {
          setSelectedRisk(null);

          setEvidence(
            createEmptyEvidence()
          );

          return;
        }

        try {
          setDetailLoading(true);
          setAlert(null);

          const result =
            await getRiskById(
              riskId
            );

          setSelectedRisk(
            result.risk
          );

          setEvidence(
            result.evidence
          );

          setRisks(
            (currentRisks) =>
              currentRisks.map(
                (risk) =>
                  risk._id ===
                  result.risk._id
                    ? {
                        ...result.risk,

                        evidenceSummary:
                          result.evidence,
                      }
                    : risk
              )
          );
        } catch (error) {
          setSelectedRisk(null);

          setEvidence(
            createEmptyEvidence()
          );

          setAlert({
            type: "error",
            message:
              getErrorMessage(error),
          });
        } finally {
          setDetailLoading(false);
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  /* =======================================================
     PROJECT CHANGE
     ======================================================= */

  useEffect(() => {
    setSelectedRiskId("");

    setSelectedRisk(null);

    setEvidence(
      createEmptyEvidence()
    );

    setBeforeFiles([]);
    setAfterFiles([]);

    if (
      beforeInputRef.current
    ) {
      beforeInputRef.current.value =
        "";
    }

    if (
      afterInputRef.current
    ) {
      afterInputRef.current.value =
        "";
    }

    if (selectedProjectId) {
      void loadProjectRisks(
        selectedProjectId
      );
    } else {
      setRisks([]);
    }
  }, [
    selectedProjectId,
    loadProjectRisks,
  ]);

  /* =======================================================
     RISK CHANGE
     ======================================================= */

  useEffect(() => {
    setBeforeFiles([]);
    setAfterFiles([]);

    if (
      beforeInputRef.current
    ) {
      beforeInputRef.current.value =
        "";
    }

    if (
      afterInputRef.current
    ) {
      afterInputRef.current.value =
        "";
    }

    void loadRiskDetails(
      selectedRiskId
    );
  }, [
    selectedRiskId,
    loadRiskDetails,
  ]);

  /* =======================================================
     FILTERED RISK LIST
     ======================================================= */

  const filteredRisks =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return risks;
      }

      return risks.filter(
        (risk) => {
          const searchValue = [
            risk.serialNo,
            risk.riskRegisterId,
            risk.projectCode,
            risk.description,
            formatStatus(
              risk.status
            ),
          ]
            .join(" ")
            .toLowerCase();

          return searchValue.includes(
            normalizedSearch
          );
        }
      );
    }, [risks, search]);

  const selectedProject =
    useMemo(() => {
      return (
        projects.find(
          (project) =>
            project._id ===
            selectedProjectId
        ) ?? null
      );
    }, [
      projects,
      selectedProjectId,
    ]);

  /* =======================================================
     FILE VALIDATION
     ======================================================= */

  const validateSelectedFiles = (
    files: File[]
  ): string | null => {
    if (files.length === 0) {
      return "Select at least one Evidence image.";
    }

    if (
      files.length >
      MAX_EVIDENCE_IMAGES
    ) {
      return `Maximum ${MAX_EVIDENCE_IMAGES} images can be uploaded at one time.`;
    }

    for (const file of files) {
      if (
        !ALLOWED_EVIDENCE_IMAGE_TYPES.includes(
          file.type as
            (typeof ALLOWED_EVIDENCE_IMAGE_TYPES)[number]
        )
      ) {
        return `${file.name}: only JPG, JPEG, PNG and WEBP images are allowed.`;
      }

      if (
        file.size >
        MAX_EVIDENCE_IMAGE_SIZE
      ) {
        return `${file.name}: image must be 10 MB or smaller.`;
      }
    }

    return null;
  };

  /* =======================================================
     FILE SELECTION
     ======================================================= */

  const handleFileSelection = (
    evidenceType: EvidenceType,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files ?? []
    );

    const validationError =
      validateSelectedFiles(
        files
      );

    if (validationError) {
      setAlert({
        type: "error",
        message:
          validationError,
      });

      event.target.value = "";

      if (
        evidenceType ===
        "before"
      ) {
        setBeforeFiles([]);
      } else {
        setAfterFiles([]);
      }

      return;
    }

    setAlert(null);

    if (
      evidenceType ===
      "before"
    ) {
      setBeforeFiles(files);
    } else {
      setAfterFiles(files);
    }
  };

  /* =======================================================
     REFRESH SELECTED RISK AND LIST
     ======================================================= */

  const refreshSelectedData =
    async () => {
      if (!selectedRiskId) {
        return;
      }

      await loadRiskDetails(
        selectedRiskId
      );

      if (selectedProjectId) {
        await loadProjectRisks(
          selectedProjectId
        );
      }
    };

  /* =======================================================
     UPLOAD EVIDENCE
     ======================================================= */

  const handleUploadEvidence =
    async (
      evidenceType: EvidenceType
    ) => {
      if (!selectedRiskId) {
        setAlert({
          type: "error",
          message:
            "Select a Risk before uploading Evidence.",
        });

        return;
      }

      const files =
        evidenceType === "before"
          ? beforeFiles
          : afterFiles;

      const validationError =
        validateSelectedFiles(
          files
        );

      if (validationError) {
        setAlert({
          type: "error",
          message:
            validationError,
        });

        return;
      }

      try {
        setActionLoading(true);
        setAlert(null);

        if (
          evidenceType ===
          "before"
        ) {
          await uploadBeforeEvidence(
            selectedRiskId,
            files
          );

          setBeforeFiles([]);

          if (
            beforeInputRef.current
          ) {
            beforeInputRef.current.value =
              "";
          }
        } else {
          await uploadAfterEvidence(
            selectedRiskId,
            files
          );

          setAfterFiles([]);

          if (
            afterInputRef.current
          ) {
            afterInputRef.current.value =
              "";
          }
        }

        await refreshSelectedData();

        setAlert({
          type: "success",

          message:
            evidenceType ===
            "before"
              ? "Before Evidence uploaded successfully."
              : "After Evidence uploaded successfully.",
        });
      } catch (error) {
        setAlert({
          type: "error",
          message:
            getErrorMessage(error),
        });
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     DELETE SINGLE EVIDENCE
     ======================================================= */

  const handleDeleteEvidence =
    async (
      evidenceRecord:
        RiskEvidence
    ) => {
      if (!selectedRiskId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete this ${evidenceRecord.evidenceType} Evidence image?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setAlert(null);

        await deleteEvidence(
          selectedRiskId,
          evidenceRecord._id
        );

        await refreshSelectedData();

        setAlert({
          type: "success",
          message:
            "Evidence image deleted successfully.",
        });
      } catch (error) {
        setAlert({
          type: "error",
          message:
            getErrorMessage(error),
        });
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     DELETE ALL EVIDENCE BY TYPE
     ======================================================= */

  const handleDeleteEvidenceType =
    async (
      evidenceType: EvidenceType
    ) => {
      if (!selectedRiskId) {
        return;
      }

      const evidenceCount =
        evidenceType === "before"
          ? evidence.beforeCount
          : evidence.afterCount;

      if (evidenceCount === 0) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete all ${evidenceType} Evidence images from this Risk?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setAlert(null);

        if (
          evidenceType ===
          "before"
        ) {
          await deleteBeforeEvidences(
            selectedRiskId
          );
        } else {
          await deleteAfterEvidences(
            selectedRiskId
          );
        }

        await refreshSelectedData();

        setAlert({
          type: "success",

          message:
            evidenceType ===
            "before"
              ? "All Before Evidence deleted successfully."
              : "All After Evidence deleted successfully.",
        });
      } catch (error) {
        setAlert({
          type: "error",
          message:
            getErrorMessage(error),
        });
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     UPDATE RISK STATUS
     ======================================================= */

  const handleStatusAction =
    async () => {
      if (
        !selectedRiskId ||
        !selectedRisk
      ) {
        return;
      }

      try {
        setActionLoading(true);
        setAlert(null);

        if (
          selectedRisk.status ===
          "complete"
        ) {
          await markRiskInProgress(
            selectedRiskId
          );

          await refreshSelectedData();

          setAlert({
            type: "success",
            message:
              "Risk moved to In Progress successfully.",
          });

          return;
        }

        if (
          !evidence.canMarkComplete
        ) {
          setAlert({
            type: "error",
            message:
              "At least one Before image and one After image are required before marking this Risk Complete.",
          });

          return;
        }

        await markRiskComplete(
          selectedRiskId
        );

        await refreshSelectedData();

        setAlert({
          type: "success",
          message:
            "Risk marked Complete successfully.",
        });
      } catch (error) {
        setAlert({
          type: "error",
          message:
            getErrorMessage(error),
        });
      } finally {
        setActionLoading(false);
      }
    };

  /* =======================================================
     EVIDENCE SECTION
     ======================================================= */

  const renderEvidenceSection = (
    evidenceType: EvidenceType
  ) => {
    const isBefore =
      evidenceType === "before";

    const records = isBefore
      ? evidence.before
      : evidence.after;

    const selectedFiles =
      isBefore
        ? beforeFiles
        : afterFiles;

    const inputReference =
      isBefore
        ? beforeInputRef
        : afterInputRef;

    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isBefore
                  ? "Before Evidence"
                  : "After Evidence"}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  isBefore
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
              >
                {records.length} Image
                {records.length === 1
                  ? ""
                  : "s"}
              </span>
            </div>

            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
              {isBefore
                ? "Upload images showing the Risk condition before rectification."
                : "Upload images showing the completed rectification work."}
            </p>
          </div>

          {records.length > 0 && (
            <button
              type="button"
              disabled={
                actionLoading
              }
              onClick={() => {
                void handleDeleteEvidenceType(
                  evidenceType
                );
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Delete All
            </button>
          )}
        </div>

        {/* UPLOAD */}

        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
          <input
            ref={inputReference}
            type="file"
            multiple
            accept={IMAGE_ACCEPT}
            disabled={
              actionLoading
            }
            onChange={(event) => {
              handleFileSelection(
                evidenceType,
                event
              );
            }}
            className="block w-full cursor-pointer rounded-xl border border-gray-200 bg-white text-sm text-gray-600 file:mr-4 file:border-0 file:bg-emerald-600 file:px-4 file:py-3 file:text-sm file:font-bold file:text-white hover:file:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
              JPG, JPEG, PNG or WEBP.
              Maximum{" "}
              {MAX_EVIDENCE_IMAGES}{" "}
              images and 10 MB per
              image.
            </p>

            <button
              type="button"
              disabled={
                actionLoading ||
                selectedFiles.length ===
                  0
              }
              onClick={() => {
                void handleUploadEvidence(
                  evidenceType
                );
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading
                ? "Processing..."
                : isBefore
                  ? "Upload Before"
                  : "Upload After"}
            </button>
          </div>

          {selectedFiles.length >
            0 && (
            <div className="mt-4 space-y-2">
              {selectedFiles.map(
                (file) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <span className="min-w-0 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {file.name}
                    </span>

                    <span className="shrink-0 text-xs text-gray-400">
                      {formatFileSize(
                        file.size
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* GALLERY */}

        {records.length === 0 ? (
          <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800">
              0
            </div>

            <p className="mt-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              No{" "}
              {isBefore
                ? "Before"
                : "After"}{" "}
              Evidence uploaded
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {records.map(
              (record) => {
                const imageUrl =
                  getEvidenceImageUrl(
                    record.imagePath
                  );

                return (
                  <article
                    key={
                      record._id
                    }
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800"
                    >
                      <img
                        src={
                          imageUrl
                        }
                        alt={`${isBefore ? "Before" : "After"} Evidence`}
                        loading="lazy"
                        className="size-full object-cover transition duration-300 hover:scale-105"
                      />
                    </a>

                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {isBefore
                            ? "Before Image"
                            : "After Image"}
                        </p>

                        <p className="mt-1 truncate text-[11px] text-gray-400">
                          {
                            record.imagePath
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          actionLoading
                        }
                        onClick={() => {
                          void handleDeleteEvidence(
                            record
                          );
                        }}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-gray-800 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    );
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <PageMeta
        title="Evidence Management | Zorays Project Tracker"
        description="Manage Before and After Risk Evidence images."
      />

      <div className="space-y-6">
        {/* PAGE HEADER */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Risk Management
              </p>

              <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                Evidence Management
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Select a Project and
                Risk to upload, view or
                delete Before and After
                Evidence images.
              </p>
            </div>

            <button
              type="button"
              disabled={
                projectsLoading ||
                risksLoading ||
                detailLoading ||
                actionLoading
              }
              onClick={() => {
                void loadProjects();

                if (
                  selectedProjectId
                ) {
                  void loadProjectRisks(
                    selectedProjectId
                  );
                }

                if (
                  selectedRiskId
                ) {
                  void loadRiskDetails(
                    selectedRiskId
                  );
                }
              }}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Refresh Data
            </button>
          </div>
        </section>

        {/* ALERT */}

        {alert && (
          <div
            className={`rounded-2xl border p-4 text-sm font-semibold ${
              alert.type ===
              "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {alert.message}
          </div>
        )}

        {/* SELECTION */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* PROJECT */}

            <div>
              <label
                htmlFor="evidence-project"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Project
              </label>

              <select
                id="evidence-project"
                value={
                  selectedProjectId
                }
                disabled={
                  projectsLoading
                }
                onChange={(event) => {
                  setSelectedProjectId(
                    event.target.value
                  );
                }}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">
                  {projectsLoading
                    ? "Loading projects..."
                    : "Select Project"}
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
                      {project.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* RISK */}

            <div>
              <label
                htmlFor="evidence-risk"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Risk Record
              </label>

              <select
                id="evidence-risk"
                value={
                  selectedRiskId
                }
                disabled={
                  !selectedProjectId ||
                  risksLoading
                }
                onChange={(event) => {
                  setSelectedRiskId(
                    event.target.value
                  );
                }}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">
                  {risksLoading
                    ? "Loading risks..."
                    : !selectedProjectId
                      ? "Select Project first"
                      : "Select Risk"}
                </option>

                {filteredRisks.map(
                  (risk) => (
                    <option
                      key={
                        risk._id
                      }
                      value={
                        risk._id
                      }
                    >
                      {risk.serialNo} —{" "}
                      {
                        risk.riskRegisterId
                      }{" "}
                      —{" "}
                      {formatStatus(
                        risk.status
                      )}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SEARCH */}

            <div>
              <label
                htmlFor="evidence-risk-search"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Search Risks
              </label>

              <input
                id="evidence-risk-search"
                type="search"
                value={search}
                disabled={
                  !selectedProjectId
                }
                placeholder="Serial No., Risk ID or description"
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                }}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {selectedProject && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Selected Project:{" "}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {
                  selectedProject.label
                }
              </span>
            </p>
          )}
        </section>

        {/* NO RISK SELECTED */}

        {!selectedRiskId && (
          <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center dark:border-gray-700 dark:bg-white/[0.03]">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              E
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">
              Select a Risk Record
            </h2>

            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500 dark:text-gray-400">
              Evidence management
              becomes available after a
              Project and Risk have been
              selected.
            </p>
          </section>
        )}

        {/* DETAIL LOADING */}

        {selectedRiskId &&
          detailLoading && (
            <section className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="h-6 w-52 rounded bg-gray-200 dark:bg-gray-800" />

              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({
                  length: 4,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800"
                    />
                  )
                )}
              </div>
            </section>
          )}

        {/* RISK DETAILS */}

        {selectedRisk &&
          !detailLoading && (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {
                          selectedRisk.riskRegisterId
                        }
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          selectedRisk.status ===
                          "complete"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        {formatStatus(
                          selectedRisk.status
                        )}
                      </span>
                    </div>

                    <p className="mt-3 max-w-4xl text-sm leading-7 text-gray-600 dark:text-gray-300">
                      {
                        selectedRisk.description
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      (selectedRisk.status ===
                        "in_progress" &&
                        !evidence.canMarkComplete)
                    }
                    onClick={() => {
                      void handleStatusAction();
                    }}
                    className={`inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      selectedRisk.status ===
                      "complete"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {actionLoading
                      ? "Processing..."
                      : selectedRisk.status ===
                          "complete"
                        ? "Move to In Progress"
                        : "Mark Complete"}
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Project Code
                    </p>

                    <p className="mt-2 font-bold text-gray-900 dark:text-white">
                      {
                        selectedRisk.projectCode
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Serial No.
                    </p>

                    <p className="mt-2 font-bold text-gray-900 dark:text-white">
                      {
                        selectedRisk.serialNo
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      Before Evidence
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {
                        evidence.beforeCount
                      }
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      After Evidence
                    </p>

                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {
                        evidence.afterCount
                      }
                    </p>
                  </div>
                </div>

                {selectedRisk.status ===
                  "in_progress" &&
                  !evidence.canMarkComplete && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
                      Mark Complete requires
                      at least one Before
                      Evidence image and one
                      After Evidence image.
                    </div>
                  )}
              </section>

              <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                {renderEvidenceSection(
                  "before"
                )}

                {renderEvidenceSection(
                  "after"
                )}
              </div>
            </>
          )}
      </div>
    </>
  );
}