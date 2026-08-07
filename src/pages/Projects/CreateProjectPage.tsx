import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  isAxiosError,
} from "axios";

import {
  Link,
  useNavigate,
} from "react-router";

import CalendarDatePicker from "../../components/form/CalendarDatePicker";

import {
  createProject,
  type CreateProjectPayload,
  type OverallRiskLevel,
  type ProjectStatus,
  type ProjectType,
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

  status: ProjectStatus;
  overallRiskLevel: OverallRiskLevel;

  riskRegisterIdEnabled: boolean;
  clientAccessEnabled: boolean;

  notes: string;
};

type FormErrors = Partial<
  Record<
    keyof ProjectFormData | "form",
    string
  >
>;

/* =========================================================
   INITIAL FORM
   ========================================================= */

const initialFormData: ProjectFormData = {
  title: "",
  description: "",
  projectType:
    "risk_rectification",

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

  status: "draft",

  overallRiskLevel:
    "high_to_critical",

  riskRegisterIdEnabled:
    false,

  clientAccessEnabled:
    true,

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
    value:
      "risk_rectification",

    label:
      "Risk Rectification",
  },

  {
    value:
      "electrical_audit",

    label:
      "Electrical Audit",
  },

  {
    value:
      "energy_audit",

    label:
      "Energy Audit",
  },

  {
    value:
      "solar_installation",

    label:
      "Solar Installation",
  },

  {
    value:
      "testing_commissioning",

    label:
      "Testing & Commissioning",
  },

  {
    value: "other",
    label: "Other",
  },
];

const statusOptions: Array<{
  value: ProjectStatus;
  label: string;
}> = [
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
    value:
      "awaiting_verification",

    label:
      "Awaiting Verification",
  },

  {
    value: "completed",
    label: "Completed",
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
    value:
      "high_to_critical",

    label:
      "High to Critical",
  },
];

/* =========================================================
   ERROR HELPERS
   ========================================================= */

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
        Array.isArray(
          data.errors
        )
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

  return "Project create nahi ho saka. Dobara try karein.";
};

/* =========================================================
   UI HELPERS
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
  children: React.ReactNode;
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

const ProjectIcon = () => (
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
    <path d="M12 3L20 6V11C20 16 16.6 19.7 12 21C7.4 19.7 4 16 4 11V6L12 3Z" />

    <path d="M9 12L11 14L15.5 9.5" />
  </svg>
);

/* =========================================================
   CREATE PROJECT PAGE
   ========================================================= */

