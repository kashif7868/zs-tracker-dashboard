import api from "../api";

/* =========================================================
   TASK REGISTER STATUS

   Current lifecycle:
   in_progress <-> complete
   ========================================================= */

export const TASK_STATUSES = [
  "in_progress",
  "complete",
] as const;

export type TaskStatus =
  (typeof TASK_STATUSES)[number];

/* =========================================================
   SORTING

   Keep only fields supported by the current backend Task
   service.
   ========================================================= */

export const TASK_SORT_FIELDS = [
  "serialNo",
  "taskRegisterId",
  "projectCode",
  "description",
  "status",
  "createdAt",
  "updatedAt",
] as const;

export type TaskSortField =
  (typeof TASK_SORT_FIELDS)[number];

/* =========================================================
   EVIDENCE TYPES
   ========================================================= */

export type TaskEvidenceType =
  | "before"
  | "after";

export type TaskEvidence = {
  _id: string;

  projectId: string;

  projectCode: string;
  projectReferenceNo?: string;

  taskId: string;

  taskRegisterId?: string;

  evidenceType: TaskEvidenceType;

  imagePath: string;

  createdAt: string;
  updatedAt: string;
};

export type TaskEvidenceSummary = {
  before: TaskEvidence[];
  after: TaskEvidence[];

  beforeCount: number;
  afterCount: number;

  canMarkComplete: boolean;
};

/* =========================================================
   MAIN TASK TYPE

   serialNo:
   Stable backend project-wise number.

   displaySrNo:
   Continuous UI sequence. This is what the list should show.

   taskRegisterId:
   Optional. Project setting controls whether it is used.

   No title, category, priority, assignedTo, startDate,
   dueDate, pending or on_hold fields are used.
   ========================================================= */

export type Task = {
  _id: string;

  projectId: string;

  projectCode: string;
  projectReferenceNo?: string;

  serialNo: number;
  displaySrNo?: number;

  taskRegisterId?: string;

  description: string;

  status: TaskStatus;

  completedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  evidenceSummary?: TaskEvidenceSummary;
};

/* =========================================================
   CREATE PAYLOAD

   User enters:
   projectId
   description
   taskRegisterId optional

   Backend automatically handles:
   serialNo
   status
   timestamps
   ========================================================= */

export type CreateTaskPayload = {
  projectId: string;

  description: string;

  taskRegisterId?: string;
};

/* =========================================================
   UPDATE PAYLOAD
   ========================================================= */

export type UpdateTaskPayload = {
  description?: string;

  taskRegisterId?: string | null;
};

/* =========================================================
   STATUS PAYLOAD
   ========================================================= */

export type UpdateTaskStatusPayload = {
  status: TaskStatus;
};

/* =========================================================
   QUERY PARAMETERS
   ========================================================= */

export type TaskListParams = {
  projectId?: string;

  status?: TaskStatus | "";

  search?: string;

  page?: number;
  limit?: number;

  sortBy?: TaskSortField;
  sortOrder?: "asc" | "desc";
};

/* =========================================================
   PAGINATION
   ========================================================= */

