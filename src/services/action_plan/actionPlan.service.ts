import api from "../api";

export type ActionPlanStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "on_hold";

export type ActionPlanPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ActionPlan = {
  _id: string;

  projectId:
    | string
    | {
        _id?: string;
        title?: string;
        projectName?: string;
        projectCode?: string;
        referenceNo?: string;
        projectReferenceNo?: string;
        status?: string;
      };

  projectCode: string;

  taskId:
    | string
    | {
        _id?: string;
        serialNo?: number;
        description?: string;
        status?: string;
        projectId?: string;
      };

  taskSerialNo?: number;

  title: string;
  description?: string;

  priority: ActionPlanPriority;
  status: ActionPlanStatus;

  targetDate?: string | null;
  completedAt?: string | null;

  createdBy?:
    | string
    | {
        _id?: string;
        name?: string;
        fullName?: string;
        email?: string;
      }
    | null;

  updatedBy?:
    | string
    | {
        _id?: string;
        name?: string;
        fullName?: string;
        email?: string;
      }
    | null;

  createdAt?: string;
  updatedAt?: string;
};

export type ActionPlanSummary = {
  total: number;
  pending: number;
  inProgress: number;
  complete: number;
  onHold: number;
  critical: number;
  overdue: number;
  completionPercentage: number;
};

export type ActionPlanPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ActionPlanListResult = {
  actionPlans: ActionPlan[];
  pagination: ActionPlanPagination;
};

export type CreateActionPlanPayload = {
  projectId: string;
  taskId: string;
  title: string;
  description?: string;
  priority?: ActionPlanPriority;
  status?: ActionPlanStatus;
  targetDate?: string | null;
};

export type UpdateActionPlanPayload = {
  title?: string;
  description?: string;
  priority?: ActionPlanPriority;
  targetDate?: string | null;
};

export type ActionPlanListQuery = {
  projectId?: string;
  taskId?: string;
  status?: ActionPlanStatus;
  priority?: ActionPlanPriority;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "targetDate"
    | "priority"
    | "status"
    | "title";
  sortOrder?: "asc" | "desc";
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

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
    typeof responseBody === "object" &&
    "data" in responseBody
  ) {
    const envelope =
      responseBody as ApiEnvelope<T>;

    if (
      envelope.data !== undefined
    ) {
      return envelope.data;
    }
  }

  return responseBody as T;
};

const normalizeString = (
  value: unknown
): string => {
  return typeof value === "string"
    ? value.trim()
    : "";
};

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

const normalizeBoolean = (
  value: unknown,
  fallback = false
): boolean => {
  return typeof value === "boolean"
    ? value
    : fallback;
};

const normalizeStatus = (
  value: unknown
): ActionPlanStatus => {
  if (
    value === "pending" ||
    value === "in_progress" ||
    value === "complete" ||
    value === "on_hold"
  ) {
    return value;
  }

  return "pending";
};

const normalizePriority = (
  value: unknown
): ActionPlanPriority => {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }

  return "medium";
};

const normalizeActionPlan = (
  rawActionPlan: unknown
): ActionPlan => {
  const actionPlan =
    rawActionPlan &&
    typeof rawActionPlan === "object"
      ? rawActionPlan as Record<string, unknown>
      : {};

  return {
    _id:
      normalizeString(
        actionPlan._id
      ),

    projectId:
      actionPlan.projectId as ActionPlan["projectId"],

    projectCode:
      normalizeString(
        actionPlan.projectCode
      ),

    taskId:
      actionPlan.taskId as ActionPlan["taskId"],

    taskSerialNo:
      actionPlan.taskSerialNo !== undefined
        ? normalizeNumber(
            actionPlan.taskSerialNo
          )
        : undefined,

    title:
      normalizeString(
        actionPlan.title
      ),

    description:
      normalizeString(
        actionPlan.description
      ),

    priority:
      normalizePriority(
        actionPlan.priority
      ),

    status:
      normalizeStatus(
        actionPlan.status
      ),

    targetDate:
      normalizeString(
        actionPlan.targetDate
      ) || null,

    completedAt:
      normalizeString(
        actionPlan.completedAt
      ) || null,

    createdBy:
      actionPlan.createdBy as ActionPlan["createdBy"],

    updatedBy:
      actionPlan.updatedBy as ActionPlan["updatedBy"],

    createdAt:
      normalizeString(
        actionPlan.createdAt
      ),

    updatedAt:
      normalizeString(
        actionPlan.updatedAt
      ),
  };
};

