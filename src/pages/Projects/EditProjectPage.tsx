import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { isAxiosError } from "axios";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import CalendarDatePicker from "../../components/form/CalendarDatePicker";

import {
  getProjectById,
  getProjectReferenceNumber,
  updateProject,
  type OverallRiskLevel,
  type ProjectType,
  type UpdateProjectPayload,
} from "../../services/project/project.service";

/* =========================================================
   TYPES
   ========================================================= */

type ProjectFormData = {
  title: string;
  description: string;
  projectType: ProjectType;

  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;

  siteName: string;
  siteLocation: string;
  city: string;
  province: string;
  country: string;

  systemCapacityKW: string;

  auditDate: string;
  startDate: string;
  expectedCompletionDate: string;

  overallRiskLevel: OverallRiskLevel;

  riskRegisterIdEnabled: boolean;

  notes: string;
};

type FormErrors = Partial<
  Record<
    keyof ProjectFormData | "form",
    string
  >
>;

/* =========================================================
   INITIAL FORM DATA
   ========================================================= */

const initialFormData: ProjectFormData = {
  title: "",
  description: "",
  projectType: "risk_rectification",

  clientName: "",
  clientCompany: "",
  clientEmail: "",
  clientPhone: "",

  siteName: "",
  siteLocation: "",
  city: "",
  province: "",
  country: "Pakistan",

  systemCapacityKW: "",

  auditDate: "",
  startDate: "",
  expectedCompletionDate: "",

  overallRiskLevel: "high_to_critical",

  riskRegisterIdEnabled: false,

  notes: "",
};

/* =========================================================
   OPTIONS
   ========================================================= */

const projectTypeOptions: Array<{
  value: ProjectType;
  label: string;
}> = [
  {
    value: "risk_rectification",
    label: "Task / Rectification Project",
  },
  {
    value: "electrical_audit",
    label: "Electrical Audit",
  },
  {
    value: "energy_audit",
    label: "Energy Audit",
  },
  {
    value: "solar_installation",
    label: "Solar Installation",
  },
  {
    value: "testing_commissioning",
    label: "Testing & Commissioning",
  },
  {
    value: "other",
    label: "Other",
  },
];

