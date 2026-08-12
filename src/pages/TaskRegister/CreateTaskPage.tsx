import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router";

import {
  getActiveProjects,
  getProjectDisplayName,
  getProjectReferenceNumber,
  type Project,
} from "../../services/project/project.service";

import {
  createTask,
  type CreateTaskPayload,
} from "../../services/task_register/task.service";

/* =========================================================
   FORM TYPES
   ========================================================= */

type TaskFormState = {
  projectId: string;
  taskRegisterId: string;
  description: string;
};

type TaskFormErrors =
  Partial<
    Record<
      keyof TaskFormState,
      string
    >
  >;

/* =========================================================
   CONSTANTS
   ========================================================= */

const INITIAL_FORM: TaskFormState = {
  projectId: "",
  taskRegisterId: "",
  description: "",
};

const INPUT_CLASSES =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10 dark:disabled:bg-gray-900";

const TEXTAREA_CLASSES =
  "min-h-44 w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10 dark:disabled:bg-gray-900";

/* =========================================================
   ICONS
   ========================================================= */

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

const SaveIcon = () => (
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
    <path d="M5 3H17L21 7V21H3V5A2 2 0 0 1 5 3Z" />
    <path d="M7 3V9H16V3" />
    <path d="M7 21V14H17V21" />
  </svg>
);

const ProjectIcon = () => (
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
    <path d="M4 20V8L12 3L20 8V20" />
    <path d="M8 20V13H16V20" />
  </svg>
);

