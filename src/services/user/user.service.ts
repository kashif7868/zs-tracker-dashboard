import api from "../api";

/* =========================================================
   USER STATUS
   ========================================================= */

export const USER_STATUSES = [
  "active",
  "inactive",
  "blocked",
] as const;

export type UserStatus =
  (typeof USER_STATUSES)[number];

/* =========================================================
   AVATAR SETTINGS
   ========================================================= */

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_IMAGE_SIZE =
  5 * 1024 * 1024;

/* =========================================================
   ROLE DETAILS
   ========================================================= */

export type UserRoleDetails = {
  _id?: string;

  name: string;
  slug: string;

  description: string;

  permissions: string[];

  isSystemRole: boolean;

  status: "active" | "inactive";
};

/* =========================================================
   MAIN USER TYPE
   ========================================================= */

export type DashboardUser = {
  _id: string;
  id: string;

  name: string;
  email: string;

  phone: string;
  countryCode: string;

  role: string;

  roleDetails: UserRoleDetails | null;

  permissions: string[];

  roleAssignedBy: string | null;
  roleAssignedAt: string | null;

  avatar: string;
  provider: string;

  isVerified: boolean;
  isPhoneVerified: boolean;
  is2FAEnabled: boolean;

  status: UserStatus;

  createdAt: string;
  updatedAt: string;
};

/* =========================================================
   USER LIST QUERY
   ========================================================= */

export type UserListParams = {
  search?: string;

  role?: string;

  status?: UserStatus | "";

  isVerified?: boolean | "";
};

/* =========================================================
   USER LIST RESULT
   ========================================================= */

export type UserListResult = {
  users: DashboardUser[];

  count: number;
};

/* =========================================================
   UPDATE USER PROFILE PAYLOAD

   Avatar, Role aur status ke separate endpoints hain.
   ========================================================= */

export type UpdateUserPayload = {
  name?: string;
  email?: string;

  phone?: string;
  countryCode?: string;
};

/* =========================================================
   ASSIGN ROLE PAYLOAD
   ========================================================= */

export type AssignUserRolePayload = {
  roleId?: string;
  roleSlug?: string;
};

/* =========================================================
   STATUS PAYLOAD
   ========================================================= */

export type UpdateUserStatusPayload = {
  status: UserStatus;
};

/* =========================================================
   DELETE RESULT
   ========================================================= */

export type DeleteUserResult = {
  userId: string;

  message?: string;
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
   BASIC NORMALIZERS
   ========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value === "string"
    ? value
    : "";
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value === true;
};

const normalizeUserStatus = (
  value: unknown
): UserStatus => {
  if (value === "blocked") {
    return "blocked";
  }

  if (value === "inactive") {
    return "inactive";
  }

  return "active";
};

/* =========================================================
   ROLE DETAILS NORMALIZER
   ========================================================= */

const normalizeRoleDetails = (
  rawRole: unknown
): UserRoleDetails | null => {
  if (
    !rawRole ||
    typeof rawRole !== "object"
  ) {
    return null;
  }

  const role =
    rawRole as Partial<UserRoleDetails>;

  const slug =
    normalizeString(
      role.slug
    );

  if (!slug) {
    return null;
  }

  return {
    _id:
      normalizeString(
        role._id
      ) || undefined,

    name:
      normalizeString(
        role.name
      ),

    slug,

    description:
      normalizeString(
        role.description
      ),

    permissions:
      Array.isArray(
        role.permissions
      )
        ? role.permissions.filter(
            (
              permission
            ): permission is string =>
              typeof permission ===
              "string"
          )
        : [],

    isSystemRole:
      normalizeBoolean(
        role.isSystemRole
      ),

    status:
      role.status === "inactive"
        ? "inactive"
        : "active",
  };
};

/* =========================================================
   USER NORMALIZER
   ========================================================= */

