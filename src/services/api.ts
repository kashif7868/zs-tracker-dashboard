import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "http://localhost:5000/api/v1";

const API_TIMEOUT =
  60_000;

/* =========================================================
   TYPES
   ========================================================= */

type RetryRequestConfig =
  InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

type RefreshTokenData = {
  accessToken: string;
  refreshToken: string;
};

type RefreshTokenResponse = {
  success?: boolean;
  message?: string;

  data?: {
    accessToken?: string;
    refreshToken?: string;
  };

  accessToken?: string;
  refreshToken?: string;
};

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const ACCESS_TOKEN_KEY =
  "accessToken";

const REFRESH_TOKEN_KEY =
  "refreshToken";

const AUTH_USER_KEY =
  "authUser";

/* =========================================================
   TOKEN STORAGE
   ========================================================= */

export const getAccessToken =
  (): string | null => {
    return (
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) ||
      sessionStorage.getItem(
        ACCESS_TOKEN_KEY
      )
    );
  };

export const getRefreshToken =
  (): string | null => {
    return (
      localStorage.getItem(
        REFRESH_TOKEN_KEY
      ) ||
      sessionStorage.getItem(
        REFRESH_TOKEN_KEY
      )
    );
  };

/* =========================================================
   REMEMBERED LOGIN
   ========================================================= */

const isRememberedLogin =
  (): boolean => {
    return Boolean(
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) ||
        localStorage.getItem(
          REFRESH_TOKEN_KEY
        )
    );
  };

/* =========================================================
   SET AUTH TOKENS

   rememberMe = true
   => localStorage

   rememberMe = false
   => sessionStorage
   ========================================================= */

export const setAuthTokens = (
  accessToken: string,
  refreshToken: string,
  rememberMe = false
): void => {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  sessionStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  sessionStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  const storage =
    rememberMe
      ? localStorage
      : sessionStorage;

  storage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken
  );

  storage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken
  );
};

/* =========================================================
   CLEAR AUTH STORAGE
   ========================================================= */

export const clearAuthStorage =
  (): void => {
    localStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
      REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
      AUTH_USER_KEY
    );

    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    sessionStorage.removeItem(
      REFRESH_TOKEN_KEY
    );

    sessionStorage.removeItem(
      AUTH_USER_KEY
    );
  };

/* =========================================================
   REDIRECT TO SIGN IN
   ========================================================= */

const redirectToSignIn =
  (): void => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const currentPath =
      window.location.pathname;

    if (
      currentPath ===
        "/signin" ||
      currentPath ===
        "/signup"
    ) {
      return;
    }

    window.location.replace(
      "/signin"
    );
  };

/* =========================================================
   AUTH ENDPOINT CHECK

   Login/Register requests ko refresh-token interceptor se
   retry nahi karna chahiye.
   ========================================================= */

const isAuthenticationRequest = (
  requestUrl: string
): boolean => {
  return (
    requestUrl.includes(
      "/auth/login"
    ) ||
    requestUrl.includes(
      "/auth/register"
    ) ||
    requestUrl.includes(
      "/auth/refresh-token"
    )
  );
};

/* =========================================================
   AXIOS INSTANCE

   Content-Type manually globally set nahi kiya gaya.

   JSON:
   Axios application/json set karega.

   FormData:
   Browser multipart/form-data boundary set karega.
   ========================================================= */

const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    timeout:
      API_TIMEOUT,

    headers: {
      Accept:
        "application/json",
    },
  });

/* =========================================================
   REQUEST INTERCEPTOR
   ========================================================= */

api.interceptors.request.use(
  (
    config:
      InternalAxiosRequestConfig
  ) => {
    const accessToken =
      getAccessToken();

    if (
      accessToken
    ) {
      if (
        !config.headers
      ) {
        config.headers =
          new AxiosHeaders();
      }

      config.headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }

    /* =====================================================
       FORM DATA

       Evidence/avatar upload ke waqt Content-Type remove
       karte hain taa ke browser correct boundary add kare.
       ===================================================== */

    if (
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData
    ) {
      config.headers.delete(
        "Content-Type"
      );
    }

    return config;
  },

  (
    error: AxiosError
  ) => {
    return Promise.reject(
      error
    );
  }
);