const TaskIcon = () => (
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
      x="4"
      y="4"
      width="16"
      height="16"
      rx="2"
    />
    <path d="m8 12 2 2 5-5" />
    <path d="M8 8h5" />
    <path d="M8 17h8" />
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
    const requestError =
      error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
            errors?: Array<{
              field?: string;
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
      "Task could not be created."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Task could not be created.";
};

const normalizeUppercaseValue = (
  value: string
): string => {
  return value
    .trimStart()
    .toUpperCase();
};

/* =========================================================
   PROJECT SETTING HELPER

   New canonical setting:
   taskRegisterIdEnabled

   Legacy fallback:
   riskRegisterIdEnabled
   ========================================================= */

const isTaskRegisterIdEnabled = (
  project?: Project
): boolean => {
  if (!project) {
    return false;
  }

  const settings =
    project.settings as
      | {
          taskRegisterIdEnabled?: boolean;
          riskRegisterIdEnabled?: boolean;
        }
      | undefined;

  return (
    settings?.taskRegisterIdEnabled ===
      true ||
    settings?.riskRegisterIdEnabled ===
      true
  );
};

/* =========================================================
   VALIDATION
   ========================================================= */

const validateForm = (
  form: TaskFormState,
  taskRegisterIdEnabled: boolean
): TaskFormErrors => {
  const errors: TaskFormErrors = {};

  if (!form.projectId.trim()) {
    errors.projectId =
      "Please select a project.";
  }

  const description =
    form.description.trim();

  if (!description) {
    errors.description =
      "Task description is required.";
  } else if (
    description.length < 3
  ) {
    errors.description =
      "Task description must contain at least 3 characters.";
  } else if (
    description.length > 3000
  ) {
    errors.description =
      "Task description cannot exceed 3000 characters.";
  }

  if (
    taskRegisterIdEnabled &&
    form.taskRegisterId.trim().length >
      100
  ) {
    errors.taskRegisterId =
      "Task Register ID cannot exceed 100 characters.";
  }

  return errors;
};

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
   MAIN PAGE
   ========================================================= */

export default function CreateTaskPage() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const requestedProjectId =
    searchParams
      .get("projectId")
      ?.trim() || "";

  const [form, setForm] =
    useState<TaskFormState>(
      INITIAL_FORM
    );

  const [
    formErrors,
    setFormErrors,
  ] =
    useState<TaskFormErrors>({});

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [
    projectsLoading,
    setProjectsLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     SELECTED PROJECT
     ======================================================= */

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (project) =>
            project._id ===
            form.projectId
        ),
      [
        projects,
        form.projectId,
      ]
    );

  const projectReferenceNo =
    useMemo(
      () =>
        selectedProject
          ? getProjectReferenceNumber(
              selectedProject
            )
          : "",
      [selectedProject]
    );

  const taskRegisterIdEnabled =
    isTaskRegisterIdEnabled(
      selectedProject
    );

  /* =======================================================
     LOAD ACTIVE PROJECTS
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const loadProjects =
      async () => {
        try {
          setProjectsLoading(true);
          setError("");

          const result =
            await getActiveProjects();

          if (cancelled) {
            return;
          }

          setProjects(result);

          const requestedProject =
            requestedProjectId
              ? result.find(
                  (project) =>
                    project._id ===
                    requestedProjectId
                )
              : undefined;

          const defaultProject =
            requestedProject ||
            (
              result.length === 1
                ? result[0]
                : undefined
            );

          if (defaultProject) {
            setForm(
              (current) => ({
                ...current,

                projectId:
                  defaultProject._id,
              })
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
        } finally {
          if (!cancelled) {
            setProjectsLoading(
              false
            );
          }
        }
      };

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [requestedProjectId]);

  /* =======================================================
     PROJECT CHANGE
     ======================================================= */

  const handleProjectChange = (
    projectId: string
  ) => {
    const nextProject =
      projects.find(
        (project) =>
          project._id ===
          projectId
      );

    const nextTaskRegisterIdEnabled =
      isTaskRegisterIdEnabled(
        nextProject
      );

    setForm(
      (current) => ({
        ...current,

        projectId,

        taskRegisterId:
          nextTaskRegisterIdEnabled
            ? current.taskRegisterId
            : "",
      })
    );

    setFormErrors(
      (current) => ({
        ...current,

        projectId:
          undefined,

        taskRegisterId:
          undefined,
      })
    );

    setError("");
  };

  /* =======================================================
     FIELD CHANGE
     ======================================================= */

  const updateField = <
    Key extends keyof TaskFormState,
  >(
    field: Key,
    value: TaskFormState[Key]
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setFormErrors(
      (current) => ({
        ...current,
        [field]: undefined,
      })
    );

    setError("");
  };

  /* =======================================================
     SUBMIT
     ======================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const validationErrors =
      validateForm(
        form,
        taskRegisterIdEnabled
      );

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setFormErrors(
        validationErrors
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const taskRegisterId =
      form.taskRegisterId
        .trim()
        .toUpperCase();

    const payload:
      CreateTaskPayload = {
      projectId:
        form.projectId.trim(),

      description:
        form.description.trim(),

      ...(taskRegisterIdEnabled &&
      taskRegisterId
        ? {
            taskRegisterId,
          }
        : {}),
    };

    try {
      setSubmitting(true);
      setError("");
      setFormErrors({});

      const createdTask =
        await createTask(
          payload
        );

      navigate(
        `/tasks/${createdTask._id}`,
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

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-5 xl:p-6">
        {/* HEADER */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link
                to="/tasks"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
              >
                <BackIcon />

                Back to Task Register
              </Link>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Project Progress Management
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Create Task
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Add the daily work or activity performed against the selected project.
                Before and After Evidence can be attached from the task details page.
              </p>
            </div>

            <div className="inline-flex shrink-0 items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-30" />
                <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
              </span>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  Initial Status
                </p>

                <p className="text-sm font-bold">
                  In Progress
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
        ) : null}

        <form
          onSubmit={
            handleSubmit
          }
          noValidate
          className="space-y-5"
        >
          {/* PROJECT INFORMATION */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <ProjectIcon />
              </span>

              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Project
                </h2>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select the project where this work was performed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
              <div className="min-w-0">
                <label
                  htmlFor="projectId"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Project

                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  id="projectId"
                  value={
                    form.projectId
                  }
                  disabled={
                    projectsLoading ||
                    submitting
                  }
                  onChange={(
                    event
                  ) =>
                    handleProjectChange(
                      event.target.value
                    )
                  }
                  className={`${INPUT_CLASSES} ${
                    formErrors.projectId
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : ""
                  }`}
                >
                  <option value="">
                    {projectsLoading
                      ? "Loading projects..."
                      : projects.length ===
                          0
                        ? "No active projects available"
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
                        {getProjectDisplayName(
                          project
                        )}
                      </option>
                    )
                  )}
                </select>

                <FieldError
                  message={
                    formErrors.projectId
                  }
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="projectReferenceNo"
                  className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Project Reference No.
                </label>

                <input
                  id="projectReferenceNo"
                  type="text"
                  readOnly
                  value={
                    projectReferenceNo
                  }
                  placeholder="Auto fetched from Project"
                  className={`${INPUT_CLASSES} cursor-not-allowed bg-gray-100 font-bold text-emerald-700 dark:bg-gray-900 dark:text-emerald-400`}
                />

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Automatically fetched from the selected project.
                </p>
              </div>
            </div>
          </section>

          {/* TASK INFORMATION */}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                <TaskIcon />
              </span>

              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Task Information
                </h2>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Keep it simple: describe the work performed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6">
              {/* OPTIONAL TASK REGISTER ID */}

              {selectedProject &&
              taskRegisterIdEnabled ? (
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="taskRegisterId"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Task Register ID
                    </label>

                    <span className="text-xs font-medium text-gray-400">
                      Optional
                    </span>
                  </div>

                  <input
                    id="taskRegisterId"
                    type="text"
                    value={
                      form.taskRegisterId
                    }
                    disabled={
                      submitting
                    }
                    maxLength={
                      100
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "taskRegisterId",
                        normalizeUppercaseValue(
                          event.target.value
                        )
                      )
                    }
                    placeholder="Example: T-001"
                    autoComplete="off"
                    className={`${INPUT_CLASSES} uppercase ${
                      formErrors.taskRegisterId
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : ""
                    }`}
                  />

                  <FieldError
                    message={
                      formErrors.taskRegisterId
                    }
                  />

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This field appears only when enabled in Project Settings.
                  </p>
                </div>
              ) : null}

              {/* DESCRIPTION */}

              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Description

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {
                      form.description
                        .length
                    }
                    /3000
                  </span>
                </div>

                <textarea
                  id="description"
                  value={
                    form.description
                  }
                  disabled={
                    submitting
                  }
                  maxLength={
                    3000
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Example: Damaged cable termination replaced, connections tightened and panel checked for safe operation."
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

                <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Created date and time are saved automatically by the backend.
                  No manual start date, due date, priority or assignment is required.
                </p>
              </div>
            </div>
          </section>

          {/* WORKFLOW */}

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
            <h2 className="text-sm font-bold text-blue-900 dark:text-blue-300">
              Task workflow
            </h2>

            <p className="mt-1 text-xs leading-5 text-blue-700 dark:text-blue-400">
              A new task starts as In Progress. Upload Before Evidence to record
              the starting condition, upload After Evidence once the work is done,
              then mark the task Complete.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 text-xs font-semibold sm:grid-cols-4">
              <div className="rounded-xl bg-white px-4 py-3 text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                1. Create Task
              </div>

              <div className="rounded-xl bg-white px-4 py-3 text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                2. Before Evidence
              </div>

              <div className="rounded-xl bg-white px-4 py-3 text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                3. After Evidence
              </div>

              <div className="rounded-xl bg-white px-4 py-3 text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                4. Mark Complete
              </div>
            </div>
          </section>

          {/* ACTIONS */}

          <section className="flex flex-col-reverse gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-end sm:p-6">
            <Link
              to="/tasks"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                projectsLoading ||
                projects.length ===
                  0
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                className={
                  submitting
                    ? "animate-pulse"
                    : ""
                }
              >
                <SaveIcon />
              </span>

              {submitting
                ? "Creating Task..."
                : "Create Task"}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}