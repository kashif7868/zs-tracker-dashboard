import api from "../api";

/* =========================================================
   ROLE STATUS
   ========================================================= */

export const ROLE_STATUSES = [
  "active",
  "inactive",
] as const;

export type RoleStatus =
  (typeof ROLE_STATUSES)[number];

/* =========================================================
   PERMISSION KEYS

   Backend routes mein currently yehi permission keys use
   ho rahi hain.
   ========================================================= */

export const ROLE_PERMISSION_GROUPS = [
  {
    key: "projects",
    label: "Projects",
    permissions: [
      {
        key: "projects.view",
        label: "View Projects",
        description:
          "Project list aur project details dekh sakta hai.",
      },
      {
        key: "projects.create",
        label: "Create Projects",
        description:
          "Naya project create kar sakta hai.",
      },
      {
        key: "projects.update",
        label: "Update Projects",
        description:
          "Existing project information update kar sakta hai.",
      },
      {
        key: "projects.archive",
        label: "Archive Projects",
        description:
          "Project archive kar sakta hai.",
      },
      {
        key: "projects.client_access",
        label: "Manage Client Access",
        description:
          "Client-access token generate aur revoke kar sakta hai.",
      },
    ],
  },
  {
    key: "risks",
    label: "Risk Register",
    permissions: [
      {
        key: "risks.view",
        label: "View Risks",
        description:
          "Risk list aur risk details dekh sakta hai.",
      },
      {
        key: "risks.create",
        label: "Create Risks",
        description:
          "Naya Risk Register record create kar sakta hai.",
      },
      {
        key: "risks.update",
        label: "Update Risks",
        description:
          "Risk information update kar sakta hai.",
      },
      {
        key: "risks.complete",
        label: "Manage Risk Status",
        description:
          "Risk ko Complete ya In Progress mark kar sakta hai.",
      },
      {
        key: "risks.delete",
        label: "Delete Risks",
        description:
          "Risk aur related Evidence delete kar sakta hai.",
      },
    ],
  },
  {
    key: "evidence",
    label: "Evidence",
    permissions: [
      {
        key: "evidence.view",
        label: "View Evidence",
        description:
          "Before aur After Evidence dekh sakta hai.",
      },
      {
        key: "evidence.upload",
        label: "Upload Evidence",
        description:
          "Before aur After Evidence images upload kar sakta hai.",
      },
      {
        key: "evidence.delete",
        label: "Delete Evidence",
        description:
          "Single ya multiple Evidence images delete kar sakta hai.",
      },
    ],
  },
] as const;

export type RolePermissionKey =
  (typeof ROLE_PERMISSION_GROUPS)[number]["permissions"][number]["key"];

export const ALL_ROLE_PERMISSIONS: string[] =
  ROLE_PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((permission) => permission.key)
  );

/* =========================================================
   ROLE MODEL
   ========================================================= */

export type DashboardRole = {
  _id: string;
  id: string;

  name: string;
  slug: string;
  description: string;

  permissions: string[];

  isSystemRole: boolean;
  status: RoleStatus;

  assignedUsersCount: number;

  createdBy: string | null;
  updatedBy: string | null;

  createdAt: string;
  updatedAt: string;
};

/* =========================================================
   ROLE LIST QUERY
   ========================================================= */

export type RoleListParams = {
  search?: string;
  status?: RoleStatus | "";

  page?: number;
  limit?: number;

  sortBy?:
    | "name"
    | "slug"
    | "status"
    | "createdAt"
    | "updatedAt";

  sortOrder?: "asc" | "desc";
};

/* =========================================================
   ROLE LIST RESULT
   ========================================================= */

export type RoleListResult = {
  roles: DashboardRole[];

  count: number;
  total: number;

  page: number;
  limit: number;
  totalPages: number;
};

/* =========================================================
   CREATE / UPDATE PAYLOADS
   ========================================================= */

