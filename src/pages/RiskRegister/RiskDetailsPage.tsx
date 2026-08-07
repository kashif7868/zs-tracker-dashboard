import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";

import {
  getProjectById,
  getProjectReferenceNumber,
  type Project,
} from "../../services/project/project.service";

import {
  getRiskById,
  markRiskComplete,
  markRiskInProgress,
  updateRisk,
  type RiskDetailsResult,
  type RiskStatus,
  type UpdateRiskPayload,
} from "../../services/risk/risk.service";

import {
  deleteEvidence,
  getEvidenceImageUrl,
  uploadAfterEvidence,
  uploadBeforeEvidence,
  type Evidence,
  type EvidenceType,
} from "../../services/evidence/evidence.service";

/* =========================================================
   TYPES
   ========================================================= */

type RiskUpdateForm = {
  riskRegisterId: string;
  description: string;
};

type FormErrors = Partial<
  Record<keyof RiskUpdateForm, string>
>;

type BusyAction =
  | ""
  | "refresh"
  | "update"
  | "upload_before"
  | "upload_after"
  | "complete"
  | "in_progress"
  | `delete_${string}`;

type InformationItemProps = {
  label: string;
  value?: string | number | null;
};

type EvidenceGalleryProps = {
  title: string;
  type: EvidenceType;
  evidences: Evidence[];
  selectedFiles: File[];

  inputRef:
    RefObject<HTMLInputElement | null>;

  disabled: boolean;
  busyAction: BusyAction;

  onFilesChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  onUpload: () => void;

  onDelete: (
    evidence: Evidence
  ) => void;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const INITIAL_FORM: RiskUpdateForm = {
  riskRegisterId: "",
  description: "",
};

const INPUT_CLASSES =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10 dark:disabled:bg-gray-900";

const TEXTAREA_CLASSES =
  "min-h-40 w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10 dark:disabled:bg-gray-900";

const EVIDENCE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

const MAX_EVIDENCE_FILES = 10;

const MAX_EVIDENCE_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_EVIDENCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_EVIDENCE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

/* =========================================================
   ICONS
   ========================================================= */

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-5"
    aria-hidden="true"
  >
    <path d="M6 6L18 18" />
    <path d="M18 6L6 18" />
  </svg>
);

const BackIcon = () => (
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
    <path d="M19 12H5" />
    <path d="M12 19L5 12L12 5" />
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

const UploadIcon = () => (
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
    <path d="M12 16V4" />
    <path d="M7 9L12 4L17 9" />
    <path d="M4 16V20H20V16" />
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
  </svg>
);

const CheckIcon = () => (
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
    <path d="M5 12L10 17L19 7" />
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
    className="size-5"
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

const formatDateTime = (
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
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const normalizeUppercaseValue = (
  value: string
): string => {
  return value
    .trimStart()
    .toUpperCase();
};

const validateForm = (
  form: RiskUpdateForm,
  riskRegisterIdEnabled: boolean
): FormErrors => {
  const errors: FormErrors = {};

  const description =
    form.description.trim();

  if (!description) {
    errors.description =
      "Description is required.";
  } else if (
    description.length < 3
  ) {
    errors.description =
      "Description must contain at least 3 characters.";
  } else if (
    description.length > 3000
  ) {
    errors.description =
      "Description cannot exceed 3000 characters.";
  }

  if (
    riskRegisterIdEnabled &&
    form.riskRegisterId.trim().length >
      100
  ) {
    errors.riskRegisterId =
      "Risk Register ID cannot exceed 100 characters.";
  }

  return errors;
};

const isAllowedEvidenceFile = (
  file: File
): boolean => {
  if (
    ALLOWED_EVIDENCE_TYPES.includes(
      file.type.toLowerCase()
    )
  ) {
    return true;
  }

  const lowerName =
    file.name.toLowerCase();

  return ALLOWED_EVIDENCE_EXTENSIONS.some(
    (extension) =>
      lowerName.endsWith(
        extension
      )
  );
};

const getEvidenceFileError = (
  files: File[]
): string => {
  if (
    files.length >
    MAX_EVIDENCE_FILES
  ) {
    return `Maximum ${MAX_EVIDENCE_FILES} images can be selected at one time.`;
  }

  const invalidTypeFile =
    files.find(
      (file) =>
        !isAllowedEvidenceFile(
          file
        )
    );

  if (invalidTypeFile) {
    return `${invalidTypeFile.name} is not a supported image. Use JPG, JPEG, PNG or WEBP.`;
  }

  const oversizedFile =
    files.find(
      (file) =>
        file.size >
        MAX_EVIDENCE_FILE_SIZE
    );

  if (oversizedFile) {
    return `${oversizedFile.name} exceeds the 10 MB size limit.`;
  }

  return "";
};

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
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
          <CheckIcon />
        </span>

        Complete
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
      <span className="relative flex size-3">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-30" />

        <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
      </span>

      In Progress
    </span>
  );
}

/* =========================================================
   INFORMATION ITEM
   ========================================================= */

function InformationItem({
  label,
  value,
}: InformationItemProps) {
  const displayValue =
    value === undefined ||
    value === null ||
    value === ""
      ? "—"
      : String(value);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-gray-900 dark:text-white">
        {displayValue}
      </p>
    </div>
  );
}