const normalizeUser = (
  rawUser: unknown
): DashboardUser => {
  const user =
    rawUser &&
    typeof rawUser === "object"
      ? (
          rawUser as {
            _id?: unknown;
            id?: unknown;

            name?: unknown;
            email?: unknown;

            phone?: unknown;
            countryCode?: unknown;

            role?: unknown;

            roleDetails?: unknown;

            permissions?: unknown;

            roleAssignedBy?: unknown;
            roleAssignedAt?: unknown;

            avatar?: unknown;
            provider?: unknown;

            isVerified?: unknown;
            isPhoneVerified?: unknown;
            is2FAEnabled?: unknown;

            status?: unknown;

            createdAt?: unknown;
            updatedAt?: unknown;
          }
        )
      : {};

  const userId =
    normalizeString(
      user._id
    ) ||
    normalizeString(
      user.id
    );

  const roleDetails =
    normalizeRoleDetails(
      user.roleDetails
    );

  const role =
    normalizeString(
      user.role
    ) ||
    roleDetails?.slug ||
    "user";

  return {
    _id: userId,
    id: userId,

    name:
      normalizeString(
        user.name
      ),

    email:
      normalizeString(
        user.email
      ),

    phone:
      normalizeString(
        user.phone
      ),

    countryCode:
      normalizeString(
        user.countryCode
      ),

    role,

    roleDetails,

    permissions:
      Array.isArray(
        user.permissions
      )
        ? user.permissions.filter(
            (
              permission
            ): permission is string =>
              typeof permission ===
                "string"
          )
        : roleDetails?.permissions || [],

    roleAssignedBy:
      normalizeString(
        user.roleAssignedBy
      ) || null,

    roleAssignedAt:
      normalizeString(
        user.roleAssignedAt
      ) || null,

    avatar:
      normalizeString(
        user.avatar
      ),

    provider:
      normalizeString(
        user.provider
      ) || "local",

    isVerified:
      normalizeBoolean(
        user.isVerified
      ),

    isPhoneVerified:
      normalizeBoolean(
        user.isPhoneVerified
      ),

    is2FAEnabled:
      normalizeBoolean(
        user.is2FAEnabled
      ),

    status:
      normalizeUserStatus(
        user.status
      ),

    createdAt:
      normalizeString(
        user.createdAt
      ),

    updatedAt:
      normalizeString(
        user.updatedAt
      ),
  };
};

/* =========================================================
   EXTRACT SINGLE USER
   ========================================================= */

const extractUser = (
  data: unknown
): DashboardUser => {
  if (
    data &&
    typeof data === "object" &&
    "user" in data
  ) {
    return normalizeUser(
      (
        data as {
          user?: unknown;
        }
      ).user
    );
  }

  return normalizeUser(data);
};

/* =========================================================
   AVATAR FILE VALIDATION
   ========================================================= */

export const validateAvatarFile = (
  file: File | null | undefined
): string => {
  if (!file) {
    return "Please select a profile picture.";
  }

  if (
    !ALLOWED_AVATAR_MIME_TYPES.includes(
      file.type as
        (typeof ALLOWED_AVATAR_MIME_TYPES)[number]
    )
  ) {
    return "Only JPG, JPEG, PNG and WEBP images are allowed.";
  }

  if (
    file.size >
    MAX_AVATAR_IMAGE_SIZE
  ) {
    return "Profile picture must be 5 MB or smaller.";
  }

  return "";
};

/* =========================================================
   AVATAR DISPLAY URL

   Database value:

   /uploads/users/avatars/avatar-user-id.webp

   Absolute API base example:

   http://localhost:5000/api/v1

   Display URL:

   http://localhost:5000/uploads/users/avatars/avatar-user-id.webp
   ========================================================= */

