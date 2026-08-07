import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Link,
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

/* =========================================================
   ICON
   ========================================================= */

const AccountIcon = () => (
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
    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" />

    <path d="M4 21C4 17.6863 7.58172 15 12 15C16.4183 15 20 17.6863 20 21" />
  </svg>
);

/* =========================================================
   SIGN UP FORM
   ========================================================= */

export default function SignUpForm() {
  const navigate =
    useNavigate();

  const {
    register,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [
    name,
    setName,
  ] = useState("");

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
     CLEAR ERROR
     ======================================================= */

  const clearError = () => {
    if (error) {
      setError("");
    }
  };

  /* =======================================================
     REGISTER
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

      const normalizedName =
        name
          .trim()
          .replace(/\s+/g, " ");

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      /* ===================================================
         FRONTEND VALIDATION
         =================================================== */

      if (!normalizedName) {
        setError(
          "Name is required."
        );

        return;
      }

      if (
        normalizedName.length <
        2
      ) {
        setError(
          "Name must contain at least 2 characters."
        );

        return;
      }

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

        /* =================================================
           BACKEND PAYLOAD

           {
             name,
             email,
             password
           }
           ================================================= */

        const response =
          await register({
            name:
              normalizedName,

            email:
              normalizedEmail,

            password,
          });

        /* =================================================
           AUTHENTICATED REGISTRATION
           ================================================= */

        if (
          response.accessToken &&
          response.refreshToken &&
          response.user
        ) {
          navigate(
            "/",
            {
              replace: true,
            }
          );

          return;
        }

        /* =================================================
           ACCOUNT CREATED - LOGIN REQUIRED
           ================================================= */

        navigate(
          "/signin",
          {
            replace: true,

            state: {
              registrationCompleted:
                true,

              email:
                normalizedEmail,
            },
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
          TOP NAVIGATION
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
              <AccountIcon />
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Project Tracker
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[34px]">
              Create account
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
              Create your Project Tracker account to access projects,
              Risk Register records and Evidence.
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
              REGISTRATION FORM
              ================================================= */}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-5"
          >
            {/* =================================================
                NAME
                ================================================= */}

            <div>
              <Label>
                Name{" "}

                <span className="text-error-500">
                  *
                </span>
              </Label>

              <Input
                type="text"
                placeholder="Enter your full name"
                value={
                  name
                }
                onChange={(
                  event
                ) => {
                  setName(
                    event.target.value
                  );

                  clearError();
                }}
              />
            </div>

            {/* =================================================
                EMAIL
                ================================================= */}

            <div>
              <Label>
                Email Address{" "}

                <span className="text-error-500">
                  *
                </span>
              </Label>

              <Input
                type="email"
                placeholder="name@example.com"
                value={
                  email
                }
                onChange={(
                  event
                ) => {
                  setEmail(
                    event.target.value
                  );

                  clearError();
                }}
              />
            </div>

            {/* =================================================
                PASSWORD
                ================================================= */}

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
                  placeholder="Enter your password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) => {
                    setPassword(
                      event.target.value
                    );

                    clearError();
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

              <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Password must meet the security requirements configured on the
                server.
              </p>
            </div>

            {/* =================================================
                SUBMIT
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
                ? "Creating account..."
                : authLoading
                  ? "Checking session..."
                  : "Create Account"}
            </button>
          </form>

          {/* =================================================
              ACCOUNT INFO
              ================================================= */}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-950/40">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500" />

            <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">
              New accounts may require an administrator to assign the
              appropriate role and permissions before protected modules become
              available.
            </p>
          </div>

          {/* =================================================
              SIGN IN
              ================================================= */}

          <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 sm:text-left">
              Already have an account?{" "}

              <Link
                to="/signin"
                className="font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}