const normalizePagination = (
  rawPagination: unknown
): ActionPlanPagination => {
  const pagination =
    rawPagination &&
    typeof rawPagination === "object"
      ? rawPagination as Record<string, unknown>
      : {};

  return {
    page:
      normalizeNumber(
        pagination.page,
        1
      ),

    limit:
      normalizeNumber(
        pagination.limit,
        20
      ),

    total:
      normalizeNumber(
        pagination.total
      ),

    totalPages:
      normalizeNumber(
        pagination.totalPages,
        1
      ),

    hasNextPage:
      normalizeBoolean(
        pagination.hasNextPage
      ),

    hasPreviousPage:
      normalizeBoolean(
        pagination.hasPreviousPage
      ),
  };
};

const buildQueryParams = (
  query: ActionPlanListQuery = {}
): Record<string, string | number> => {
  const params: Record<
    string,
    string | number
  > = {};

  if (query.projectId?.trim()) {
    params.projectId =
      query.projectId.trim();
  }

  if (query.taskId?.trim()) {
    params.taskId =
      query.taskId.trim();
  }

  if (query.status) {
    params.status =
      query.status;
  }

  if (query.priority) {
    params.priority =
      query.priority;
  }

  if (query.search?.trim()) {
    params.search =
      query.search.trim();
  }

  if (query.page) {
    params.page =
      query.page;
  }

  if (query.limit) {
    params.limit =
      query.limit;
  }

  if (query.sortBy) {
    params.sortBy =
      query.sortBy;
  }

  if (query.sortOrder) {
    params.sortOrder =
      query.sortOrder;
  }

  return params;
};

export const getActionPlans =
  async (
    query: ActionPlanListQuery = {}
  ): Promise<ActionPlanListResult> => {
    const response =
      await api.get(
        "/action-plans",
        {
          params:
            buildQueryParams(
              query
            ),
        }
      );

    const data =
      extractResponseData<{
        actionPlans?: unknown[];
        pagination?: unknown;
      }>(response);

    const actionPlans =
      Array.isArray(
        data?.actionPlans
      )
        ? data.actionPlans.map(
            normalizeActionPlan
          )
        : [];

    return {
      actionPlans,
      pagination:
        normalizePagination(
          data?.pagination
        ),
    };
  };

export const createActionPlan =
  async (
    payload: CreateActionPlanPayload
  ): Promise<ActionPlan> => {
    const response =
      await api.post(
        "/action-plans",
        payload
      );

    const data =
      extractResponseData<{
        actionPlan?: unknown;
      }>(response);

    return normalizeActionPlan(
      data?.actionPlan
    );
  };

export const getActionPlanSummary =
  async (
    projectId?: string
  ): Promise<ActionPlanSummary> => {
    const response =
      await api.get(
        "/action-plans/summary",
        {
          params:
            projectId?.trim()
              ? {
                  projectId:
                    projectId.trim(),
                }
              : {},
        }
      );

    const data =
      extractResponseData<{
        summary?: unknown;
      }>(response);

    const summary =
      data?.summary &&
      typeof data.summary === "object"
        ? data.summary as Record<string, unknown>
        : {};

    return {
      total:
        normalizeNumber(
          summary.total
        ),
      pending:
        normalizeNumber(
          summary.pending
        ),
      inProgress:
        normalizeNumber(
          summary.inProgress
        ),
      complete:
        normalizeNumber(
          summary.complete
        ),
      onHold:
        normalizeNumber(
          summary.onHold
        ),
      critical:
        normalizeNumber(
          summary.critical
        ),
      overdue:
        normalizeNumber(
          summary.overdue
        ),
      completionPercentage:
        normalizeNumber(
          summary.completionPercentage
        ),
    };
  };

