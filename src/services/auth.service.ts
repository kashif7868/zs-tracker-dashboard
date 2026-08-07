import axios from "axios";

import api, {
  clearAuthStorage,
  setAuthTokens,
} from "./api";

/* =========================================================
   USER ROLE

   Role slug dynamic hai.

   Examples:

   user
   admin
   super_admin
   accountant
   electrical_engineer
   sales
   management_team
   ========================================================= */

export type UserRole = string;

/* =========================================================
   ROLE DETAILS
   ========================================================= */

export interface AuthRoleDetails {
  _id?: string;

  name: string;
  slug: string;

  description: string;

  permissions: string[];

  isSystemRole: boolean;

  status:
    | "active"
    | "inactive";
}

/* =========================================================
   AUTHENTICATED USER
   ========================================================= */

export interface AuthUser {
  _id?: string;
  id?: string;

  name: string;
  email: string;

  phone?: string;
  countryCode?: string;

  role: UserRole;

  roleDetails?: AuthRoleDetails | null;

  permissions?: string[];

  roleAssignedBy?: string | null;
  roleAssignedAt?: string | null;

  avatar?: string;

  provider?:
    | "local"
    | "google"
    | "facebook"
    | "github";

  isVerified?: boolean;
  isPhoneVerified?: boolean;
  is2FAEnabled?: boolean;

  status?:
    | "active"
    | "inactive"
    | "blocked";

  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   AUTH REQUEST PAYLOADS
   ========================================================= */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/* =========================================================
   AUTH RESPONSE
   ========================================================= */

export interface AuthResponse {
  success?: boolean;
  message?: string;

  accessToken?: string;
  refreshToken?: string;

  user?: AuthUser;

  emailVerification?: {
    verificationToken?: string;
    verificationUrl?: string;
  };

  verificationToken?: string;
  verificationUrl?: string;

  resetToken?: string;
  resetUrl?: string;
}

/* =========================================================
   RAW API RESPONSE

   Backend response dono forms support karega:

   {
     success,
     user,
     accessToken,
     refreshToken
   }

   ya:

   {
     success,
     data: {
       user,
       accessToken,
       refreshToken
     }
   }
   ========================================================= */

type RawAuthResponse = AuthResponse & {
  data?: AuthResponse;
};

/* =========================================================
   API ERROR
   ========================================================= */

type ApiErrorResponse = {
  success?: boolean;
  message?: string;

  errors?: Array<{
    field?: string;
    message?: string;
  }>;
};

/* =========================================================
   BASIC NORMALIZERS
   ========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value === "string"
    ? value.trim()
    : "";
};

const normalizeBoolean = (
  value: unknown
): boolean => {
  return value === true;
};

/* =========================================================
   ROLE NORMALIZER
   ========================================================= */

const normalizeRoleDetails = (
  rawRole: unknown
): AuthRoleDetails | null => {
  if (
    !rawRole ||
    typeof rawRole !== "object"
  ) {
    return null;
  }

  const role =
    rawRole as {
      _id?: unknown;

      name?: unknown;
      slug?: unknown;

      description?: unknown;

      permissions?: unknown;

      isSystemRole?: unknown;

      status?: unknown;
    };

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
      ) || slug,

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
                "string" &&
              Boolean(
                permission.trim()
              )
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
   AUTH USER NORMALIZER
   ========================================================= */

const normalizeAuthUser = (
  rawUser: unknown
): AuthUser | null => {
  if (
    !rawUser ||
    typeof rawUser !== "object"
  ) {
    return null;
  }

  const user =
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
    };

  const userId =
    normalizeString(
      user._id
    ) ||
    normalizeString(
      user.id
    );

  const name =
    normalizeString(
      user.name
    );

  const email =
    normalizeString(
      user.email
    ).toLowerCase();

  if (
    !userId ||
    !name ||
    !email
  ) {
    return null;
  }

  const roleDetails =
    normalizeRoleDetails(
      user.roleDetails
    );

  const role =
    normalizeString(
      user.role
    ).toLowerCase() ||
    roleDetails?.slug ||
    "user";

  const permissions =
    Array.isArray(
      user.permissions
    )
      ? user.permissions.filter(
          (
            permission
          ): permission is string =>
            typeof permission ===
              "string" &&
            Boolean(
              permission.trim()
            )
        )
      : roleDetails?.permissions || [];

  const provider =
    user.provider === "google" ||
    user.provider === "facebook" ||
    user.provider === "github"
      ? user.provider
      : "local";

  const status =
    user.status === "inactive"
      ? "inactive"
      : user.status === "blocked"
        ? "blocked"
        : "active";

