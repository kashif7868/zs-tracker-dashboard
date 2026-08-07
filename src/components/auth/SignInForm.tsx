import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import {
  ChevronLeftIcon,
  EyeCloseIcon,
  EyeIcon,
} from "../../icons";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getAuthErrorMessage,
} from "../../services/auth.service";

import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";

/* =========================================================
   LOCATION STATE
   ========================================================= */

type SignInLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

/* =========================================================
   ICONS
   ========================================================= */

const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-5"
    aria-hidden="true"
  >
    <path d="M12 3L20 6V11C20 16 16.5 19.6 12 21C7.5 19.6 4 16 4 11V6L12 3Z" />
    <path d="M8.5 12L10.8 14.3L15.8 9.3" />
  </svg>
);

/* =========================================================
   SIGN IN FORM
   ========================================================= */

export default function SignInForm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    login,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     REDIRECT AUTHENTICATED USER
     ======================================================= */

  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated
    ) {
      navigate(
        "/",
        {
          replace: true,
        }
      );
    }
  }, [
    authLoading,
    isAuthenticated,
    navigate,
  ]);

  /* =======================================================
     LOGIN
     ======================================================= */

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        submitting ||
        authLoading
      ) {
        return;
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (!normalizedEmail) {
        setError(
          "Email address is required."
        );

        return;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          normalizedEmail
        )
      ) {
        setError(
          "Please enter a valid email address."
        );

        return;
      }

      if (!password) {
        setError(
          "Password is required."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setError("");

        await login(
          {
            email:
              normalizedEmail,

            password,
          },
          rememberMe
        );

        const state =
          location.state as
            | SignInLocationState
            | null;

        const fromPath =
          state?.from
            ?.pathname;

        const fromSearch =
          state?.from
            ?.search ||
          "";

        const redirectPath =
          fromPath &&
          fromPath !==
            "/signin"
            ? `${fromPath}${fromSearch}`
            : "/";

        navigate(
          redirectPath,
          {
            replace: true,
          }
        );
      } catch (
        requestError
      ) {
        setError(
          getAuthErrorMessage(
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
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-8 sm:px-8 lg:px-10 xl:px-16">
      {/* ===================================================
          TOP
          =================================================== */}

      <div className="mx-auto w-full max-w-[480px] pt-6 sm:pt-8 lg:pt-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
        >
          <ChevronLeftIcon className="size-5" />

          Back to dashboard
        </Link>
      </div>

      {/* ===================================================
          FORM AREA
          =================================================== */}

      <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
        <div className="w-full max-w-[480px]">
          {/* =================================================
              HEADER
              ================================================= */}

          <div className="mb-7">
            <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldIcon />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Project Tracker
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[34px]">
              Welcome back
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
              Sign in to manage projects, Risk Register records, Evidence and
              rectification progress.
            </p>
          </div>

          {/* =================================================
              ERROR
              ================================================= */}

          {error ? (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-900/60 dark:bg-red-950/30">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500" />

              <p className="min-w-0 text-sm font-medium leading-5 text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : null}

          {/* =================================================
              SIGN IN FORM
              ================================================= */}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >
            {/* EMAIL */}

            <div>
              <Label>
                Email Address{" "}
                <span className="text-error-500">
                  *
                </span>
              </Label>

              <Input
                type="email"
                value={
                  email
                }
                placeholder="name@example.com"
                onChange={(
                  event
                ) => {
                  setEmail(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
              />
            </div>

            {/* PASSWORD */}

            <div>
              <Label>
                Password{" "}
                <span className="text-error-500">
                  *
                </span>
              </Label>

              <div className="relative">
                <Input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    password
                  }
                  placeholder="Enter your password"
                  onChange={(
                    event
                  ) => {
                    setPassword(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(
                      (
                        current
                      ) =>
                        !current
                    );
                  }}
                  className="absolute right-4 top-1/2 z-30 -translate-y-1/2 text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeIcon className="size-5 fill-current" />
                  ) : (
                    <EyeCloseIcon className="size-5 fill-current" />
                  )}
                </button>
              </div>
            </div>

            {/* =================================================
                SESSION OPTIONS
                ================================================= */}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  checked={
                    rememberMe
                  }
                  onChange={
                    setRememberMe
                  }
                />

                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Keep me logged in
                </span>
              </label>

              <span
                className="cursor-default text-sm font-medium text-gray-400 dark:text-gray-500"
                title="Password recovery is not currently available from this page."
              >
                Forgot password?
              </span>
            </div>

            {/* =================================================
                SUBMIT BUTTON
                ================================================= */}

            <button
              type="submit"
              disabled={
                submitting ||
                authLoading
              }
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Signing in..."
                : authLoading
                  ? "Checking session..."
                  : "Sign In"}
            </button>
          </form>

          {/* =================================================
              SECURITY INFO
              ================================================= */}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-950/40">
            <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">
              <ShieldIcon />
            </span>

            <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">
              Access to Project Tracker features is controlled by your assigned
              role and permissions.
            </p>
          </div>

          {/* =================================================
              SIGN UP
              ================================================= */}

          <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 sm:text-left">
              Don&apos;t have an account?{" "}

              <Link
                to="/signup"
                className="font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}