export const getProjectActionPlans =
  async (
    projectId: string,
    query:
      Omit<
        ActionPlanListQuery,
        "projectId"
      > = {}
  ): Promise<ActionPlanListResult> => {
    const normalizedProjectId =
      projectId.trim();

    if (!normalizedProjectId) {
      throw new Error(
        "Project ID is required."
      );
    }

    const response =
      await api.get(
        `/action-plans/project/${encodeURIComponent(
          normalizedProjectId
        )}`,
        {
          params:
            buildQueryParams(
              query
            ),
        }
      );

    const data =
      extractResponseData<{
        actionPlans?: unknown[];
        pagination?: unknown;
      }>(response);

    return {
      actionPlans:
        Array.isArray(
          data?.actionPlans
        )
          ? data.actionPlans.map(
              normalizeActionPlan
            )
          : [],
      pagination:
        normalizePagination(
          data?.pagination
        ),
    };
  };

export const getTaskActionPlans =
  async (
    taskId: string,
    query:
      Omit<
        ActionPlanListQuery,
        "taskId"
      > = {}
  ): Promise<ActionPlanListResult> => {
    const normalizedTaskId =
      taskId.trim();

    if (!normalizedTaskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    const response =
      await api.get(
        `/action-plans/task/${encodeURIComponent(
          normalizedTaskId
        )}`,
        {
          params:
            buildQueryParams(
              query
            ),
        }
      );

    const data =
      extractResponseData<{
        actionPlans?: unknown[];
        pagination?: unknown;
      }>(response);

    return {
      actionPlans:
        Array.isArray(
          data?.actionPlans
        )
          ? data.actionPlans.map(
              normalizeActionPlan
            )
          : [],
      pagination:
        normalizePagination(
          data?.pagination
        ),
    };
  };

export const getActionPlanById =
  async (
    actionPlanId: string
  ): Promise<ActionPlan> => {
    const normalizedActionPlanId =
      actionPlanId.trim();

    if (!normalizedActionPlanId) {
      throw new Error(
        "Action Plan ID is required."
      );
    }

    const response =
      await api.get(
        `/action-plans/${encodeURIComponent(
          normalizedActionPlanId
        )}`
      );

    const data =
      extractResponseData<{
        actionPlan?: unknown;
      }>(response);

    return normalizeActionPlan(
      data?.actionPlan
    );
  };

export const updateActionPlan =
  async (
    actionPlanId: string,
    payload: UpdateActionPlanPayload
  ): Promise<ActionPlan> => {
    const normalizedActionPlanId =
      actionPlanId.trim();

    if (!normalizedActionPlanId) {
      throw new Error(
        "Action Plan ID is required."
      );
    }

    const response =
      await api.patch(
        `/action-plans/${encodeURIComponent(
          normalizedActionPlanId
        )}`,
        payload
      );

    const data =
      extractResponseData<{
        actionPlan?: unknown;
      }>(response);

    return normalizeActionPlan(
      data?.actionPlan
    );
  };

export const updateActionPlanStatus =
  async (
    actionPlanId: string,
    status: ActionPlanStatus
  ): Promise<ActionPlan> => {
    const normalizedActionPlanId =
      actionPlanId.trim();

    if (!normalizedActionPlanId) {
      throw new Error(
        "Action Plan ID is required."
      );
    }

    const response =
      await api.patch(
        `/action-plans/${encodeURIComponent(
          normalizedActionPlanId
        )}/status`,
        {
          status,
        }
      );

    const data =
      extractResponseData<{
        actionPlan?: unknown;
      }>(response);

    return normalizeActionPlan(
      data?.actionPlan
    );
  };

export const deleteActionPlan =
  async (
    actionPlanId: string
  ): Promise<ActionPlan> => {
    const normalizedActionPlanId =
      actionPlanId.trim();

    if (!normalizedActionPlanId) {
      throw new Error(
        "Action Plan ID is required."
      );
    }

    const response =
      await api.delete(
        `/action-plans/${encodeURIComponent(
          normalizedActionPlanId
        )}`
      );

    const data =
      extractResponseData<{
        actionPlan?: unknown;
      }>(response);

    return normalizeActionPlan(
      data?.actionPlan
    );
  };

export const getActionPlanStatusLabel = (
  status: ActionPlanStatus
): string => {
  if (status === "in_progress") {
    return "In Progress";
  }

  if (status === "on_hold") {
    return "On Hold";
  }

  if (status === "complete") {
    return "Complete";
  }

  return "Pending";
};

export const getActionPlanPriorityLabel = (
  priority: ActionPlanPriority
): string => {
  if (priority === "critical") {
    return "Critical";
  }

  if (priority === "high") {
    return "High";
  }

  if (priority === "low") {
    return "Low";
  }

  return "Medium";
};