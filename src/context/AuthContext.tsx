import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getProfile,
  getStoredUser,
  isAdminUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "../services/auth.service";

import {
  clearAuthStorage,
  getAccessToken,
} from "../services/api";

/* =========================================================
   AUTH CONTEXT TYPE
   ========================================================= */

interface AuthContextValue {
  user: AuthUser | null;

  isLoading: boolean;

  isAuthenticated: boolean;

  isAdmin: boolean;

  login: (
    payload: LoginPayload,
    rememberMe?: boolean
  ) => Promise<AuthResponse>;

  register: (
    payload: RegisterPayload
  ) => Promise<AuthResponse>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<AuthUser | null>;

  setUser: (
    user: AuthUser | null
  ) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

/* =========================================================
   CONTEXT
   ========================================================= */

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

/* =========================================================
   AUTH PROVIDER
   ========================================================= */

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      () => getStoredUser()
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  /* =======================================================
     REFRESH AUTHENTICATED USER
     ======================================================= */

  const refreshUser =
    useCallback(
      async (): Promise<AuthUser | null> => {
        const accessToken =
          getAccessToken();

        if (!accessToken) {
          clearAuthStorage();

          setUser(null);

          return null;
        }

        try {
          const profile =
            await getProfile();

          setUser(profile);

          return profile;
        } catch (error) {
          console.error(
            "Unable to refresh authenticated user:",
            error
          );

          clearAuthStorage();

          setUser(null);

          return null;
        }
      },
      []
    );

  /* =======================================================
     INITIALIZE SAVED SESSION

     Application start par:

     1. Access token check hoga.
     2. Token na ho to stale stored user clear hoga.
     3. Token ho to backend /profile request hogi.
     4. Valid session par latest user load hoga.
     5. Invalid session automatically clear hogi.
     ======================================================= */

  useEffect(() => {
    let active = true;

    const initializeAuth =
      async () => {
        try {
          const accessToken =
            getAccessToken();

          if (!accessToken) {
            clearAuthStorage();

            if (active) {
              setUser(null);
            }

            return;
          }

          const profile =
            await getProfile();

          if (!active) {
            return;
          }

          setUser(profile);
        } catch (error) {
          if (!active) {
            return;
          }

          console.error(
            "Authentication initialization failed:",
            error
          );

          clearAuthStorage();

          setUser(null);
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      };

    void initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  /* =======================================================
     PROFILE UPDATE EVENT

     Profile components update ke baad:

     window.dispatchEvent(
       new CustomEvent("profile:updated")
     );

     AuthContext latest backend profile reload karega.
     ======================================================= */

  useEffect(() => {
    const handleProfileUpdated =
      () => {
        void refreshUser();
      };

    window.addEventListener(
      "profile:updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "profile:updated",
        handleProfileUpdated
      );
    };
  }, [refreshUser]);

  /* =======================================================
     LOGIN
     ======================================================= */

  const login =
    useCallback(
      async (
        payload: LoginPayload,
        rememberMe = false
      ): Promise<AuthResponse> => {
        const response =
          await loginUser(
            payload,
            rememberMe
          );

        /*
          Successful login ke baad auth service tokens ko
          storage mein save karegi.

          Response mein user available ho to immediately
          context state update hogi.
        */

        if (response.user) {
          setUser(
            response.user
          );
        } else {
          /*
            Defensive fallback:

            Token save ho gaya ho lekin backend login response
            mein complete user object na mila ho to profile
            endpoint se authenticated user reload karenge.
          */

          const accessToken =
            getAccessToken();

          if (accessToken) {
            try {
              const profile =
                await getProfile();

              setUser(profile);
            } catch (error) {
              console.error(
                "Unable to load user after login:",
                error
              );

              clearAuthStorage();

              setUser(null);

              throw error;
            }
          }
        }

        return response;
      },
      []
    );

  /* =======================================================
     REGISTER

     Backend do tarah ka response de sakta hai:

     1. User + tokens
        => immediately authenticated.

     2. User created without tokens
        => account create hoga lekin user Sign In karega.
     ======================================================= */

  const register =
    useCallback(
      async (
        payload: RegisterPayload
      ): Promise<AuthResponse> => {
        const response =
          await registerUser(
            payload
          );

        const hasAuthenticatedSession =
          Boolean(
            response.accessToken
          ) &&
          Boolean(
            getAccessToken()
          );

        if (
          hasAuthenticatedSession &&
          response.user
        ) {
          setUser(
            response.user
          );
        } else if (
          hasAuthenticatedSession
        ) {
          try {
            const profile =
              await getProfile();

            setUser(profile);
          } catch (error) {
            console.error(
              "Unable to load user after registration:",
              error
            );

            clearAuthStorage();

            setUser(null);

            throw error;
          }
        }

        return response;
      },
      []
    );

  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout =
    useCallback(
      async (): Promise<void> => {
        try {
          await logoutUser();
        } catch (error) {
          /*
            Backend logout request fail hone ke bawajood local
            authentication state clear honi chahiye.
          */

          console.error(
            "Logout request failed:",
            error
          );
        } finally {
          clearAuthStorage();

          setUser(null);
        }
      },
      []
    );

  /* =======================================================
     AUTHENTICATION STATE
     ======================================================= */

  const isAuthenticated =
    Boolean(user) &&
    Boolean(
      getAccessToken()
    );

  /* =======================================================
     CONTEXT VALUE
     ======================================================= */

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,

        isLoading,

        isAuthenticated,

        isAdmin:
          isAdminUser(
            user
          ),

        login,

        register,

        logout,

        refreshUser,

        setUser,
      }),
      [
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   AUTH HOOK
   ========================================================= */

export function useAuth(): AuthContextValue {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;