/* =========================================================
   REFRESH REQUEST LOCK

   Multiple API requests ko same waqt 401 mile to sirf aik
   refresh request backend par jayegi.
   ========================================================= */

let refreshRequest:
  | Promise<RefreshTokenData>
  | null = null;

/* =========================================================
   REQUEST NEW TOKENS
   ========================================================= */

const requestNewTokens =
  async (): Promise<RefreshTokenData> => {
    const refreshToken =
      getRefreshToken();

    if (
      !refreshToken
    ) {
      throw new Error(
        "Refresh token is missing."
      );
    }

    /*
      Raw axios use karna intentional hai.

      Agar `api` instance use karein to refresh request khud
      response interceptor mein dobara enter kar sakti hai.
    */

    const response =
      await axios.post<RefreshTokenResponse>(
        `${API_BASE_URL}/auth/refresh-token`,

        {
          refreshToken,
        },

        {
          timeout:
            API_TIMEOUT,

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",
          },
        }
      );

    const responseBody =
      response.data;

    const tokenData =
      responseBody?.data ??
      responseBody;

    const newAccessToken =
      tokenData?.accessToken;

    const newRefreshToken =
      tokenData?.refreshToken ||
      refreshToken;

    if (
      typeof newAccessToken !==
        "string" ||
      !newAccessToken.trim()
    ) {
      throw new Error(
        "Access token was not returned by the server."
      );
    }

    if (
      typeof newRefreshToken !==
        "string" ||
      !newRefreshToken.trim()
    ) {
      throw new Error(
        "Refresh token was not returned by the server."
      );
    }

    return {
      accessToken:
        newAccessToken.trim(),

      refreshToken:
        newRefreshToken.trim(),
    };
  };

/* =========================================================
   RESPONSE INTERCEPTOR
   ========================================================= */

api.interceptors.response.use(
  (
    response
  ) => response,

  async (
    error: AxiosError
  ) => {
    const originalRequest =
      error.config as
        | RetryRequestConfig
        | undefined;

    if (
      !originalRequest
    ) {
      return Promise.reject(
        error
      );
    }

    const requestUrl =
      originalRequest.url ??
      "";

    /* =====================================================
       REFRESH CONDITIONS
       ===================================================== */

    const shouldRefreshToken =
      error.response?.status ===
        401 &&
      !originalRequest._retry &&
      !isAuthenticationRequest(
        requestUrl
      );

    if (
      !shouldRefreshToken
    ) {
      return Promise.reject(
        error
      );
    }

    /* =====================================================
       NO REFRESH TOKEN
       ===================================================== */

    if (
      !getRefreshToken()
    ) {
      clearAuthStorage();

      redirectToSignIn();

      return Promise.reject(
        error
      );
    }

    originalRequest._retry =
      true;

    /* =====================================================
       REFRESH SESSION
       ===================================================== */

    try {
      if (
        !refreshRequest
      ) {
        refreshRequest =
          requestNewTokens().finally(
            () => {
              refreshRequest =
                null;
            }
          );
      }

      const {
        accessToken,
        refreshToken,
      } =
        await refreshRequest;

      const rememberMe =
        isRememberedLogin();

      setAuthTokens(
        accessToken,
        refreshToken,
        rememberMe
      );

      if (
        !originalRequest.headers
      ) {
        originalRequest.headers =
          new AxiosHeaders();
      }

      originalRequest.headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );

      /*
        Original failed request ko new Access Token ke saath
        exactly aik martaba retry karein.
      */

      return api(
        originalRequest
      );
    } catch (
      refreshError
    ) {
      /*
        Refresh token expire/invalid ho to complete session
        clear hogi aur user Sign In par jayega.
      */

      clearAuthStorage();

      redirectToSignIn();

      return Promise.reject(
        refreshError
      );
    }
  }
);

/* =========================================================
   EXPORT
   ========================================================= */

export default api;