export const getUserAvatarUrl = (
  avatarPath: string
): string => {
  const normalizedPath =
    avatarPath.trim();

  if (!normalizedPath) {
    return "";
  }

  if (
    normalizedPath.startsWith(
      "http://"
    ) ||
    normalizedPath.startsWith(
      "https://"
    ) ||
    normalizedPath.startsWith(
      "blob:"
    ) ||
    normalizedPath.startsWith(
      "data:"
    )
  ) {
    return normalizedPath;
  }

  const baseURL =
    normalizeString(
      api.defaults.baseURL
    );

  /*
    Relative Axios baseURL ki surat mein project ka Vite proxy
    /uploads path serve karega.
  */

  if (
    !baseURL ||
    baseURL.startsWith("/")
  ) {
    return normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
  }

  try {
    const parsedBaseURL =
      new URL(baseURL);

    const cleanPath =
      normalizedPath.startsWith("/")
        ? normalizedPath
        : `/${normalizedPath}`;

    return `${parsedBaseURL.origin}${cleanPath}`;
  } catch {
    return normalizedPath;
  }
};

/* =========================================================
   GET ALL REGISTERED USERS

   GET /users
   ========================================================= */

export const getUsers = async (
  params: UserListParams = {}
): Promise<UserListResult> => {
  const response =
    await api.get(
      "/users",
      {
        params: {
          ...(params.search?.trim()
            ? {
                search:
                  params.search.trim(),
              }
            : {}),

          ...(params.role?.trim()
            ? {
                role:
                  params.role.trim(),
              }
            : {}),

          ...(params.status
            ? {
                status:
                  params.status,
              }
            : {}),

          ...(typeof params.isVerified ===
          "boolean"
            ? {
                isVerified:
                  params.isVerified,
              }
            : {}),
        },
      }
    );

  const data =
    extractResponseData<
      | unknown[]
      | {
          users?: unknown[];
          count?: unknown;
        }
    >(response);

  if (Array.isArray(data)) {
    const users =
      data.map(
        normalizeUser
      );

    return {
      users,

      count:
        users.length,
    };
  }

  const users =
    Array.isArray(
      data?.users
    )
      ? data.users.map(
          normalizeUser
        )
      : [];

  const countValue =
    Number(
      data?.count
    );

  return {
    users,

    count:
      Number.isFinite(
        countValue
      )
        ? countValue
        : users.length,
  };
};

/* =========================================================
   GET USER BY ID

   GET /users/:userId
   ========================================================= */