export type TaskPagination = {
  page: number;
  limit: number;

  total: number;
  totalRecords: number;

  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TaskListResult = {
  tasks: Task[];

  pagination: TaskPagination;
};

/* =========================================================
   SINGLE TASK DETAILS
   ========================================================= */

export type TaskDetailsResult = {
  task: Task;

  evidence: TaskEvidenceSummary;
};

/* =========================================================
   DELETE RESULT
   ========================================================= */

export type DeleteTaskResult = {
  taskId?: string;

  task?: Task;

  deletedEvidenceCount?: number;

  deletedImagePaths?: string[];

  imageFilesRequested?: number;
  imageFilesDeleted?: number;

  message?: string;
};

/* =========================================================
   DASHBOARD SUMMARY
   ========================================================= */

export type TaskDashboardSummary = {
  totalTasks: number;

  inProgressTasks: number;
  completeTasks: number;

  completionPercentage: number;
};

/* =========================================================
   INTERNAL API TYPES
   ========================================================= */

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type RawTaskListData = {
  tasks?: unknown[];

  /*
    Temporary backend compatibility.
    Old service response may still contain risks.
  */
  risks?: unknown[];

  pagination?: unknown;
};

type RawTaskDetailsData = {
  task?: unknown;

  /*
    Temporary backend compatibility.
  */
  risk?: unknown;

  evidence?: unknown;
};

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

const hasOwnField = (
  object: object,
  field: PropertyKey
): boolean =>
  Object.prototype.hasOwnProperty.call(
    object,
    field
  );

const normalizeString = (
  value: unknown
): string =>
  typeof value === "string"
    ? value
    : "";

const normalizeTrimmedString = (
  value: unknown
): string =>
  normalizeString(
    value
  ).trim();

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : fallback;
};

const normalizeNonNegativeInteger = (
  value: unknown,
  fallback = 0
): number =>
  Math.max(
    Math.trunc(
      normalizeNumber(
        value,
        fallback
      )
    ),
    0
  );

const normalizeTaskStatus = (
  value: unknown
): TaskStatus =>
  value === "complete"
    ? "complete"
    : "in_progress";

const encodePathValue = (
  value: string
): string =>
  encodeURIComponent(
    value.trim()
  );

/* =========================================================
   RESPONSE DATA EXTRACTOR
   ========================================================= */

const extractResponseData = <T>(
  response: unknown
): T => {
  const axiosResponse =
    response as {
      data?: unknown;
    };

  const responseBody =
    axiosResponse?.data;

  if (
    responseBody &&
    typeof responseBody ===
      "object" &&
    "data" in responseBody
  ) {
    const envelope =
      responseBody as ApiEnvelope<T>;

    if (
      envelope.data !==
      undefined
    ) {
      return envelope.data;
    }
  }

  return responseBody as T;
};

/* =========================================================
   EVIDENCE NORMALIZER

   Accepts both canonical task fields and temporary legacy
   risk fields while backend migration is being completed.
   ========================================================= */

const normalizeEvidenceRecord = (
  rawEvidence: unknown
): TaskEvidence => {
  const evidence =
    rawEvidence &&
    typeof rawEvidence ===
      "object"
      ? rawEvidence as Record<
          string,
          unknown
        >
      : {};

  const projectCode =
    normalizeTrimmedString(
      evidence.projectCode
    );

  const projectReferenceNo =
    normalizeTrimmedString(
      evidence.projectReferenceNo
    ) || projectCode;

  const taskId =
    normalizeTrimmedString(
      evidence.taskId
    ) ||
    normalizeTrimmedString(
      evidence.riskId
    );

  const taskRegisterId =
    normalizeTrimmedString(
      evidence.taskRegisterId
    ) ||
    normalizeTrimmedString(
      evidence.riskRegisterId
    );

  return {
    _id:
      normalizeTrimmedString(
        evidence._id
      ),

    projectId:
      normalizeTrimmedString(
        evidence.projectId
      ),

    projectCode,

    projectReferenceNo,

    taskId,

    ...(taskRegisterId
      ? {
          taskRegisterId,
        }
      : {}),

    evidenceType:
      evidence.evidenceType ===
      "after"
        ? "after"
        : "before",

    imagePath:
      normalizeTrimmedString(
        evidence.imagePath
      ),

    createdAt:
      normalizeTrimmedString(
        evidence.createdAt
      ),

    updatedAt:
      normalizeTrimmedString(
        evidence.updatedAt
      ),
  };
};

/* =========================================================
   EVIDENCE SUMMARY NORMALIZER
   ========================================================= */