  return {
    _id: userId,
    id: userId,

    name,
    email,

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

    permissions,

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

    provider,

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

    status,

    createdAt:
      normalizeString(
        user.createdAt
      ) || undefined,

    updatedAt:
      normalizeString(
        user.updatedAt
      ) || undefined,
  };
};

/* =========================================================
   AUTH RESPONSE NORMALIZER
   ========================================================= */

const normalizeAuthResponse = (
  rawResponse: RawAuthResponse
): AuthResponse => {
  const responseData =
    rawResponse.data &&
    typeof rawResponse.data ===
      "object"
      ? rawResponse.data
      : rawResponse;

  const normalizedUser =
    normalizeAuthUser(
      responseData.user
    );

  return {
    success:
      responseData.success ??
      rawResponse.success,

    message:
      responseData.message ||
      rawResponse.message,

    accessToken:
      normalizeString(
        responseData.accessToken
      ) || undefined,

    refreshToken:
      normalizeString(
        responseData.refreshToken
      ) || undefined,

    user:
      normalizedUser ||
      undefined,

    emailVerification:
      responseData.emailVerification,

    verificationToken:
      normalizeString(
        responseData.verificationToken
      ) || undefined,

    verificationUrl:
      normalizeString(
        responseData.verificationUrl
      ) || undefined,

    resetToken:
      normalizeString(
        responseData.resetToken
      ) || undefined,

    resetUrl:
      normalizeString(
        responseData.resetUrl
      ) || undefined,
  };
};

/* =========================================================
   STORAGE HELPER
   ========================================================= */

const isRememberedLogin =
  (): boolean => {
    return Boolean(
      localStorage.getItem(
        "accessToken"
      ) ||
      localStorage.getItem(
        "refreshToken"
      )
    );
  };

/* =========================================================
   SAVE AUTH USER

   Authenticated user same storage mein save hoga jahan
   tokens stored hain.
   ========================================================= */

const saveAuthUser = (
  user: AuthUser,
  rememberMe: boolean
): void => {
  localStorage.removeItem(
    "authUser"
  );

  sessionStorage.removeItem(
    "authUser"
  );

  const storage =
    rememberMe
      ? localStorage
      : sessionStorage;

  storage.setItem(
    "authUser",
    JSON.stringify(user)
  );
};

/* =========================================================
   GET STORED USER
   ========================================================= */

export const getStoredUser =
  (): AuthUser | null => {
    const storedUser =
      localStorage.getItem(
        "authUser"
      ) ||
      sessionStorage.getItem(
        "authUser"
      );

    if (!storedUser) {
      return null;
    }

    try {
      const parsedUser =
        JSON.parse(
          storedUser
        );

      const normalizedUser =
        normalizeAuthUser(
          parsedUser
        );

      if (!normalizedUser) {
        throw new Error(
          "Stored user is invalid."
        );
      }

      return normalizedUser;
    } catch {
      localStorage.removeItem(
        "authUser"
      );

      sessionStorage.removeItem(
        "authUser"
      );

      return null;
    }
  };

/* =========================================================
   ADMIN CHECK
   ========================================================= */

export const isAdminUser = (
  user: AuthUser | null
): boolean => {
  return (
    user?.role === "admin" ||
    user?.role ===
      "super_admin"
  );
};

/* =========================================================
   SYSTEM ROLE CHECK
   ========================================================= */

export const isSuperAdminUser = (
  user: AuthUser | null
): boolean => {
  return (
    user?.role ===
    "super_admin"
  );
};

/* =========================================================
   PERMISSION CHECK
   ========================================================= */

export const hasUserPermission = (
  user: AuthUser | null,
  permission: string
): boolean => {
  if (!user) {
    return false;
  }

  if (
    isAdminUser(user)
  ) {
    return true;
  }

  const normalizedPermission =
    permission.trim();

  if (!normalizedPermission) {
    return false;
  }

  const permissions =
    user.permissions ||
    user.roleDetails
      ?.permissions ||
    [];

  return (
    permissions.includes("*") ||
    permissions.includes(
      normalizedPermission
    )
  );
};

/* =========================================================
   ANY PERMISSION CHECK
   ========================================================= */

export const hasAnyUserPermission = (
  user: AuthUser | null,
  permissions: string[]
): boolean => {
  return permissions.some(
    (permission) =>
      hasUserPermission(
        user,
        permission
      )
  );
};

/* =========================================================
   ALL PERMISSIONS CHECK
   ========================================================= */

export const hasAllUserPermissions = (
  user: AuthUser | null,
  permissions: string[]
): boolean => {
  return permissions.every(
    (permission) =>
      hasUserPermission(
        user,
        permission
      )
  );
};