export type CreateRolePayload = {
  name: string;

  slug?: string;
  description?: string;

  permissions: string[];

  status?: RoleStatus;
};

export type UpdateRolePayload = {
  name?: string;

  slug?: string;
  description?: string;

  permissions?: string[];

  status?: RoleStatus;
};

export type UpdateRoleStatusPayload = {
  status: RoleStatus;
};

/* =========================================================
   ROLE SUMMARY
   ========================================================= */

export type RoleDashboardSummary = {
  totalRoles: number;

  activeRoles: number;
  inactiveRoles: number;

  systemRoles: number;
  customRoles: number;

  assignedUsers: number;
};

/* =========================================================
   API RESPONSE ENVELOPE
   ========================================================= */

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

/* =========================================================
   RESPONSE EXTRACTOR

   Supports:

   {
     success,
     data
   }

   And:

   {
     success,
     roles
   }
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

/* =========================================================
   NORMALIZERS
   ========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value === "string"
    ? value
    : "";
};

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : fallback;
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value === true;
};

const normalizeRoleStatus = (
  value: unknown
): RoleStatus => {
  return value === "inactive"
    ? "inactive"
    : "active";
};

const normalizePermissions = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter(
          (
            permission
          ): permission is string =>
            typeof permission ===
            "string"
        )
        .map((permission) =>
          permission
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    ),
  ];
};

/* =========================================================
   ROLE NORMALIZER
   ========================================================= */

const normalizeRole = (
  rawRole: unknown
): DashboardRole => {
  const role =
    rawRole &&
    typeof rawRole === "object"
      ? (
          rawRole as {
            _id?: unknown;
            id?: unknown;

            name?: unknown;
            slug?: unknown;
            description?: unknown;

            permissions?: unknown;

            isSystemRole?: unknown;
            status?: unknown;

            assignedUsersCount?: unknown;
            usersCount?: unknown;

            createdBy?: unknown;
            updatedBy?: unknown;

            createdAt?: unknown;
            updatedAt?: unknown;
          }
        )
      : {};

  const roleId =
    normalizeString(
      role._id
    ) ||
    normalizeString(
      role.id
    );

  return {
    _id: roleId,
    id: roleId,

    name:
      normalizeString(
        role.name
      ),

    slug:
      normalizeString(
        role.slug
      ),

    description:
      normalizeString(
        role.description
      ),

    permissions:
      normalizePermissions(
        role.permissions
      ),

    isSystemRole:
      normalizeBoolean(
        role.isSystemRole
      ),

    status:
      normalizeRoleStatus(
        role.status
      ),

    assignedUsersCount:
      normalizeNumber(
        role.assignedUsersCount ??
          role.usersCount
      ),

    createdBy:
      normalizeString(
        role.createdBy
      ) || null,

    updatedBy:
      normalizeString(
        role.updatedBy
      ) || null,

    createdAt:
      normalizeString(
        role.createdAt
      ),

    updatedAt:
      normalizeString(
        role.updatedAt
      ),
  };
};

/* =========================================================
   EXTRACT SINGLE ROLE
   ========================================================= */

const extractRole = (
  data: unknown
): DashboardRole => {
  if (
    data &&
    typeof data === "object" &&
    "role" in data
  ) {
    return normalizeRole(
      (
        data as {
          role?: unknown;
        }
      ).role
    );
  }

  return normalizeRole(data);
};

/* =========================================================
   CLEAN CREATE PAYLOAD
   ========================================================= */

const cleanCreateRolePayload = (
  payload: CreateRolePayload
): CreateRolePayload => {
  return {
    name:
      payload.name.trim(),

    ...(payload.slug?.trim()
      ? {
          slug:
            payload.slug
              .trim()
              .toLowerCase(),
        }
      : {}),

    description:
      payload.description?.trim() ||
      "",

    permissions:
      normalizePermissions(
        payload.permissions
      ),

    status:
      payload.status ||
      "active",
  };
};