const normalizeEvidenceSummary = (
  rawEvidence?: unknown
): TaskEvidenceSummary => {
  const evidence =
    rawEvidence &&
    typeof rawEvidence ===
      "object"
      ? rawEvidence as Record<
          string,
          unknown
        >
      : {};

  const before =
    Array.isArray(
      evidence.before
    )
      ? evidence.before.map(
          normalizeEvidenceRecord
        )
      : [];

  const after =
    Array.isArray(
      evidence.after
    )
      ? evidence.after.map(
          normalizeEvidenceRecord
        )
      : [];

  const beforeCount =
    normalizeNonNegativeInteger(
      evidence.beforeCount,
      before.length
    );

  const afterCount =
    normalizeNonNegativeInteger(
      evidence.afterCount,
      after.length
    );

  const canMarkComplete =
    typeof evidence
      .canMarkComplete ===
    "boolean"
      ? evidence.canMarkComplete
      : beforeCount > 0 &&
        afterCount > 0;

  return {
    before,
    after,

    beforeCount,
    afterCount,

    canMarkComplete,
  };
};

/* =========================================================
   TASK NORMALIZER
   ========================================================= */

const normalizeTask = (
  rawTask: unknown
): Task => {
  const task =
    rawTask &&
    typeof rawTask ===
      "object"
      ? rawTask as Record<
          string,
          unknown
        >
      : {};

  const projectCode =
    normalizeTrimmedString(
      task.projectCode
    );

  const projectReferenceNo =
    normalizeTrimmedString(
      task.projectReferenceNo
    ) || projectCode;

  const taskRegisterId =
    normalizeTrimmedString(
      task.taskRegisterId
    ) ||
    normalizeTrimmedString(
      task.riskRegisterId
    );

  const serialNo =
    normalizeNonNegativeInteger(
      task.serialNo
    );

  const displaySrNo =
    normalizeNonNegativeInteger(
      task.displaySrNo,
      serialNo
    );

  const rawEvidenceSummary =
    task.evidenceSummary ??
    task.evidence ??
    {
      beforeCount:
        task.beforeCount,

      afterCount:
        task.afterCount,

      canMarkComplete:
        task.canMarkComplete,
    };

  return {
    _id:
      normalizeTrimmedString(
        task._id
      ),

    projectId:
      normalizeTrimmedString(
        task.projectId
      ),

    projectCode,

    projectReferenceNo,

    serialNo,

    displaySrNo,

    ...(taskRegisterId
      ? {
          taskRegisterId,
        }
      : {}),

    description:
      normalizeTrimmedString(
        task.description
      ),

    status:
      normalizeTaskStatus(
        task.status
      ),

    completedAt:
      normalizeTrimmedString(
        task.completedAt
      ) || null,

    createdAt:
      normalizeTrimmedString(
        task.createdAt
      ),

    updatedAt:
      normalizeTrimmedString(
        task.updatedAt
      ),

    evidenceSummary:
      normalizeEvidenceSummary(
        rawEvidenceSummary
      ),
  };
};

/* =========================================================
   PAGINATION NORMALIZER
   ========================================================= */

const normalizePagination = (
  rawPagination: unknown,
  taskCount: number
): TaskPagination => {
  const pagination =
    rawPagination &&
    typeof rawPagination ===
      "object"
      ? rawPagination as Record<
          string,
          unknown
        >
      : {};

  const page =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.page,
        1
      ),
      1
    );

  const limit =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.limit,
        taskCount || 1
      ),
      1
    );

  const total =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.total ??
          pagination.totalRecords ??
          pagination.totalTasks ??
          pagination.totalRisks,
        taskCount
      ),
      0
    );

  const totalPages =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.totalPages,
        Math.ceil(
          total / limit
        ) || 1
      ),
      1
    );

  return {
    page,
    limit,

    total,
    totalRecords:
      total,

    totalPages,

    hasNextPage:
      typeof pagination
        .hasNextPage ===
      "boolean"
        ? pagination.hasNextPage
        : page < totalPages,

    hasPreviousPage:
      typeof pagination
        .hasPreviousPage ===
      "boolean"
        ? pagination
            .hasPreviousPage
        : page > 1,
  };
};