export default function CreateProjectPage() {
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
    errors,
    setErrors,
  ] =
    useState<FormErrors>({});

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

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

        [name]: undefined,

        form: undefined,
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
        isSubmitting ||
        !validateForm()
      ) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      try {
        setIsSubmitting(true);
        setErrors({});

        const payload:
          CreateProjectPayload = {
          title:
            formData.title
              .trim(),

          projectType:
            formData
              .projectType,

          status:
            formData.status,

          overallRiskLevel:
            formData
              .overallRiskLevel,

          settings: {
            riskRegisterIdEnabled:
              formData
                .riskRegisterIdEnabled,
          },

          clientAccessEnabled:
            formData
              .clientAccessEnabled,

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

          startDate:
            formData.startDate,

          expectedCompletionDate:
            formData
              .expectedCompletionDate,

          ...(formData
            .description
            .trim()
            ? {
                description:
                  formData
                    .description
                    .trim(),
              }
            : {}),

          ...(formData.auditDate
            ? {
                auditDate:
                  formData
                    .auditDate,
              }
            : {}),

          ...(formData
            .systemCapacityKW
            .trim()
            ? {
                systemCapacityKW:
                  Number(
                    formData
                      .systemCapacityKW
                  ),
              }
            : {}),

          ...(formData.notes
            .trim()
            ? {
                notes:
                  formData.notes
                    .trim(),
              }
            : {}),
        };

        const createdProject =
          await createProject(
            payload
          );

        navigate(
          `/projects/${createdProject._id}`,
          {
            replace: true,

            state: {
              successMessage:
                `Project ${
                  createdProject.projectReferenceNo ||
                  createdProject.projectCode ||
                  ""
                } successfully create ho gaya.`,
            },
          }
        );
      } catch (error) {
        console.error(
          "Project creation failed:",
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
          behavior: "smooth",
        });
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="min-w-0 space-y-6"
    >
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ProjectIcon />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Project Management
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                Create New Project
              </h1>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Basic project, client,
                site aur schedule
                information enter
                karein. Project
                Reference Number
                automatically generate
                hoga.
              </p>
            </div>
          </div>

          <Link
            to="/projects"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <BackIcon />

            Back to Projects
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

      {/* ===================================================
          PROJECT INFORMATION
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Project Information"
          description="Project ki identification, type, current status aur scope."
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
              placeholder="e.g. Three-Month Electrical Rectification Project"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-3 dark:text-white ${
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

            <div className="flex h-11 items-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              Automatically generated
            </div>
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
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Status
            </label>

            <select
              id="status"
              name="status"
              value={
                formData.status
              }
              onChange={
                handleInputChange
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            >
              {statusOptions.map(
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
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-3 dark:text-white ${
                errors.systemCapacityKW
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
              }`}
            />

            <InputError
              message={
                errors.systemCapacityKW
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
              placeholder="Project scope, objectives aur expected deliverables..."
              rows={4}
              className="w-full resize-y rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
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
              placeholder="Client representative name"
              autoComplete="name"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-3 dark:text-white ${
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
              placeholder="Company or organization name"
              autoComplete="organization"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
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
              placeholder="client@company.com"
              autoComplete="email"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-3 dark:text-white ${
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
              placeholder="+92 300 0000000"
              autoComplete="tel"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
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
              placeholder="e.g. Main Factory Site"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-3 dark:text-white ${
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
              placeholder="Complete site location or address"
              autoComplete="street-address"
              className={`h-11 w-full rounded-xl border bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-3 dark:text-white ${
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
              placeholder="e.g. Lahore"
              autoComplete="address-level2"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
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
              placeholder="e.g. Punjab"
              autoComplete="address-level1"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
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
              placeholder="Pakistan"
              autoComplete="country-name"
              className="h-11 w-full rounded-xl border border-gray-200 bg-transparent px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          PROJECT SCHEDULE
          =================================================== */}

      <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Audit & Project Schedule"
          description="Audit, execution start aur expected completion date select karein."
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
          description="Risk Register aur client access ki project-level settings."
        />

        <div className="space-y-4 p-5 sm:p-6">
          <label className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                Enable Risk Register ID
              </span>

              <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                Enable hone par
                Create Risk form mein
                optional Risk Register
                ID field show hogi.
                Disabled hone par Sr.
                No. automatically use
                hoga.
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

          <label className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                Enable Client Access
              </span>

              <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                Client ke liye secure
                project tracking access
                token generate hoga.
              </span>
            </div>

            <input
              name="clientAccessEnabled"
              type="checkbox"
              checked={
                formData
                  .clientAccessEnabled
              }
              onChange={
                handleInputChange
              }
              className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 accent-emerald-600"
            />
          </label>
        </div>
      </section>

      {/* ===================================================
          INTERNAL NOTES
          =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <SectionHeader
          title="Internal Notes"
          description="Internal instructions, limitations aur client commitments."
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
            placeholder="Internal instructions, limitations, client commitments or project remarks..."
            rows={4}
            className="w-full resize-y rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/10 dark:border-gray-700 dark:text-white"
          />
        </div>
      </section>

      {/* ===================================================
          AUTO-CALCULATION NOTICE
          =================================================== */}

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
          Risk summary aur project
          progress manually enter nahi
          hongi.
        </p>

        <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">
          Total risks, completed work,
          evidence, action-plan progress
          aur testing progress actual
          tracker records se
          automatically calculate hongi.
        </p>
      </section>

      {/* ===================================================
          SUBMIT BAR
          =================================================== */}

      <section className="sticky bottom-4 z-20 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/projects"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Creating Project...
              </>
            ) : (
              <>
                <SaveIcon />

                Create Project
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}