/* =========================================================
   LOGIN USER
   ========================================================= */

export const loginUser = async (
  payload: LoginPayload,
  rememberMe = false
): Promise<AuthResponse> => {
  const response =
    await api.post<RawAuthResponse>(
      "/auth/login",
      {
        email:
          payload.email
            .trim()
            .toLowerCase(),

        password:
          payload.password,
      }
    );

  const data =
    normalizeAuthResponse(
      response.data
    );

  if (!data.accessToken) {
    throw new Error(
      data.message ||
        "Access token was not returned by the server."
    );
  }

  if (!data.refreshToken) {
    throw new Error(
      data.message ||
        "Refresh token was not returned by the server."
    );
  }

  if (!data.user) {
    throw new Error(
      data.message ||
        "User information was not returned by the server."
    );
  }

  setAuthTokens(
    data.accessToken,
    data.refreshToken,
    rememberMe
  );

  saveAuthUser(
    data.user,
    rememberMe
  );

  return data;
};

/* =========================================================
   REGISTER USER
   ========================================================= */

export const registerUser = async (
  payload: RegisterPayload
): Promise<AuthResponse> => {
  const response =
    await api.post<RawAuthResponse>(
      "/auth/register",
      {
        name:
          payload.name
            .trim()
            .replace(/\s+/g, " "),

        email:
          payload.email
            .trim()
            .toLowerCase(),

        password:
          payload.password,
      }
    );

  const data =
    normalizeAuthResponse(
      response.data
    );

  if (
    data.accessToken &&
    data.refreshToken &&
    data.user
  ) {
    setAuthTokens(
      data.accessToken,
      data.refreshToken,
      false
    );

    saveAuthUser(
      data.user,
      false
    );
  }

  return data;
};

/* =========================================================
   GET AUTHENTICATED PROFILE
   ========================================================= */

export const getProfile =
  async (): Promise<AuthUser> => {
    const response =
      await api.get<RawAuthResponse>(
        "/auth/profile"
      );

    const data =
      normalizeAuthResponse(
        response.data
      );

    if (!data.user) {
      throw new Error(
        data.message ||
          "User profile was not returned by the server."
      );
    }

    saveAuthUser(
      data.user,
      isRememberedLogin()
    );

    return data.user;
  };

/* =========================================================
   LOGOUT
   ========================================================= */

export const logoutUser =
  async (): Promise<void> => {
    try {
      await api.post(
        "/auth/logout"
      );
    } finally {
      clearAuthStorage();
    }
  };

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

export const forgotPassword =
  async (
    payload: ForgotPasswordPayload
  ): Promise<AuthResponse> => {
    const response =
      await api.post<RawAuthResponse>(
        "/auth/forgot-password",
        {
          email:
            payload.email
              .trim()
              .toLowerCase(),
        }
      );

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   RESET PASSWORD
   ========================================================= */

export const resetPassword =
  async (
    resetToken: string,
    payload: ResetPasswordPayload
  ): Promise<AuthResponse> => {
    const response =
      await api.patch<RawAuthResponse>(
        `/auth/reset-password/${encodeURIComponent(
          resetToken.trim()
        )}`,
        payload
      );

    clearAuthStorage();

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

export const changePassword =
  async (
    payload: ChangePasswordPayload
  ): Promise<AuthResponse> => {
    const response =
      await api.patch<RawAuthResponse>(
        "/auth/change-password",
        payload
      );

    clearAuthStorage();

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   VERIFY EMAIL
   ========================================================= */

export const verifyEmail =
  async (
    verificationToken: string
  ): Promise<AuthResponse> => {
    const response =
      await api.get<RawAuthResponse>(
        `/auth/verify-email/${encodeURIComponent(
          verificationToken.trim()
        )}`
      );

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   RESEND VERIFICATION EMAIL
   ========================================================= */

export const resendVerificationEmail =
  async (
    email: string
  ): Promise<AuthResponse> => {
    const response =
      await api.post<RawAuthResponse>(
        "/auth/resend-verification-email",
        {
          email:
            email
              .trim()
              .toLowerCase(),
        }
      );

    return normalizeAuthResponse(
      response.data
    );
  };

/* =========================================================
   ERROR MESSAGE
   ========================================================= */

export const getAuthErrorMessage = (
  error: unknown
): string => {
  if (
    axios.isAxiosError<ApiErrorResponse>(
      error
    )
  ) {
    const responseData =
      error.response?.data;

    if (
      responseData?.message
    ) {
      return responseData.message;
    }

    const firstValidationError =
      responseData
        ?.errors?.[0]?.message;

    if (
      firstValidationError
    ) {
      return firstValidationError;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "An unexpected authentication error occurred.";
};