/* =========================================================
   SINGLE TASK EXTRACTOR
   ========================================================= */

const extractTask = (
  data: unknown
): Task => {
  if (
    data &&
    typeof data === "object"
  ) {
    const record =
      data as Record<
        string,
        unknown
      >;

    if (
      "task" in record
    ) {
      return normalizeTask(
        record.task
      );
    }

    if (
      "risk" in record
    ) {
      return normalizeTask(
        record.risk
      );
    }
  }

  return normalizeTask(
    data
  );
};

/* =========================================================
   LIST RESPONSE NORMALIZER
   ========================================================= */

const normalizeTaskListResult = (
  data: unknown
): TaskListResult => {
  if (
    Array.isArray(data)
  ) {
    const tasks =
      data.map(
        normalizeTask
      );

    return {
      tasks,

      pagination:
        normalizePagination(
          undefined,
          tasks.length
        ),
    };
  }

  const listData =
    data &&
    typeof data ===
      "object"
      ? data as RawTaskListData
      : {};

  const rawTasks =
    Array.isArray(
      listData.tasks
    )
      ? listData.tasks
      : Array.isArray(
            listData.risks
          )
        ? listData.risks
        : [];

  const tasks =
    rawTasks.map(
      normalizeTask
    );

  return {
    tasks,

    pagination:
      normalizePagination(
        listData.pagination,
        tasks.length
      ),
  };
};

/* =========================================================
   CREATE PAYLOAD PREPARATION
   ========================================================= */

const prepareCreateTaskPayload = (
  payload: CreateTaskPayload
): Record<
  string,
  string
> => {
  const body: Record<
    string,
    string
  > = {
    projectId:
      payload.projectId.trim(),

    description:
      payload.description.trim(),
  };

  const taskRegisterId =
    normalizeTrimmedString(
      payload.taskRegisterId
    );

  if (taskRegisterId) {
    body.taskRegisterId =
      taskRegisterId.toUpperCase();
  }

  return body;
};

/* =========================================================
   UPDATE PAYLOAD PREPARATION
   ========================================================= */

const prepareUpdateTaskPayload = (
  payload: UpdateTaskPayload
): Record<
  string,
  string | null
> => {
  const body: Record<
    string,
    string | null
  > = {};

  if (
    hasOwnField(
      payload,
      "description"
    )
  ) {
    body.description =
      normalizeTrimmedString(
        payload.description
      );
  }

  if (
    hasOwnField(
      payload,
      "taskRegisterId"
    )
  ) {
    const value =
      payload.taskRegisterId;

    body.taskRegisterId =
      value === null
        ? null
        : normalizeTrimmedString(
            value
          )
            .toUpperCase() ||
          null;
  }

  return body;
};

/* =========================================================
   CREATE TASK

   POST /tasks
   ========================================================= */

export const createTask = async (
  payload: CreateTaskPayload
): Promise<Task> => {
  const response =
    await api.post(
      "/tasks",
      prepareCreateTaskPayload(
        payload
      )
    );

  return extractTask(
    extractResponseData<unknown>(
      response
    )
  );
};

/* =========================================================
   GET ALL TASKS

   GET /tasks
   ========================================================= */

export const getTasks = async (
  params: TaskListParams = {}
): Promise<TaskListResult> => {
  const response =
    await api.get(
      "/tasks",
      {
        params: {
          ...(params.projectId
            ?.trim()
            ? {
                projectId:
                  params.projectId.trim(),
              }
            : {}),

          ...(params.status
            ? {
                status:
                  params.status,
              }
            : {}),

          ...(params.search
            ?.trim()
            ? {
                search:
                  params.search.trim(),
              }
            : {}),

          ...(params.page
            ? {
                page:
                  params.page,
              }
            : {}),

          ...(params.limit
            ? {
                limit:
                  params.limit,
              }
            : {}),

          ...(params.sortBy
            ? {
                sortBy:
                  params.sortBy,
              }
            : {}),

          ...(params.sortOrder
            ? {
                sortOrder:
                  params.sortOrder,
              }
            : {}),
        },
      }
    );

  return normalizeTaskListResult(
    extractResponseData<unknown>(
      response
    )
  );
};