/* =========================================================
   FIELD ERROR
   ========================================================= */

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

/* =========================================================
   EVIDENCE GALLERY
   ========================================================= */

function EvidenceGallery({
  title,
  type,
  evidences,
  selectedFiles,
  inputRef,
  disabled,
  busyAction,
  onFilesChange,
  onUpload,
  onDelete,
}: EvidenceGalleryProps) {
  const uploading =
    busyAction ===
    `upload_${type}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-xl ${
              type === "before"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            }`}
          >
            <ImageIcon />
          </span>

          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {evidences.length} image
              {evidences.length === 1
                ? ""
                : "s"}{" "}
              uploaded
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label
            className={`inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 transition dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 ${
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Select Images

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={EVIDENCE_ACCEPT}
              disabled={disabled}
              onChange={onFilesChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            disabled={
              disabled ||
              selectedFiles.length === 0
            }
            onClick={onUpload}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900"
          >
            <UploadIcon />

            {uploading
              ? "Uploading..."
              : `Upload ${title}`}
          </button>
        </div>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="border-b border-gray-200 bg-blue-50 px-5 py-3 text-xs font-semibold text-blue-700 dark:border-gray-800 dark:bg-blue-950/20 dark:text-blue-400 sm:px-6">
          {selectedFiles.length} image
          {selectedFiles.length === 1
            ? ""
            : "s"}{" "}
          selected
        </div>
      ) : null}

      {evidences.length === 0 ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
            <ImageIcon />
          </div>

          <p className="mt-4 text-sm font-bold text-gray-900 dark:text-white">
            No {title} uploaded
          </p>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Select JPG, JPEG, PNG or WEBP
            images. Maximum file size is
            10 MB.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {evidences.map(
            (evidence, index) => {
              const deleting =
                busyAction ===
                `delete_${evidence._id}`;

              const imageUrl =
                getEvidenceImageUrl(
                  evidence.imagePath
                );

              return (
                <article
                  key={evidence._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/50"
                >
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900"
                  >
                    <img
                      src={imageUrl}
                      alt={`${title} ${index + 1}`}
                      className="size-full object-cover transition duration-300 hover:scale-105"
                    />
                  </a>

                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                        {title} {index + 1}
                      </p>

                      <p className="mt-1 text-[10px] text-gray-400">
                        {formatDateTime(
                          evidence.createdAt
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      title="Delete image"
                      disabled={
                        disabled ||
                        deleting
                      }
                      onClick={() =>
                        onDelete(
                          evidence
                        )
                      }
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                    >
                      <DeleteIcon />
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
}

/* =========================================================
   LOADING VIEW
   ========================================================= */

function LoadingView() {
  return (
    <div className="space-y-4 p-5 sm:p-6">
      <div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function RiskDetailsPage() {
  const navigate =
    useNavigate();

  const {
    riskId,
  } = useParams<{
    riskId: string;
  }>();

  const [searchParams] =
    useSearchParams();

  const isUpdateMode =
    searchParams.get("mode") ===
    "update";

  const beforeInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const afterInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    details,
    setDetails,
  ] =
    useState<RiskDetailsResult | null>(
      null
    );

  const [
    project,
    setProject,
  ] =
    useState<Project | null>(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState<RiskUpdateForm>(
      INITIAL_FORM
    );

  const [
    formErrors,
    setFormErrors,
  ] =
    useState<FormErrors>({});

  const [
    beforeFiles,
    setBeforeFiles,
  ] = useState<File[]>([]);

  const [
    afterFiles,
    setAfterFiles,
  ] = useState<File[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busyAction,
    setBusyAction,
  ] =
    useState<BusyAction>("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const busy =
    Boolean(busyAction);

  /* =======================================================
     LOAD DETAILS
     ======================================================= */

  const loadDetails =
    useCallback(
      async (
        showMainLoader = false
      ) => {
        if (!riskId) {
          setError(
            "Risk ID is missing."
          );

          setLoading(false);

          return;
        }

        try {
          if (showMainLoader) {
            setLoading(true);
          }

          setError("");

          const result =
            await getRiskById(
              riskId
            );

          setDetails(result);

          setForm({
            riskRegisterId:
              result.risk
                .riskRegisterId ||
              "",

            description:
              result.risk
                .description ||
              "",
          });

          try {
            const projectResult =
              await getProjectById(
                result.risk.projectId
              );

            setProject(
              projectResult
            );
          } catch (projectError) {
            console.warn(
              "Risk project details could not be loaded:",
              projectError
            );

            setProject(null);
          }
        } catch (requestError) {
          setDetails(null);

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [riskId]
    );

  useEffect(() => {
    void loadDetails(true);
  }, [loadDetails]);

  /* =======================================================
     COMPUTED PROJECT VALUES
     ======================================================= */

  const projectReferenceNo =
    useMemo(() => {
      if (project) {
        return (
          getProjectReferenceNumber(
            project
          ) ||
          details?.risk
            .projectReferenceNo ||
          details?.risk
            .projectCode ||
          ""
        );
      }

      return (
        details?.risk
          .projectReferenceNo ||
        details?.risk
          .projectCode ||
        ""
      );
    }, [
      details?.risk.projectCode,
      details?.risk.projectReferenceNo,
      project,
    ]);

  const riskRegisterIdEnabled =
    project?.settings
      ?.riskRegisterIdEnabled ===
    true;

  const riskTitle =
    details?.risk.riskRegisterId ||
    (details
      ? `Risk #${details.risk.serialNo}`
      : "Risk Details");

  /* =======================================================
     FORM UPDATE
     ======================================================= */

  const updateField = <
    Key extends keyof RiskUpdateForm,
  >(
    field: Key,
    value: RiskUpdateForm[Key]
  ) => {
    setForm((current) => ({
      ...current,

      [field]:
        value,
    }));

    setFormErrors((current) => ({
      ...current,

      [field]:
        undefined,
    }));

    setError("");
    setSuccess("");
  };

  const resetUpdateForm = () => {
    if (!details) {
      return;
    }

    setForm({
      riskRegisterId:
        details.risk
          .riskRegisterId ||
        "",

      description:
        details.risk
          .description ||
        "",
    });

    setFormErrors({});
    setError("");
  };

  /* =======================================================
     UPDATE RISK
     ======================================================= */

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !riskId ||
      !details
    ) {
      return;
    }

    const validationErrors =
      validateForm(
        form,
        riskRegisterIdEnabled
      );

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setFormErrors(
        validationErrors
      );

      return;
    }

    const payload:
      UpdateRiskPayload = {
      description:
        form.description.trim(),
    };

    if (
      riskRegisterIdEnabled
    ) {
      const riskRegisterId =
        form.riskRegisterId
          .trim()
          .toUpperCase();

      payload.riskRegisterId =
        riskRegisterId ||
        null;
    }

    try {
      setBusyAction("update");
      setError("");
      setSuccess("");

      await updateRisk(
        riskId,
        payload
      );

      await loadDetails();

      setSuccess(
        "Risk updated successfully."
      );

      navigate(
        `/risks/${riskId}`,
        {
          replace: true,
        }
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError
        )
      );
    } finally {
      setBusyAction("");
    }
  };

  /* =======================================================
     FILE SELECTION
     ======================================================= */

  const handleFileChange = (
    type: EvidenceType,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files ??
          []
      );

    const fileError =
      getEvidenceFileError(
        files
      );

    if (fileError) {
      setError(fileError);
      setSuccess("");

      event.target.value = "";

      if (
        type === "before"
      ) {
        setBeforeFiles([]);
      } else {
        setAfterFiles([]);
      }

      return;
    }

    if (
      type === "before"
    ) {
      setBeforeFiles(files);
    } else {
      setAfterFiles(files);
    }

    setError("");
    setSuccess("");
  };

  /* =======================================================
     UPLOAD EVIDENCE
     ======================================================= */

  const handleEvidenceUpload =
    async (
      type: EvidenceType
    ) => {
      if (!riskId) {
        return;
      }

      const files =
        type === "before"
          ? beforeFiles
          : afterFiles;

      if (
        files.length === 0
      ) {
        setError(
          `Please select ${type} Evidence images.`
        );

        return;
      }

      const fileError =
        getEvidenceFileError(
          files
        );

      if (fileError) {
        setError(fileError);

        return;
      }

      try {
        setBusyAction(
          `upload_${type}`
        );

        setError("");
        setSuccess("");

        if (
          type === "before"
        ) {
          await uploadBeforeEvidence(
            riskId,
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
            riskId,
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

        await loadDetails();

        setSuccess(
          `${type === "before" ? "Before" : "After"} Evidence uploaded successfully.`
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  /* =======================================================
     DELETE EVIDENCE
     ======================================================= */

  const handleDeleteEvidence =
    async (
      evidence: Evidence
    ) => {
      if (!riskId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete this ${evidence.evidenceType} Evidence image?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBusyAction(
          `delete_${evidence._id}`
        );

        setError("");
        setSuccess("");

        await deleteEvidence(
          riskId,
          evidence._id
        );

        await loadDetails();

        setSuccess(
          "Evidence image deleted successfully."
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  /* =======================================================
     MARK COMPLETE
     ======================================================= */

  const handleMarkComplete =
    async () => {
      if (
        !riskId ||
        !details
      ) {
        return;
      }

      if (
        !details.evidence
          .canMarkComplete
      ) {
        setError(
          "At least one Before Evidence image and one After Evidence image are required."
        );

        return;
      }

      try {
        setBusyAction(
          "complete"
        );

        setError("");
        setSuccess("");

        await markRiskComplete(
          riskId
        );

        await loadDetails();

        setSuccess(
          "Risk marked Complete successfully."
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  /* =======================================================
     MARK IN PROGRESS
     ======================================================= */

  const handleMarkInProgress =
    async () => {
      if (!riskId) {
        return;
      }

      try {
        setBusyAction(
          "in_progress"
        );

        setError("");
        setSuccess("");

        await markRiskInProgress(
          riskId
        );

        await loadDetails();

        setSuccess(
          "Risk moved to In Progress."
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setBusyAction("");
      }
    };

  /* =======================================================
     CLOSE DRAWER
     ======================================================= */

  const handleClose = () => {
    navigate("/risks");
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <button
        type="button"
        aria-label="Close Risk details"
        onClick={handleClose}
        className="absolute inset-0 size-full bg-gray-950/45 backdrop-blur-[2px]"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-6xl flex-col bg-gray-50 shadow-2xl dark:bg-gray-950">
        {/* =================================================
            DRAWER HEADER
            ================================================= */}

        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Back to Risk Register"
            >
              <BackIcon />
            </button>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Risk Register
              </p>

              <h1 className="mt-1 truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                {riskTitle}
              </h1>
            </div>
          </div>

          <button
            type="button"
            title="Close"
            onClick={handleClose}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <CloseIcon />
          </button>
        </header>

        {/* =================================================
            CONTENT
            ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <LoadingView />
          ) : !details ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  {error ||
                    "Risk details could not be loaded."}
                </p>

                <Link
                  to="/risks"
                  className="mt-4 inline-flex text-sm font-bold text-red-700 underline"
                >
                  Back to Risk Register
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5 p-4 sm:p-6">
              {/* ===========================================
                  MESSAGES
                  =========================================== */}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {success}
                  </p>
                </div>
              ) : null}

              {/* ===========================================
                  RISK HEADER
                  =========================================== */}

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge
                        status={
                          details.risk
                            .status
                        }
                      />

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        {projectReferenceNo ||
                          "Reference unavailable"}
                      </span>

                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        Sr. No.{" "}
                        {
                          details.risk
                            .serialNo
                        }
                      </span>
                    </div>

                    <h2 className="mt-5 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                      {details.risk
                        .riskRegisterId ||
                        `Risk #${details.risk.serialNo}`}
                    </h2>

                    <p className="mt-3 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                      {
                        details.risk
                          .description
                      }
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setBusyAction(
                          "refresh"
                        );

                        void loadDetails().finally(
                          () => {
                            setBusyAction(
                              ""
                            );
                          }
                        );
                      }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <span
                        className={
                          busyAction ===
                          "refresh"
                            ? "animate-spin"
                            : ""
                        }
                      >
                        <RefreshIcon />
                      </span>

                      Refresh
                    </button>

                    {!isUpdateMode ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          navigate(
                            `/risks/${riskId}?mode=update`
                          )
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
                      >
                        <EditIcon />

                        Update
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* ===========================================
                  VIEW OR UPDATE
                  =========================================== */}

              {isUpdateMode ? (
                <form
                  onSubmit={handleUpdate}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Update Risk
                    </h2>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Risk description aur
                      optional Risk Register
                      ID update karein.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Project
                      </label>

                      <input
                        type="text"
                        readOnly
                        value={
                          project?.title ||
                          projectReferenceNo
                        }
                        className={`${INPUT_CLASSES} cursor-not-allowed bg-gray-100 font-semibold dark:bg-gray-900`}
                      />

                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Risk ko doosray
                        project mein move
                        nahi kiya ja sakta.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Serial No.
                      </label>

                      <input
                        type="text"
                        readOnly
                        value={
                          details.risk
                            .serialNo
                        }
                        className={`${INPUT_CLASSES} cursor-not-allowed bg-gray-100 font-bold dark:bg-gray-900`}
                      />

                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Serial number
                        automatically generated
                        aur immutable hai.
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      {riskRegisterIdEnabled ? (
                        <>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <label
                              htmlFor="updateRiskRegisterId"
                              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                              Risk Register ID
                            </label>

                            <span className="text-xs font-medium text-gray-400">
                              Optional
                            </span>
                          </div>

                          <input
                            id="updateRiskRegisterId"
                            type="text"
                            value={
                              form.riskRegisterId
                            }
                            disabled={busy}
                            maxLength={100}
                            onChange={(event) =>
                              updateField(
                                "riskRegisterId",
                                normalizeUppercaseValue(
                                  event.target.value
                                )
                              )
                            }
                            placeholder="Example: R-001"
                            className={`${INPUT_CLASSES} uppercase ${
                              formErrors.riskRegisterId
                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                : ""
                            }`}
                          />

                          <FieldError
                            message={
                              formErrors
                                .riskRegisterId
                            }
                          />

                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Blank save karne
                            par existing Risk
                            Register ID remove
                            ho jayegi.
                          </p>
                        </>
                      ) : (
                        <>
                          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Risk Register ID
                          </label>

                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {details.risk
                                .riskRegisterId ||
                                "No Risk Register ID assigned"}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              Risk Register ID
                              is project ki
                              settings mein
                              disabled hai.
                              Existing value
                              preserve rahegi,
                              lekin edit nahi
                              hogi.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <label
                          htmlFor="updateDescription"
                          className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                        >
                          Description

                          <span className="ml-1 text-red-500">
                            *
                          </span>
                        </label>

                        <span className="text-xs text-gray-400">
                          {
                            form.description
                              .length
                          }
                          /3000
                        </span>
                      </div>

                      <textarea
                        id="updateDescription"
                        value={
                          form.description
                        }
                        disabled={busy}
                        maxLength={3000}
                        onChange={(event) =>
                          updateField(
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Describe the complete risk finding clearly..."
                        className={`${TEXTAREA_CLASSES} ${
                          formErrors.description
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : ""
                        }`}
                      />

                      <FieldError
                        message={
                          formErrors.description
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:px-6">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        resetUpdateForm();

                        navigate(
                          `/risks/${riskId}`,
                          {
                            replace: true,
                          }
                        );
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckIcon />

                      {busyAction ===
                      "update"
                        ? "Updating..."
                        : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <section className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 md:grid-cols-2 xl:grid-cols-3">
                  <InformationItem
                    label="Project"
                    value={
                      project?.title
                    }
                  />

                  <InformationItem
                    label="Project Reference No."
                    value={
                      projectReferenceNo
                    }
                  />

                  <InformationItem
                    label="Serial No."
                    value={
                      details.risk
                        .serialNo
                    }
                  />

                  <InformationItem
                    label="Risk Register ID"
                    value={
                      details.risk
                        .riskRegisterId
                    }
                  />

                  <InformationItem
                    label="Risk Register ID Setting"
                    value={
                      project
                        ? riskRegisterIdEnabled
                          ? "Enabled"
                          : "Disabled"
                        : "Unavailable"
                    }
                  />

                  <InformationItem
                    label="Created"
                    value={formatDateTime(
                      details.risk
                        .createdAt
                    )}
                  />

                  <InformationItem
                    label="Last Updated"
                    value={formatDateTime(
                      details.risk
                        .updatedAt
                    )}
                  />
                </section>
              )}

              {/* ===========================================
                  WORKFLOW STATUS
                  =========================================== */}

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Completion Workflow
                    </h2>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Complete status ke
                      liye kam az kam aik
                      Before aur aik After
                      Evidence image required
                      hai.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          details.evidence
                            .beforeCount > 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        Before:{" "}
                        {
                          details.evidence
                            .beforeCount
                        }
                      </span>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          details.evidence
                            .afterCount > 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        After:{" "}
                        {
                          details.evidence
                            .afterCount
                        }
                      </span>
                    </div>
                  </div>

                  {details.risk.status ===
                  "complete" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        void handleMarkInProgress();
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
                    >
                      {busyAction ===
                      "in_progress"
                        ? "Updating..."
                        : "Move to In Progress"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        busy ||
                        !details.evidence
                          .canMarkComplete
                      }
                      onClick={() => {
                        void handleMarkComplete();
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckIcon />

                      {busyAction ===
                      "complete"
                        ? "Completing..."
                        : "Mark Complete"}
                    </button>
                  )}
                </div>
              </section>

              {/* ===========================================
                  BEFORE EVIDENCE
                  =========================================== */}

              <EvidenceGallery
                title="Before Evidence"
                type="before"
                evidences={
                  details.evidence.before
                }
                selectedFiles={
                  beforeFiles
                }
                inputRef={
                  beforeInputRef
                }
                disabled={busy}
                busyAction={busyAction}
                onFilesChange={(event) =>
                  handleFileChange(
                    "before",
                    event
                  )
                }
                onUpload={() => {
                  void handleEvidenceUpload(
                    "before"
                  );
                }}
                onDelete={(evidence) => {
                  void handleDeleteEvidence(
                    evidence
                  );
                }}
              />

              {/* ===========================================
                  AFTER EVIDENCE
                  =========================================== */}

              <EvidenceGallery
                title="After Evidence"
                type="after"
                evidences={
                  details.evidence.after
                }
                selectedFiles={
                  afterFiles
                }
                inputRef={
                  afterInputRef
                }
                disabled={busy}
                busyAction={busyAction}
                onFilesChange={(event) =>
                  handleFileChange(
                    "after",
                    event
                  )
                }
                onUpload={() => {
                  void handleEvidenceUpload(
                    "after"
                  );
                }}
                onDelete={(evidence) => {
                  void handleDeleteEvidence(
                    evidence
                  );
                }}
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}