export const getUserById = async (
  userId: string
): Promise<DashboardUser> => {
  const response =
    await api.get(
      `/users/${userId}`
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  return extractUser(data);
};

/* =========================================================
   UPDATE USER PROFILE

   PATCH /users/:userId
   ========================================================= */

export const updateUser = async (
  userId: string,
  payload: UpdateUserPayload
): Promise<DashboardUser> => {
  const updateData: UpdateUserPayload =
    {};

  if (
    typeof payload.name ===
      "string"
  ) {
    updateData.name =
      payload.name.trim();
  }

  if (
    typeof payload.email ===
      "string"
  ) {
    updateData.email =
      payload.email
        .trim()
        .toLowerCase();
  }

  if (
    typeof payload.phone ===
      "string"
  ) {
    updateData.phone =
      payload.phone.trim();
  }

  if (
    typeof payload.countryCode ===
      "string"
  ) {
    updateData.countryCode =
      payload.countryCode.trim();
  }

  const response =
    await api.patch(
      `/users/${userId}`,
      updateData
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  return extractUser(data);
};

/* =========================================================
   UPLOAD OR REPLACE USER AVATAR

   PATCH /users/:userId/avatar

   multipart/form-data field:

   avatar
   ========================================================= */

export const uploadUserAvatar =
  async (
    userId: string,
    avatarFile: File
  ): Promise<DashboardUser> => {
    const normalizedUserId =
      userId.trim();

    if (!normalizedUserId) {
      throw new Error(
        "User ID is required."
      );
    }

    const validationError =
      validateAvatarFile(
        avatarFile
      );

    if (validationError) {
      throw new Error(
        validationError
      );
    }

    const formData =
      new FormData();

    formData.append(
      "avatar",
      avatarFile
    );

    /*
      Content-Type manually set nahi karna.

      Browser/Axios automatically multipart boundary add karega.
    */

    const response =
      await api.patch(
        `/users/${normalizedUserId}/avatar`,
        formData
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(data);
  };

/* =========================================================
   REMOVE USER AVATAR

   DELETE /users/:userId/avatar
   ========================================================= */

export const removeUserAvatar =
  async (
    userId: string
  ): Promise<DashboardUser> => {
    const normalizedUserId =
      userId.trim();

    if (!normalizedUserId) {
      throw new Error(
        "User ID is required."
      );
    }

    const response =
      await api.delete(
        `/users/${normalizedUserId}/avatar`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(data);
  };

/* =========================================================
   ASSIGN ROLE

   PATCH /users/:userId/role
   ========================================================= */

export const assignUserRole =
  async (
    userId: string,
    payload: AssignUserRolePayload
  ): Promise<DashboardUser> => {
    const roleId =
      payload.roleId?.trim();

    const roleSlug =
      payload.roleSlug?.trim();

    if (
      !roleId &&
      !roleSlug
    ) {
      throw new Error(
        "Role ID or Role slug is required."
      );
    }

    const response =
      await api.patch(
        `/users/${userId}/role`,
        roleId
          ? {
              roleId,
            }
          : {
              roleSlug,
            }
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(data);
  };

/* =========================================================
   REMOVE ASSIGNED ROLE

   DELETE /users/:userId/role
   ========================================================= */

export const removeUserRole =
  async (
    userId: string
  ): Promise<DashboardUser> => {
    const response =
      await api.delete(
        `/users/${userId}/role`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(data);
  };

/* =========================================================
   UPDATE USER STATUS

   PATCH /users/:userId/status
   ========================================================= */

export const updateUserStatus =
  async (
    userId: string,
    status: UserStatus
  ): Promise<DashboardUser> => {
    const response =
      await api.patch(
        `/users/${userId}/status`,
        {
          status,
        }
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractUser(data);
  };

/* =========================================================
   DELETE USER

   DELETE /users/:userId
   ========================================================= */

export const deleteUser = async (
  userId: string
): Promise<DeleteUserResult> => {
  const response =
    await api.delete(
      `/users/${userId}`
    );

  const data =
    extractResponseData<
      | {
          userId?: unknown;
          message?: unknown;
        }
      | undefined
    >(response);

  return {
    userId:
      normalizeString(
        data?.userId
      ) || userId,

    message:
      normalizeString(
        data?.message
      ) || undefined,
  };
};

/* =========================================================
   USER SUMMARY
   ========================================================= */

export type UserDashboardSummary = {
  totalUsers: number;

  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;

  verifiedUsers: number;
  unverifiedUsers: number;

  assignedUsers: number;
  unassignedUsers: number;
};

export const buildUserDashboardSummary =
  (
    users: DashboardUser[]
  ): UserDashboardSummary => {
    const totalUsers =
      users.length;

    const activeUsers =
      users.filter(
        (user) =>
          user.status ===
          "active"
      ).length;

    const inactiveUsers =
      users.filter(
        (user) =>
          user.status ===
          "inactive"
      ).length;

    const blockedUsers =
      users.filter(
        (user) =>
          user.status ===
          "blocked"
      ).length;

    const verifiedUsers =
      users.filter(
        (user) =>
          user.isVerified
      ).length;

    const unverifiedUsers =
      totalUsers -
      verifiedUsers;

    const assignedUsers =
      users.filter(
        (user) =>
          user.role !== "user"
      ).length;

    const unassignedUsers =
      totalUsers -
      assignedUsers;

    return {
      totalUsers,

      activeUsers,
      inactiveUsers,
      blockedUsers,

      verifiedUsers,
      unverifiedUsers,

      assignedUsers,
      unassignedUsers,
    };
  };