/* =========================================================
   GET TASKS BY PROJECT

   GET /tasks/project/:projectId
   ========================================================= */

export const getTasksByProject =
  async (
    projectId: string,
    params: Omit<
      TaskListParams,
      "projectId"
    > = {}
  ): Promise<TaskListResult> => {
    const response =
      await api.get(
        `/tasks/project/${encodePathValue(
          projectId
        )}`,
        {
          params: {
            ...(params.status
              ? {
                  status:
                    params.status,
                }
              : {}),

            ...(params.search
              ?.trim()
              ? {
                  search:
                    params.search.trim(),
                }
              : {}),

            ...(params.page
              ? {
                  page:
                    params.page,
                }
              : {}),

            ...(params.limit
              ? {
                  limit:
                    params.limit,
                }
              : {}),

            ...(params.sortBy
              ? {
                  sortBy:
                    params.sortBy,
                }
              : {}),

            ...(params.sortOrder
              ? {
                  sortOrder:
                    params.sortOrder,
                }
              : {}),
          },
        }
      );

    return normalizeTaskListResult(
      extractResponseData<unknown>(
        response
      )
    );
  };

/* =========================================================
   GET SINGLE TASK

   GET /tasks/:taskId
   ========================================================= */

export const getTaskById = async (
  taskId: string
): Promise<TaskDetailsResult> => {
  const response =
    await api.get(
      `/tasks/${encodePathValue(
        taskId
      )}`
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  if (
    data &&
    typeof data === "object"
  ) {
    const details =
      data as RawTaskDetailsData;

    const task =
      normalizeTask(
        details.task ??
          details.risk ??
          data
      );

    const evidence =
      normalizeEvidenceSummary(
        details.evidence ??
          task.evidenceSummary
      );

    return {
      task: {
        ...task,

        evidenceSummary:
          evidence,
      },

      evidence,
    };
  }

  const task =
    normalizeTask(
      data
    );

  const evidence =
    normalizeEvidenceSummary(
      task.evidenceSummary
    );

  return {
    task: {
      ...task,

      evidenceSummary:
        evidence,
    },

    evidence,
  };
};

/* =========================================================
   UPDATE TASK

   PATCH /tasks/:taskId
   ========================================================= */

export const updateTask = async (
  taskId: string,
  payload: UpdateTaskPayload
): Promise<Task> => {
  const response =
    await api.patch(
      `/tasks/${encodePathValue(
        taskId
      )}`,
      prepareUpdateTaskPayload(
        payload
      )
    );

  return extractTask(
    extractResponseData<unknown>(
      response
    )
  );
};

/* =========================================================
   UPDATE TASK STATUS

   PATCH /tasks/:taskId/status
   ========================================================= */

export const updateTaskStatus =
  async (
    taskId: string,
    payload:
      UpdateTaskStatusPayload
  ): Promise<Task> => {
    const response =
      await api.patch(
        `/tasks/${encodePathValue(
          taskId
        )}/status`,
        {
          status:
            payload.status,
        }
      );

    return extractTask(
      extractResponseData<unknown>(
        response
      )
    );
  };

/* =========================================================
   MARK COMPLETE

   Requires:
   >= 1 Before Evidence
   >= 1 After Evidence
   ========================================================= */

export const markTaskComplete =
  async (
    taskId: string
  ): Promise<Task> => {
    const response =
      await api.patch(
        `/tasks/${encodePathValue(
          taskId
        )}/complete`
      );

    return extractTask(
      extractResponseData<unknown>(
        response
      )
    );
  };

/* =========================================================
   MOVE / REOPEN TASK TO IN PROGRESS
   ========================================================= */

export const markTaskInProgress =
  async (
    taskId: string
  ): Promise<Task> => {
    const response =
      await api.patch(
        `/tasks/${encodePathValue(
          taskId
        )}/in-progress`
      );

    return extractTask(
      extractResponseData<unknown>(
        response
      )
    );
  };

/* =========================================================
   DELETE TASK
   ========================================================= */

export const deleteTask = async (
  taskId: string
): Promise<DeleteTaskResult> => {
  const response =
    await api.delete(
      `/tasks/${encodePathValue(
        taskId
      )}`
    );

  const data =
    extractResponseData<
      DeleteTaskResult | undefined
    >(response);

  if (!data) {
    return {};
  }

  return {
    ...data,

    ...(data.task
      ? {
          task:
            normalizeTask(
              data.task
            ),
        }
      : {}),
  };
};

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

export const getTaskProjectReference = (
  task: Pick<
    Task,
    | "projectReferenceNo"
    | "projectCode"
  >
): string =>
  task.projectReferenceNo
    ?.trim() ||
  task.projectCode.trim();

export const getTaskSerialLabel = (
  task: Pick<
    Task,
    | "serialNo"
    | "displaySrNo"
  >
): string =>
  String(
    task.displaySrNo ||
    task.serialNo
  );

/* =========================================================
   DASHBOARD SUMMARY
   ========================================================= */

export const buildTaskDashboardSummary =
  (
    tasks: Task[]
  ): TaskDashboardSummary => {
    const totalTasks =
      tasks.length;

    const inProgressTasks =
      tasks.filter(
        (task) =>
          task.status ===
          "in_progress"
      ).length;

    const completeTasks =
      tasks.filter(
        (task) =>
          task.status ===
          "complete"
      ).length;

    const completionPercentage =
      totalTasks > 0
        ? Number(
            (
              (
                completeTasks /
                totalTasks
              ) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      totalTasks,

      inProgressTasks,
      completeTasks,

      completionPercentage,
    };
  };

/* =========================================================
   GET DASHBOARD SUMMARY

   Fetch all Task pages and calculate frontend summary.
   ========================================================= */

export const getTaskDashboardSummary =
  async (
    projectId?: string
  ): Promise<TaskDashboardSummary> => {
    const firstPage =
      projectId
        ? await getTasksByProject(
            projectId,
            {
              page: 1,
              limit: 100,
              sortBy:
                "createdAt",
              sortOrder:
                "desc",
            }
          )
        : await getTasks({
            page: 1,
            limit: 100,
            sortBy:
              "createdAt",
            sortOrder:
              "desc",
          });

    const allTasks = [
      ...firstPage.tasks,
    ];

    const totalPages =
      firstPage.pagination
        .totalPages;

    for (
      let page = 2;
      page <= totalPages;
      page += 1
    ) {
      const nextPage =
        projectId
          ? await getTasksByProject(
              projectId,
              {
                page,

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
          : await getTasks({
              page,

              limit:
                firstPage
                  .pagination
                  .limit,

              sortBy:
                "createdAt",

              sortOrder:
                "desc",
            });

      allTasks.push(
        ...nextPage.tasks
      );
    }

    return buildTaskDashboardSummary(
      allTasks
    );
  };

/* =========================================================
   TEMPORARY LEGACY RISK COMPATIBILITY EXPORTS

   Purpose:
   Dashboard ke jo components abhi Risk-era imports use kar
   rahe hain unko migration ke duran crash hone se bachana.

   New code hamesha Task names use kare:
   getTasks
   getTaskById
   createTask
   updateTask
   deleteTask
   buildTaskDashboardSummary

   Ye aliases final cleanup mein remove kiye ja sakte hain.
   ========================================================= */

/* ---------- TYPES ---------- */

export type RiskStatus =
  TaskStatus;

export type RiskEvidenceType =
  TaskEvidenceType;

export type RiskEvidence =
  TaskEvidence;

export type RiskEvidenceSummary =
  TaskEvidenceSummary;

export type Risk =
  Task;

export type CreateRiskPayload =
  CreateTaskPayload;

export type UpdateRiskPayload =
  UpdateTaskPayload;

export type UpdateRiskStatusPayload =
  UpdateTaskStatusPayload;

export type RiskListParams =
  TaskListParams;

export type RiskPagination =
  TaskPagination;

export type RiskListResult = {
  risks: Risk[];
  pagination: RiskPagination;
};

export type RiskDetailsResult = {
  risk: Risk;
  evidence: RiskEvidenceSummary;
};

export type DeleteRiskResult =
  DeleteTaskResult;

export type RiskDashboardSummary = {
  totalRisks: number;
  totalTasks: number;

  pendingRisks: number;
  inProgressRisks: number;
  onHoldRisks: number;
  completeRisks: number;
  overdueRisks: number;

  completionPercentage: number;
};

/* ---------- CONSTANTS ---------- */

export const RISK_STATUSES =
  TASK_STATUSES;

export const RISK_SORT_FIELDS =
  TASK_SORT_FIELDS;

/* ---------- CRUD ALIASES ---------- */

export const createRisk =
  createTask;

export const getRisks =
  async (
    params: RiskListParams = {}
  ): Promise<RiskListResult> => {
    const result =
      await getTasks(
        params
      );

    return {
      risks:
        result.tasks,

      pagination:
        result.pagination,
    };
  };

export const getRisksByProject =
  async (
    projectId: string,
    params: Omit<
      RiskListParams,
      "projectId"
    > = {}
  ): Promise<RiskListResult> => {
    const result =
      await getTasksByProject(
        projectId,
        params
      );

    return {
      risks:
        result.tasks,

      pagination:
        result.pagination,
    };
  };

export const getRiskById =
  async (
    riskId: string
  ): Promise<RiskDetailsResult> => {
    const result =
      await getTaskById(
        riskId
      );

    return {
      risk:
        result.task,

      evidence:
        result.evidence,
    };
  };

export const updateRisk =
  updateTask;

export const deleteRisk =
  deleteTask;

export const markRiskComplete =
  markTaskComplete;

export const markRiskInProgress =
  markTaskInProgress;

export const updateRiskStatus =
  async (
    riskId: string,
    status:
      | RiskStatus
      | UpdateRiskStatusPayload
  ): Promise<Risk> => {
    const normalizedStatus =
      typeof status ===
        "string"
        ? status
        : status.status;

    return updateTaskStatus(
      riskId,
      {
        status:
          normalizedStatus,
      }
    );
  };

/* ---------- DISPLAY ALIASES ---------- */

export const getRiskProjectReference =
  getTaskProjectReference;

export const getRiskSerialLabel =
  getTaskSerialLabel;

/* ---------- SUMMARY COMPATIBILITY ---------- */

export const buildRiskDashboardSummary =
  (
    risks: Risk[]
  ): RiskDashboardSummary => {
    const summary =
      buildTaskDashboardSummary(
        risks
      );

    return {
      totalRisks:
        summary.totalTasks,

      totalTasks:
        summary.totalTasks,

      /*
        Current Task lifecycle has no Pending / On Hold /
        Overdue state. Legacy UI receives zero until those
        components are migrated.
      */
      pendingRisks: 0,

      inProgressRisks:
        summary.inProgressTasks,

      onHoldRisks: 0,

      completeRisks:
        summary.completeTasks,

      overdueRisks: 0,

      completionPercentage:
        summary.completionPercentage,
    };
  };

export const getRiskDashboardSummary =
  async (
    projectId?: string
  ): Promise<RiskDashboardSummary> => {
    const summary =
      await getTaskDashboardSummary(
        projectId
      );

    return {
      totalRisks:
        summary.totalTasks,

      totalTasks:
        summary.totalTasks,

      pendingRisks: 0,

      inProgressRisks:
        summary.inProgressTasks,

      onHoldRisks: 0,

      completeRisks:
        summary.completeTasks,

      overdueRisks: 0,

      completionPercentage:
        summary.completionPercentage,
    };
  };