const riskLevelOptions: Array<{
  value: OverallRiskLevel;
  label: string;
}> = [
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
  {
    value: "high_to_critical",
    label: "High to Critical",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const formatDateForInput = (
  value?: string | null
): string => {
  if (!value) {
    return "";
  }

  const directDate =
    value.slice(0, 10);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      directDate
    )
  ) {
    return directDate;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
};

const getApiErrorMessage = (
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
          errors?: unknown;
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

      if (
        Array.isArray(data.errors)
      ) {
        const messages =
          data.errors
            .map((item) => {
              if (
                typeof item ===
                  "object" &&
                item !== null &&
                "message" in item &&
                typeof item.message ===
                  "string"
              ) {
                return item.message;
              }

              return null;
            })
            .filter(
              (
                message
              ): message is string =>
                Boolean(message)
            );

        if (
          messages.length > 0
        ) {
          return messages.join(
            ", "
          );
        }
      }
    }

    if (
      error.code ===
      "ERR_NETWORK"
    ) {
      return "Backend server se connection nahi ho saka. Server aur API URL check karein.";
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Project update nahi ho saka. Dobara try karein.";
};

/* =========================================================
   SMALL UI COMPONENTS
   ========================================================= */

function InputError({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function RequiredLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}

      <span className="ml-1 text-red-500">
        *
      </span>
    </>
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

const SaveIcon = () => (
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
    <path d="M5 3H17L21 7V21H5V3Z" />
    <path d="M8 3V9H16V3" />
    <path d="M8 21V14H18V21" />
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
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M12 20H5C4.4 20 4 19.6 4 19V12" />

    <path d="M16.5 3.5C17.3 2.7 18.7 2.7 19.5 3.5C20.3 4.3 20.3 5.7 19.5 6.5L10 16L6 17L7 13L16.5 3.5Z" />
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
   EDIT PROJECT PAGE
   ========================================================= */

export default function EditProjectPage() {
  const {
    projectId,
  } = useParams<{
    projectId: string;
  }>();

  const navigate =
    useNavigate();

  const [
    formData,
    setFormData,
  ] =
    useState<ProjectFormData>(
      initialFormData
    );

  const [
    projectReferenceNo,
    setProjectReferenceNo,
  ] = useState("");

  const [
    projectTitle,
    setProjectTitle,
  ] = useState("");

  const [
    currentStatus,
    setCurrentStatus,
  ] = useState("");

  const [
    errors,
    setErrors,
  ] =
    useState<FormErrors>({});

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /* =======================================================
     FETCH PROJECT
     ======================================================= */

  const fetchProject =
    useCallback(
      async () => {
        if (!projectId) {
          setErrors({
            form:
              "Project ID available nahi hai.",
          });

          setIsLoading(false);

          return;
        }

        try {
          setIsLoading(true);
          setErrors({});

          const project =
            await getProjectById(
              projectId
            );

          setProjectTitle(
            project.title
          );

          setProjectReferenceNo(
            getProjectReferenceNumber(
              project
            )
          );

          setCurrentStatus(
            project.status ||
            "draft"
          );

          setFormData({
            title:
              project.title ||
              "",

            description:
              project.description ||
              "",

            projectType:
              project.projectType ||
              "risk_rectification",

            clientName:
              project.client
                .name ||
              "",

            clientCompany:
              project.client
                .company ||
              "",

            clientEmail:
              project.client
                .email ||
              "",

            clientPhone:
              project.client
                .phone ||
              "",

            siteName:
              project.site.name ||
              "",

            siteLocation:
              project.site
                .location ||
              "",

            city:
              project.site.city ||
              "",

            province:
              project.site
                .province ||
              "",

            country:
              project.site
                .country ||
              "Pakistan",

            systemCapacityKW:
              project.systemCapacityKW !==
              undefined
                ? String(
                    project
                      .systemCapacityKW
                  )
                : "",

            auditDate:
              formatDateForInput(
                project.auditDate
              ),

            startDate:
              formatDateForInput(
                project.startDate
              ),

            expectedCompletionDate:
              formatDateForInput(
                project
                  .expectedCompletionDate
              ),

            overallRiskLevel:
              project
                .overallRiskLevel ||
              "high_to_critical",

            riskRegisterIdEnabled:
              project.settings
                ?.riskRegisterIdEnabled ===
              true,

            notes:
              project.notes ||
              "",
          });
        } catch (error) {
          console.error(
            "Project loading failed:",
            error
          );

          setErrors({
            form:
              getApiErrorMessage(
                error
              ),
          });
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
     INPUT CHANGE
     ======================================================= */

  const handleInputChange = (
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >
  ) => {
    const target =
      event.target;

    const name =
      target.name as
        keyof ProjectFormData;

    const value =
      target instanceof
        HTMLInputElement &&
      target.type ===
        "checkbox"
        ? target.checked
        : target.value;

    setFormData(
      (current) => ({
        ...current,

        [name]: value,
      })
    );

    setErrors(
      (current) => ({
        ...current,

        [name]:
          undefined,

        form:
          undefined,
      })
    );
  };

  /* =======================================================
     VALIDATION
     ======================================================= */

  const validateForm =
    (): boolean => {
      const nextErrors:
        FormErrors = {};

      if (
        !formData.title.trim()
      ) {
        nextErrors.title =
          "Project title required hai.";
      } else if (
        formData.title
          .trim()
          .length < 3
      ) {
        nextErrors.title =
          "Project title kam az kam 3 characters ka hona chahiye.";
      } else if (
        formData.title
          .trim()
          .length > 200
      ) {
        nextErrors.title =
          "Project title 200 characters se zyada nahi ho sakta.";
      }

      if (
        !formData
          .clientName
          .trim()
      ) {
        nextErrors.clientName =
          "Client name required hai.";
      }

      if (
        formData
          .clientEmail
          .trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData
            .clientEmail
            .trim()
        )
      ) {
        nextErrors.clientEmail =
          "Valid client email enter karein.";
      }

      if (
        !formData
          .siteName
          .trim()
      ) {
        nextErrors.siteName =
          "Site name required hai.";
      }

      if (
        !formData
          .siteLocation
          .trim()
      ) {
        nextErrors.siteLocation =
          "Complete site address required hai.";
      }

      if (
        !formData.startDate
      ) {
        nextErrors.startDate =
          "Project start date required hai.";
      }

      if (
        !formData
          .expectedCompletionDate
      ) {
        nextErrors.expectedCompletionDate =
          "Expected completion date required hai.";
      }

      if (
        formData.auditDate &&
        formData.startDate &&
        new Date(
          formData.startDate
        ) <
          new Date(
            formData.auditDate
          )
      ) {
        nextErrors.startDate =
          "Project start date audit date se pehle nahi ho sakti.";
      }

      if (
        formData.startDate &&
        formData
          .expectedCompletionDate &&
        new Date(
          formData
            .expectedCompletionDate
        ) <
          new Date(
            formData.startDate
          )
      ) {
        nextErrors.expectedCompletionDate =
          "Expected completion date start date se pehle nahi ho sakti.";
      }

      if (
        formData
          .systemCapacityKW
          .trim()
      ) {
        const capacity =
          Number(
            formData
              .systemCapacityKW
          );

        if (
          !Number.isFinite(
            capacity
          ) ||
          capacity < 0
        ) {
          nextErrors.systemCapacityKW =
            "System capacity zero ya positive number honi chahiye.";
        }
      }

      setErrors(
        nextErrors
      );

      return (
        Object.keys(
          nextErrors
        ).length === 0
      );
    };

  /* =======================================================
     SUBMIT
     ======================================================= */

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !projectId ||
        isSubmitting ||
        !validateForm()
      ) {
        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });

        return;
      }

      try {
        setIsSubmitting(true);
        setErrors({});

        const payload:
          UpdateProjectPayload = {
          title:
            formData.title
              .trim(),

          description:
            formData
              .description
              .trim(),

          projectType:
            formData
              .projectType,

          overallRiskLevel:
            formData
              .overallRiskLevel,

          settings: {
            riskRegisterIdEnabled:
              formData
                .riskRegisterIdEnabled,
          },

          client: {
            name:
              formData
                .clientName
                .trim(),

            company:
              formData
                .clientCompany
                .trim(),

            email:
              formData
                .clientEmail
                .trim()
                .toLowerCase(),

            phone:
              formData
                .clientPhone
                .trim(),
          },

          site: {
            name:
              formData
                .siteName
                .trim(),

            location:
              formData
                .siteLocation
                .trim(),

            city:
              formData.city
                .trim(),

            province:
              formData
                .province
                .trim(),

            country:
              formData
                .country
                .trim() ||
              "Pakistan",
          },

          systemCapacityKW:
            formData
              .systemCapacityKW
              .trim()
              ? Number(
                  formData
                    .systemCapacityKW
                )
              : 0,

          auditDate:
            formData.auditDate ||
            undefined,

          startDate:
            formData.startDate,

          expectedCompletionDate:
            formData
              .expectedCompletionDate,

          notes:
            formData.notes
              .trim(),
        };

        await updateProject(
          projectId,
          payload
        );

        navigate(
          `/projects/${projectId}`,
          {
            replace: true,

            state: {
              successMessage:
                "Project successfully update ho gaya.",
            },
          }
        );
      } catch (error) {
        console.error(
          "Project update failed:",
          error
        );

        setErrors({
          form:
            getApiErrorMessage(
              error
            ),
        });

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  /* =======================================================
     LOADING
     ======================================================= */

  if (isLoading) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="h-36 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />

        {Array.from({
          length: 5,
        }).map(
          (_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
            />
          )
        )}
      </div>
    );
  }

  /* =======================================================
     LOAD ERROR
     ======================================================= */

  if (
    errors.form &&
    !formData.title
  ) {
    return (
      <section className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm dark:border-red-500/20 dark:bg-gray-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <EditIcon />
        </div>

        <h1 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
          Project load nahi ho saka
        </h1>

        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
          {errors.form}
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

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="min-w-0 space-y-6"
    >
      {/* ===================================================
          HEADER
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <EditIcon />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Project Management
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                Edit Project
              </h1>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                {projectTitle ||
                  "Project details"}{" "}
                ki basic information,
                client, site, schedule aur
                settings update karein.
              </p>
            </div>
          </div>

          <Link
            to={`/projects/${projectId}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <BackIcon />

            Project Details
          </Link>
        </div>
      </section>

      {/* ===================================================
          FORM ERROR
          =================================================== */}

      {errors.form ? (
        <section className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {errors.form}
          </p>

          <button
            type="button"
            onClick={() => {
              setErrors(
                (current) => ({
                  ...current,

                  form:
                    undefined,
                })
              );
            }}
            className="text-lg font-bold text-red-700 dark:text-red-400"
            aria-label="Close error"
          >
            ×
          </button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
        <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
          Project lifecycle is controlled separately.
        </p>

        <p className="mt-1 text-xs leading-5 text-violet-700 dark:text-violet-400">
          Edit Project sirf project ki information aur planned schedule update karta hai. Project status aur actual completion ko manually edit karne ke bajaye Project Details page ke lifecycle actions use karein.
        </p>
      </section>

      {/* ===================================================
          PROJECT INFORMATION
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Project Information"
          description="Project title, reference, type aur scope update karein. Lifecycle status Project Details page se manage hoga."
        />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <RequiredLabel>
                Project Title
              </RequiredLabel>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={
                formData.title
              }
              onChange={
                handleInputChange
              }
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:ring-3 dark:text-white ${
                errors.title
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
              }`}
            />

            <InputError
              message={
                errors.title
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Reference No.
            </label>

            <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-emerald-700 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-400">
              {projectReferenceNo ||
                "Automatically generated"}
            </div>

            <p className="mt-1.5 text-xs text-gray-400">
              Project Reference Number
              change nahi ho sakta.
            </p>
          </div>

          <div>
            <label
              htmlFor="projectType"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Type
            </label>

            <select
              id="projectType"
              name="projectType"
              value={
                formData
                  .projectType
              }
              onChange={
                handleInputChange
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {projectTypeOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Project Status
            </label>

            <div className="flex min-h-11 items-center rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-semibold capitalize text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              {currentStatus
                ? currentStatus
                    .split("_")
                    .join(" ")
                : "Draft"}
            </div>

            <p className="mt-1.5 text-xs leading-5 text-gray-400">
              Status yahan editable nahi hai. Start, Hold, Resume, Complete aur Archive actions Project Details page se perform hongi.
            </p>
          </div>

          <div>
            <label
              htmlFor="overallRiskLevel"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Overall Risk Level
            </label>

            <select
              id="overallRiskLevel"
              name="overallRiskLevel"
              value={
                formData
                  .overallRiskLevel
              }
              onChange={
                handleInputChange
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {riskLevelOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="systemCapacityKW"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              System Capacity
              <span className="ml-1 text-xs text-gray-400">
                kW
              </span>
            </label>

            <input
              id="systemCapacityKW"
              name="systemCapacityKW"
              type="number"
              min="0"
              step="0.01"
              value={
                formData
                  .systemCapacityKW
              }
              onChange={
                handleInputChange
              }
              placeholder="Optional"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:ring-3 dark:text-white ${
                errors.systemCapacityKW
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
              }`}
            />

            <InputError
              message={
                errors
                  .systemCapacityKW
              }
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Description
            </label>

            <textarea
              id="description"
              name="description"
              value={
                formData
                  .description
              }
              onChange={
                handleInputChange
              }
              rows={4}
              placeholder="Project scope, objectives aur expected deliverables..."
              className="w-full resize-y rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          CLIENT INFORMATION
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Client Information"
          description="Client representative aur organization ki contact information."
        />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <label
              htmlFor="clientName"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <RequiredLabel>
                Client Name
              </RequiredLabel>
            </label>

            <input
              id="clientName"
              name="clientName"
              type="text"
              value={
                formData
                  .clientName
              }
              onChange={
                handleInputChange
              }
              autoComplete="name"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:ring-3 dark:text-white ${
                errors.clientName
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
              }`}
            />

            <InputError
              message={
                errors.clientName
              }
            />
          </div>

          <div>
            <label
              htmlFor="clientCompany"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Company / Organization
            </label>

            <input
              id="clientCompany"
              name="clientCompany"
              type="text"
              value={
                formData
                  .clientCompany
              }
              onChange={
                handleInputChange
              }
              autoComplete="organization"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="clientEmail"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>

            <input
              id="clientEmail"
              name="clientEmail"
              type="email"
              value={
                formData
                  .clientEmail
              }
              onChange={
                handleInputChange
              }
              autoComplete="email"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:ring-3 dark:text-white ${
                errors.clientEmail
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
              }`}
            />

            <InputError
              message={
                errors.clientEmail
              }
            />
          </div>

          <div>
            <label
              htmlFor="clientPhone"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Phone Number
            </label>

            <input
              id="clientPhone"
              name="clientPhone"
              type="tel"
              value={
                formData
                  .clientPhone
              }
              onChange={
                handleInputChange
              }
              autoComplete="tel"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          SITE INFORMATION
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Site Information"
          description="Audit, rectification aur execution site ki details."
        />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <label
              htmlFor="siteName"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <RequiredLabel>
                Site Name
              </RequiredLabel>
            </label>

            <input
              id="siteName"
              name="siteName"
              type="text"
              value={
                formData.siteName
              }
              onChange={
                handleInputChange
              }
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:ring-3 dark:text-white ${
                errors.siteName
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
              }`}
            />

            <InputError
              message={
                errors.siteName
              }
            />
          </div>

          <div>
            <label
              htmlFor="siteLocation"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <RequiredLabel>
                Complete Site Address
              </RequiredLabel>
            </label>

            <input
              id="siteLocation"
              name="siteLocation"
              type="text"
              value={
                formData
                  .siteLocation
              }
              onChange={
                handleInputChange
              }
              autoComplete="street-address"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:ring-3 dark:text-white ${
                errors.siteLocation
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
              }`}
            />

            <InputError
              message={
                errors.siteLocation
              }
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              City
            </label>

            <input
              id="city"
              name="city"
              type="text"
              value={
                formData.city
              }
              onChange={
                handleInputChange
              }
              autoComplete="address-level2"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="province"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Province
            </label>

            <input
              id="province"
              name="province"
              type="text"
              value={
                formData.province
              }
              onChange={
                handleInputChange
              }
              autoComplete="address-level1"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="country"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Country
            </label>

            <input
              id="country"
              name="country"
              type="text"
              value={
                formData.country
              }
              onChange={
                handleInputChange
              }
              autoComplete="country-name"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          SCHEDULE
          =================================================== */}

      <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Audit & Project Schedule"
          description="Audit, planned start aur expected completion dates update karein. Actual completion date project complete karte waqt automatically record hogi."
        />

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-3">
          <CalendarDatePicker
            id="auditDate"
            name="auditDate"
            label="Audit Date"
            value={
              formData.auditDate
            }
            onChange={
              handleInputChange
            }
          />

          <CalendarDatePicker
            id="startDate"
            name="startDate"
            label="Project Start Date *"
            value={
              formData.startDate
            }
            min={
              formData.auditDate ||
              undefined
            }
            error={
              errors.startDate
            }
            onChange={
              handleInputChange
            }
          />

          <CalendarDatePicker
            id="expectedCompletionDate"
            name="expectedCompletionDate"
            label="Expected Completion *"
            value={
              formData
                .expectedCompletionDate
            }
            min={
              formData.startDate ||
              formData.auditDate ||
              undefined
            }
            error={
              errors
                .expectedCompletionDate
            }
            onChange={
              handleInputChange
            }
          />


        </div>
      </section>

      {/* ===================================================
          PROJECT SETTINGS
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Project Settings"
          description="Task Register ID field ki project-level visibility manage karein."
        />

        <div className="p-5 sm:p-6">
          <label className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                Enable Task Register ID
              </span>

              <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                Enable hone par Task
                create aur edit forms mein
                optional Task Register ID
                field show hogi. Sr. No.
                phir bhi automatically
                generate hoga.
              </span>
            </div>

            <input
              name="riskRegisterIdEnabled"
              type="checkbox"
              checked={
                formData
                  .riskRegisterIdEnabled
              }
              onChange={
                handleInputChange
              }
              className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 accent-emerald-600"
            />
          </label>

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Client access Project
              Details page se manage hoga.
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">
              Wahan se secure access
              token generate, regenerate
              ya revoke kiya ja sakta hai.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          NOTES
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Internal Notes"
          description="Internal instructions, limitations aur client commitments update karein."
        />

        <div className="p-5 sm:p-6">
          <textarea
            id="notes"
            name="notes"
            value={
              formData.notes
            }
            onChange={
              handleInputChange
            }
            rows={4}
            placeholder="Internal instructions, limitations, client commitments or project remarks..."
            className="w-full resize-y rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
          />
        </div>
      </section>

      {/* ===================================================
          AUTOMATIC DATA NOTICE
          =================================================== */}

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Project progress aur tracker
          totals automatically calculate
          hongay.
        </p>

        <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-400">
          Task count, evidence count,
          completed work, action-plan
          progress aur testing progress
          manually edit nahi ki ja sakti.
        </p>
      </section>

      {/* ===================================================
          SUBMIT BAR
          =================================================== */}

      <section className="sticky bottom-4 z-20 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              currentStatus ===
                "archived"
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Updating Project...
              </>
            ) : (
              <>
                <SaveIcon />

                Save Changes
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}