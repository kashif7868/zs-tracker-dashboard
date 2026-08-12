import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageMeta from "../../components/common/PageMeta";

import {
  getActiveProjects,
} from "../../services/project/project.service";

import {
  getTaskSerialLabel,
  getTasksByProject,
  type Task,
} from "../../services/task_register/task.service";

import {
  createActionPlan,
  type ActionPlanPriority,
  type ActionPlanStatus,
} from "../../services/action_plan/actionPlan.service";

/* =========================================================
   TYPES
   ========================================================= */

type ProjectOption = {
  _id: string;
  projectCode: string;
  name: string;
  label: string;
};

type FormState = {
  projectId: string;
  taskId: string;
  title: string;
  description: string;
  priority: ActionPlanPriority;
  status: ActionPlanStatus;
  targetDate: string;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const INITIAL_FORM: FormState = {
  projectId: "",
  taskId: "",
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  targetDate: "",
};

/* =========================================================
   HELPERS
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
      requestError.response
        ?.data?.errors?.[0]
        ?.message ||
      requestError.response
        ?.data?.errors?.[0]
        ?.msg ||
      requestError.response
        ?.data?.message ||
      "Request could not be completed."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Request could not be completed.";
};

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

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    Array.isArray(
      record.projects
    )
  ) {
    return record.projects;
  }

  if (
    Array.isArray(
      record.data
    )
  ) {
    return record.data;
  }

  if (
    record.data &&
    typeof record.data ===
      "object"
  ) {
    const nested =
      record.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        nested.projects
      )
    ) {
      return nested.projects;
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
      : "";

  if (!projectId) {
    return null;
  }

  const projectCode =
    typeof project.projectCode ===
      "string"
      ? project.projectCode.trim()
      : typeof project.referenceNo ===
          "string"
        ? project.referenceNo.trim()
        : typeof project.projectReferenceNo ===
            "string"
          ? project.projectReferenceNo.trim()
          : "";

  const projectName =
    typeof project.projectName ===
      "string"
      ? project.projectName.trim()
      : typeof project.title ===
          "string"
        ? project.title.trim()
        : typeof project.name ===
            "string"
          ? project.name.trim()
          : "Unnamed Project";

  return {
    _id:
      projectId,

    projectCode,

    name:
      projectName,

    label:
      projectCode
        ? `${projectCode} — ${projectName}`
        : projectName,
  };
};

const formatTaskStatus = (
  status: Task["status"]
): string => {
  return status === "complete"
    ? "Complete"
    : "In Progress";
};

const getTodayInputDate = () => {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};

/* =========================================================
   DATE PICKER
   ========================================================= */

function DatePickerField({
  id,
  value,
  disabled = false,
  onChange,
}: {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const openPicker = () => {
    if (
      disabled ||
      !inputRef.current
    ) {
      return;
    }

    if (
      typeof inputRef.current
        .showPicker ===
      "function"
    ) {
      inputRef.current.showPicker();

      return;
    }

    inputRef.current.focus();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="date"
        value={value}
        disabled={disabled}
        min={getTodayInputDate()}
        onChange={(event) => {
          onChange(
            event.target.value
          );
        }}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-emerald-400"
        aria-label="Open calendar"
        title="Open calendar"
      >
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
          <path d="M7 3V6" />
          <path d="M17 3V6" />
          <path d="M4 9H20" />
          <rect
            x="4"
            y="5"
            width="16"
            height="15"
            rx="2"
          />
        </svg>
      </button>
    </div>
  );
}

/* =========================================================
   CREATE ACTION PLAN PAGE
   ========================================================= */

export default function CreateActionPlanPage() {
  const [
    projects,
    setProjects,
  ] =
    useState<ProjectOption[]>([]);

  const [
    tasks,
    setTasks,
  ] =
    useState<Task[]>([]);

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      INITIAL_FORM
    );

  const [
    taskSearch,
    setTaskSearch,
  ] =
    useState("");

  const [
    projectsLoading,
    setProjectsLoading,
  ] =
    useState(true);

  const [
    tasksLoading,
    setTasksLoading,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  /* =======================================================
     LOAD PROJECTS
     ======================================================= */

  const loadProjects =
    useCallback(
      async () => {
        try {
          setProjectsLoading(
            true
          );

          setError("");

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
              .sort(
                (
                  first,
                  second
                ) =>
                  first.label.localeCompare(
                    second.label
                  )
              );

          setProjects(
            projectOptions
          );
        } catch (
          requestError
        ) {
          setProjects([]);

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setProjectsLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD TASKS
     ======================================================= */

  const loadTasks =
    useCallback(
      async (
        projectId: string
      ) => {
        if (!projectId) {
          setTasks([]);

          return;
        }

        try {
          setTasksLoading(
            true
          );

          setError("");

          const firstPage =
            await getTasksByProject(
              projectId,
              {
                page: 1,
                limit: 100,
                sortBy:
                  "serialNo",
                sortOrder:
                  "asc",
              }
            );

          const allTasks = [
            ...firstPage.tasks,
          ];

          const totalPages =
            firstPage.pagination
              .totalPages;

          if (
            totalPages > 1
          ) {
            for (
              let currentPage = 2;
              currentPage <=
              totalPages;
              currentPage += 1
            ) {
              const nextPage =
                await getTasksByProject(
                  projectId,
                  {
                    page:
                      currentPage,

                    limit:
                      firstPage
                        .pagination
                        .limit,

                    sortBy:
                      "serialNo",

                    sortOrder:
                      "asc",
                  }
                );

              allTasks.push(
                ...nextPage.tasks
              );
            }
          }

          setTasks(
            allTasks
          );
        } catch (
          requestError
        ) {
          setTasks([]);

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setTasksLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     EFFECTS
     ======================================================= */

  useEffect(() => {
    void loadProjects();
  }, [
    loadProjects,
  ]);

  useEffect(() => {
    setTasks([]);

    setTaskSearch("");

    setForm(
      (
        current
      ) => ({
        ...current,
        taskId: "",
      })
    );

    if (
      form.projectId
    ) {
      void loadTasks(
        form.projectId
      );
    }
  }, [
    form.projectId,
    loadTasks,
  ]);

  /* =======================================================
     DERIVED DATA
     ======================================================= */

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (
            project
          ) =>
            project._id ===
            form.projectId
        ) ?? null,
      [
        projects,
        form.projectId,
      ]
    );

  const selectedTask =
    useMemo(
      () =>
        tasks.find(
          (
            task
          ) =>
            task._id ===
            form.taskId
        ) ?? null,
      [
        tasks,
        form.taskId,
      ]
    );

  const filteredTasks =
    useMemo(
      () => {
        const normalizedSearch =
          taskSearch
            .trim()
            .toLowerCase();

        if (
          !normalizedSearch
        ) {
          return tasks;
        }

        return tasks.filter(
          (
            task
          ) => {
            const searchValue = [
              getTaskSerialLabel(
                task
              ),
              task.description,
              task.projectCode,
              formatTaskStatus(
                task.status
              ),
            ]
              .join(" ")
              .toLowerCase();

            return searchValue.includes(
              normalizedSearch
            );
          }
        );
      },
      [
        tasks,
        taskSearch,
      ]
    );

  const canSubmit =
    Boolean(
      form.projectId &&
      form.taskId &&
      form.title.trim()
        .length >= 3 &&
      !submitting
    );

  /* =======================================================
     SUBMIT
     ======================================================= */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !form.projectId
      ) {
        setError(
          "Select a Project."
        );

        return;
      }

      if (
        !form.taskId
      ) {
        setError(
          "Select a Task."
        );

        return;
      }

      const title =
        form.title.trim();

      if (
        title.length < 3
      ) {
        setError(
          "Action Plan title must contain at least 3 characters."
        );

        return;
      }

      if (
        form.description.trim()
          .length > 5000
      ) {
        setError(
          "Action Plan description cannot exceed 5000 characters."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setError("");
        setSuccess("");

        const created =
          await createActionPlan({
            projectId:
              form.projectId,

            taskId:
              form.taskId,

            title,

            description:
              form.description
                .trim(),

            priority:
              form.priority,

            status:
              form.status,

            targetDate:
              form.targetDate ||
              null,
          });

        setSuccess(
          "Action Plan created successfully."
        );

        window.setTimeout(
          () => {
            window.location.href =
              created._id
                ? `/action-plans/${created._id}`
                : "/action-plans";
          },
          500
        );
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      <PageMeta
        title="Create Action Plan | Zorays Project Tracker"
        description="Create corrective Action Plans against Project Tasks."
      />

      <div className="space-y-6">
        {/* HEADER */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Corrective Work
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Create Action Plan
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Select a Project and Task, then define the corrective action, priority and target date.
              </p>
            </div>

            <a
              href="/action-plans"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back to Action Plans
            </a>
          </div>
        </section>

        {/* ALERTS */}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
            {success}
          </div>
        ) : null}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6"
        >
          {/* PROJECT / TASK */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Action Context
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                Project & Task
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Every Action Plan must belong to an existing Task.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="action-plan-project"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Project
                </label>

                <select
                  id="action-plan-project"
                  value={
                    form.projectId
                  }
                  disabled={
                    projectsLoading ||
                    submitting
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          projectId:
                            event.target
                              .value,
                        })
                      );
                    }
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {projectsLoading
                      ? "Loading Projects..."
                      : "Select Project"}
                  </option>

                  {projects.map(
                    (
                      project
                    ) => (
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

              <div>
                <label
                  htmlFor="action-plan-task-search"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Search Tasks
                </label>

                <input
                  id="action-plan-task-search"
                  type="search"
                  value={
                    taskSearch
                  }
                  disabled={
                    !form.projectId ||
                    tasksLoading ||
                    submitting
                  }
                  placeholder="Search Task number or description"
                  onChange={
                    (
                      event
                    ) => {
                      setTaskSearch(
                        event.target.value
                      );
                    }
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="action-plan-task"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Task
              </label>

              <select
                id="action-plan-task"
                value={
                  form.taskId
                }
                disabled={
                  !form.projectId ||
                  tasksLoading ||
                  submitting
                }
                onChange={
                  (
                    event
                  ) => {
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        taskId:
                          event.target
                            .value,
                      })
                    );
                  }
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">
                  {!form.projectId
                    ? "Select Project first"
                    : tasksLoading
                      ? "Loading Tasks..."
                      : filteredTasks.length ===
                          0
                        ? "No Tasks found"
                        : "Select Task"}
                </option>

                {filteredTasks.map(
                  (
                    task
                  ) => (
                    <option
                      key={
                        task._id
                      }
                      value={
                        task._id
                      }
                    >
                      Task #{getTaskSerialLabel(
                        task
                      )} —{" "}
                      {formatTaskStatus(
                        task.status
                      )} —{" "}
                      {task.description}
                    </option>
                  )
                )}
              </select>
            </div>

            {selectedTask ? (
              <article className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-400">
                    Task #{getTaskSerialLabel(
                      selectedTask
                    )}
                  </span>

                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-700 shadow-sm dark:bg-gray-900 dark:text-gray-300">
                    {formatTaskStatus(
                      selectedTask.status
                    )}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
                  {selectedTask.description}
                </p>
              </article>
            ) : null}
          </section>

          {/* ACTION DETAILS */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Corrective Action
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                Action Plan Details
              </h2>
            </div>

            <div className="mt-5">
              <label
                htmlFor="action-plan-title"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Action Title
              </label>

              <input
                id="action-plan-title"
                type="text"
                value={
                  form.title
                }
                maxLength={250}
                disabled={
                  submitting
                }
                placeholder="e.g. Replace damaged panel door locks and verify enclosure sealing"
                onChange={
                  (
                    event
                  ) => {
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        title:
                          event.target
                            .value,
                      })
                    );
                  }
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />

              <p className="mt-1.5 text-right text-[11px] text-gray-400">
                {form.title.length}/250
              </p>
            </div>

            <div className="mt-5">
              <label
                htmlFor="action-plan-description"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                Description
              </label>

              <textarea
                id="action-plan-description"
                rows={6}
                value={
                  form.description
                }
                maxLength={5000}
                disabled={
                  submitting
                }
                placeholder="Describe the corrective action, expected work and any relevant implementation notes."
                onChange={
                  (
                    event
                  ) => {
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        description:
                          event.target
                            .value,
                      })
                    );
                  }
                }
                className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />

              <p className="mt-1.5 text-right text-[11px] text-gray-400">
                {form.description.length}/5000
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="action-plan-priority"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Priority
                </label>

                <select
                  id="action-plan-priority"
                  value={
                    form.priority
                  }
                  disabled={
                    submitting
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          priority:
                            event.target.value as ActionPlanPriority,
                        })
                      );
                    }
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="low">
                    Low
                  </option>
                  <option value="medium">
                    Medium
                  </option>
                  <option value="high">
                    High
                  </option>
                  <option value="critical">
                    Critical
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="action-plan-status"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Initial Status
                </label>

                <select
                  id="action-plan-status"
                  value={
                    form.status
                  }
                  disabled={
                    submitting
                  }
                  onChange={
                    (
                      event
                    ) => {
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            event.target.value as ActionPlanStatus,
                        })
                      );
                    }
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="pending">
                    Pending
                  </option>
                  <option value="in_progress">
                    In Progress
                  </option>
                  <option value="on_hold">
                    On Hold
                  </option>
                  <option value="complete">
                    Complete
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="action-plan-target-date"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  Target Date
                </label>

                <DatePickerField
                  id="action-plan-target-date"
                  value={
                    form.targetDate
                  }
                  disabled={
                    submitting
                  }
                  onChange={
                    (
                      value
                    ) => {
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          targetDate:
                            value,
                        })
                      );
                    }
                  }
                />
              </div>
            </div>
          </section>

          {/* SUMMARY / SUBMIT */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <article className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Project
                </p>

                <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                  {selectedProject
                    ? selectedProject.label
                    : "Not selected"}
                </p>
              </article>

              <article className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Task
                </p>

                <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                  {selectedTask
                    ? `Task #${getTaskSerialLabel(
                        selectedTask
                      )}`
                    : "Not selected"}
                </p>
              </article>

              <article className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Target Date
                </p>

                <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                  {form.targetDate ||
                    "Not set"}
                </p>
              </article>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
              <a
                href="/action-plans"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                Cancel
              </a>

              <button
                type="submit"
                disabled={
                  !canSubmit
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Creating..."
                  : "Create Action Plan"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </>
  );
}