/* =========================================================
   CLEAN UPDATE PAYLOAD
   ========================================================= */

const cleanUpdateRolePayload = (
  payload: UpdateRolePayload
): UpdateRolePayload => {
  const updateData: UpdateRolePayload =
    {};

  if (
    typeof payload.name ===
    "string"
  ) {
    updateData.name =
      payload.name.trim();
  }

  if (
    typeof payload.slug ===
    "string"
  ) {
    updateData.slug =
      payload.slug
        .trim()
        .toLowerCase();
  }

  if (
    typeof payload.description ===
    "string"
  ) {
    updateData.description =
      payload.description.trim();
  }

  if (
    Array.isArray(
      payload.permissions
    )
  ) {
    updateData.permissions =
      normalizePermissions(
        payload.permissions
      );
  }

  if (
    payload.status === "active" ||
    payload.status === "inactive"
  ) {
    updateData.status =
      payload.status;
  }

  return updateData;
};

/* =========================================================
   GET ALL ROLES

   GET /roles
   ========================================================= */

export const getRoles = async (
  params: RoleListParams = {}
): Promise<RoleListResult> => {
  const response =
    await api.get(
      "/roles",
      {
        params: {
          ...(params.search?.trim()
            ? {
                search:
                  params.search.trim(),
              }
            : {}),

          ...(params.status
            ? {
                status:
                  params.status,
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

  const data =
    extractResponseData<
      | unknown[]
      | {
          roles?: unknown[];

          count?: unknown;
          total?: unknown;

          page?: unknown;
          limit?: unknown;

          totalPages?: unknown;

          pagination?: {
            page?: unknown;
            limit?: unknown;
            total?: unknown;
            totalPages?: unknown;
          };
        }
    >(response);

  if (Array.isArray(data)) {
    const roles =
      data.map(
        normalizeRole
      );

    return {
      roles,

      count:
        roles.length,

      total:
        roles.length,

      page: 1,

      limit:
        roles.length,

      totalPages:
        roles.length > 0
          ? 1
          : 0,
    };
  }

  const roles =
    Array.isArray(
      data?.roles
    )
      ? data.roles.map(
          normalizeRole
        )
      : [];

  const page =
    normalizeNumber(
      data?.pagination?.page ??
        data?.page,
      1
    );

  const limit =
    normalizeNumber(
      data?.pagination?.limit ??
        data?.limit,
      roles.length || 10
    );

  const total =
    normalizeNumber(
      data?.pagination?.total ??
        data?.total ??
        data?.count,
      roles.length
    );

  const totalPages =
    normalizeNumber(
      data?.pagination?.totalPages ??
        data?.totalPages,
      limit > 0
        ? Math.ceil(
            total / limit
          )
        : 0
    );

  return {
    roles,

    count:
      normalizeNumber(
        data?.count,
        roles.length
      ),

    total,

    page,
    limit,
    totalPages,
  };
};

/* =========================================================
   GET ACTIVE ROLES

   User role-assignment dropdown ke liye.

   GET /roles/active
   ========================================================= */

export const getActiveRoles =
  async (): Promise<
    DashboardRole[]
  > => {
    const response =
      await api.get(
        "/roles/active"
      );

    const data =
      extractResponseData<
        | unknown[]
        | {
            roles?: unknown[];
          }
      >(response);

    if (Array.isArray(data)) {
      return data.map(
        normalizeRole
      );
    }

    return Array.isArray(
      data?.roles
    )
      ? data.roles.map(
          normalizeRole
        )
      : [];
  };

/* =========================================================
   GET ROLE BY ID

   GET /roles/:roleId
   ========================================================= */

export const getRoleById =
  async (
    roleId: string
  ): Promise<DashboardRole> => {
    const response =
      await api.get(
        `/roles/${roleId}`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(data);
  };

/* =========================================================
   CREATE ROLE

   POST /roles
   ========================================================= */

export const createRole =
  async (
    payload: CreateRolePayload
  ): Promise<DashboardRole> => {
    const response =
      await api.post(
        "/roles",
        cleanCreateRolePayload(
          payload
        )
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(data);
  };

/* =========================================================
   UPDATE ROLE

   PATCH /roles/:roleId
   ========================================================= */

export const updateRole =
  async (
    roleId: string,
    payload: UpdateRolePayload
  ): Promise<DashboardRole> => {
    const response =
      await api.patch(
        `/roles/${roleId}`,
        cleanUpdateRolePayload(
          payload
        )
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(data);
  };

/* =========================================================
   UPDATE ROLE STATUS

   PATCH /roles/:roleId/status
   ========================================================= */

export const updateRoleStatus =
  async (
    roleId: string,
    status: RoleStatus
  ): Promise<DashboardRole> => {
    const response =
      await api.patch(
        `/roles/${roleId}/status`,
        {
          status,
        } satisfies UpdateRoleStatusPayload
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRole(data);
  };

/* =========================================================
   DELETE CUSTOM ROLE

   DELETE /roles/:roleId
   ========================================================= */

export const deleteRole =
  async (
    roleId: string
  ): Promise<{
    roleId: string;
    message?: string;
  }> => {
    const response =
      await api.delete(
        `/roles/${roleId}`
      );

    const data =
      extractResponseData<
        | {
            roleId?: unknown;
            message?: unknown;
          }
        | undefined
      >(response);

    return {
      roleId:
        normalizeString(
          data?.roleId
        ) || roleId,

      message:
        normalizeString(
          data?.message
        ) || undefined,
    };
  };

/* =========================================================
   ENSURE SYSTEM ROLES

   Super Admin only.

   POST /roles/system/ensure
   ========================================================= */

export const ensureSystemRoles =
  async (): Promise<
    DashboardRole[]
  > => {
    const response =
      await api.post(
        "/roles/system/ensure"
      );

    const data =
      extractResponseData<
        | unknown[]
        | {
            roles?: unknown[];
          }
      >(response);

    if (Array.isArray(data)) {
      return data.map(
        normalizeRole
      );
    }

    return Array.isArray(
      data?.roles
    )
      ? data.roles.map(
          normalizeRole
        )
      : [];
  };

/* =========================================================
   BUILD ROLE SUMMARY

   Roles dashboard cards ke liye.
   ========================================================= */

export const buildRoleDashboardSummary =
  (
    roles: DashboardRole[]
  ): RoleDashboardSummary => {
    const totalRoles =
      roles.length;

    const activeRoles =
      roles.filter(
        (role) =>
          role.status ===
          "active"
      ).length;

    const inactiveRoles =
      roles.filter(
        (role) =>
          role.status ===
          "inactive"
      ).length;

    const systemRoles =
      roles.filter(
        (role) =>
          role.isSystemRole
      ).length;

    const customRoles =
      roles.filter(
        (role) =>
          !role.isSystemRole
      ).length;

    const assignedUsers =
      roles.reduce(
        (
          total,
          role
        ) =>
          total +
          role.assignedUsersCount,
        0
      );

    return {
      totalRoles,

      activeRoles,
      inactiveRoles,

      systemRoles,
      customRoles,

      assignedUsers,
    };
  };

/* =========================================================
   PERMISSION HELPERS
   ========================================================= */

export const hasRolePermission = (
  role: Pick<
    DashboardRole,
    "permissions"
  >,
  permission: string
): boolean => {
  return (
    role.permissions.includes(
      "*"
    ) ||
    role.permissions.includes(
      permission
    )
  );
};

export const getPermissionLabel = (
  permissionKey: string
): string => {
  for (
    const group of
    ROLE_PERMISSION_GROUPS
  ) {
    const permission =
      group.permissions.find(
        (item) =>
          item.key ===
          permissionKey
      );

    if (permission) {
      return permission.label;
    }
  }

  return permissionKey;
};