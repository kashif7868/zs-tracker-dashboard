import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../../context/AuthContext";

import api from "../../services/api";

import {
  useModal,
} from "../../hooks/useModal";

import {
  Modal,
} from "../ui/modal";

import Input from "../form/input/InputField";
import Label from "../form/Label";

/* =========================================================
   HELPERS
   ========================================================= */

const getRoleLabel = (
  role?: string
): string => {
  if (
    !role ||
    typeof role !== "string"
  ) {
    return "User";
  }

  const words =
    role
      .trim()
      .toLowerCase()
      .split("_")
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return "User";
  }

  return words
    .map((word: string) => {
      return (
        word
          .charAt(0)
          .toUpperCase() +
        word
          .slice(1)
          .toLowerCase()
      );
    })
    .join(" ");
};

const getStatusLabel = (
  status?: string
): string => {
  if (!status) {
    return "Active";
  }

  return (
    status
      .charAt(0)
      .toUpperCase() +
    status
      .slice(1)
      .toLowerCase()
  );
};

const getErrorMessage = (
  error: unknown
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const requestError =
      error as {
        response?: {
          data?: {
            message?: string;
            error?: string;

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
      requestError.response
        ?.data?.error ||
      "Profile could not be updated."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Profile could not be updated.";
};

/* =========================================================
   ICONS
   ========================================================= */

const EditIcon = () => (
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
    <path d="M12 20H5C4.4 20 4 19.6 4 19V12" />

    <path d="M14.5 5.5L18.5 9.5" />

    <path d="M7 17L8 13L16.5 4.5C17.3 3.7 18.7 3.7 19.5 4.5C20.3 5.3 20.3 6.7 19.5 7.5L11 16L7 17Z" />
  </svg>
);

const InfoIcon = () => (
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
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M12 11V16" />

    <path d="M12 8H12.01" />
  </svg>
);

/* =========================================================
   USER INFO CARD
   ========================================================= */

export default function UserInfoCard() {
  const {
    user,
    refreshUser,
  } = useAuth();

  const {
    isOpen,
    openModal,
    closeModal,
  } = useModal();

  const [
    name,
    setName,
  ] = useState("");

  const [
    countryCode,
    setCountryCode,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     DISPLAY VALUES
     ======================================================= */

  const displayName =
    user?.name?.trim() ||
    "—";

  const displayEmail =
    user?.email?.trim() ||
    "—";

  const displayCountryCode =
    user?.countryCode?.trim() ||
    "—";

  const displayPhone =
    user?.phone?.trim() ||
    "—";

  const roleLabel =
    user?.roleDetails
      ?.name
      ?.trim() ||
    getRoleLabel(
      user?.role
    );

  const statusLabel =
    getStatusLabel(
      user?.status
    );

  /* =======================================================
     SYNC FORM WITH USER
     ======================================================= */

  useEffect(() => {
    setName(
      user?.name ||
      ""
    );

    setCountryCode(
      user?.countryCode ||
      ""
    );

    setPhone(
      user?.phone ||
      ""
    );
  }, [
    user,
  ]);

  /* =======================================================
     OPEN EDIT MODAL
     ======================================================= */

  const handleOpenModal = () => {
    setName(
      user?.name ||
      ""
    );

    setCountryCode(
      user?.countryCode ||
      ""
    );

    setPhone(
      user?.phone ||
      ""
    );

    setError("");

    openModal();
  };

  /* =======================================================
     CLOSE MODAL
     ======================================================= */

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setError("");

    closeModal();
  };

  /* =======================================================
     SAVE PROFILE
     ======================================================= */

  const handleSave =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (saving) {
        return;
      }

      const normalizedName =
        name
          .trim()
          .replace(/\s+/g, " ");

      const normalizedCountryCode =
        countryCode.trim();

      const normalizedPhone =
        phone.trim();

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

      if (
        normalizedCountryCode &&
        !/^\+\d{1,4}$/.test(
          normalizedCountryCode
        )
      ) {
        setError(
          "Country code must be in format +92."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        await api.patch(
          "/auth/profile",
          {
            name:
              normalizedName,

            countryCode:
              normalizedCountryCode,

            phone:
              normalizedPhone,
          }
        );

        await refreshUser();

        window.dispatchEvent(
          new CustomEvent(
            "profile:updated"
          )
        );

        closeModal();
      } catch (
        requestError
      ) {
        setError(
          getErrorMessage(
            requestError
          )
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          PERSONAL INFORMATION CARD
          =================================================== */}

      <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-5 lg:p-6">
          {/* =================================================
              CARD HEADER
              ================================================= */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Account Details
              </p>

              <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                Personal Information
              </h4>

              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Your basic account and contact information.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleOpenModal
              }
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-900 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 sm:w-auto"
            >
              <EditIcon />

              Edit Information
            </button>
          </div>

          {/* =================================================
              INFORMATION GRID
              ================================================= */}

          <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20 sm:grid-cols-2 lg:grid-cols-3">
            {/* NAME */}

            <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 sm:border-r lg:border-b">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Name
              </p>

              <p className="mt-2 break-words text-sm font-semibold text-gray-800 dark:text-white/90">
                {displayName}
              </p>
            </div>

            {/* EMAIL */}

            <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 lg:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Email Address
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-gray-800 dark:text-white/90">
                {displayEmail}
              </p>
            </div>

            {/* PHONE */}

            <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 sm:border-r lg:border-r-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Phone
              </p>

              <p className="mt-2 break-words text-sm font-semibold text-gray-800 dark:text-white/90">
                {displayPhone}
              </p>
            </div>

            {/* COUNTRY CODE */}

            <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 lg:border-b-0 lg:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Country Code
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                {displayCountryCode}
              </p>
            </div>

            {/* ROLE */}

            <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 sm:border-b-0 sm:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Role
              </p>

              <span className="mt-2 inline-flex max-w-full rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="truncate">
                  {roleLabel}
                </span>
              </span>
            </div>

            {/* STATUS */}

            <div className="min-w-0 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Account Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  user?.status ===
                  "blocked"
                    ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                    : user?.status ===
                        "inactive"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          EDIT PERSONAL INFORMATION MODAL
          =================================================== */}

      <Modal
        isOpen={
          isOpen
        }
        onClose={
          handleCloseModal
        }
        className="m-4 max-w-[650px]"
      >
        <div className="relative w-full max-w-[650px] rounded-3xl bg-white p-5 dark:bg-gray-900 sm:p-7">
          {/* =================================================
              MODAL HEADER
              ================================================= */}

          <div className="pr-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              Project Tracker
            </p>

            <h4 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              Edit Personal Information
            </h4>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Update your name and contact information.
            </p>
          </div>

          {/* =================================================
              ERROR
              ================================================= */}

          {error ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500" />

              <p className="text-sm font-medium leading-5 text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : null}

          {/* =================================================
              FORM
              ================================================= */}

          <form
            onSubmit={
              handleSave
            }
            className="mt-6"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* NAME */}

              <div className="sm:col-span-2">
                <Label>
                  Name{" "}

                  <span className="text-error-500">
                    *
                  </span>
                </Label>

                <Input
                  type="text"
                  value={
                    name
                  }
                  placeholder="Enter your name"
                  onChange={(event) => {
                    setName(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                />
              </div>

              {/* EMAIL */}

              <div className="sm:col-span-2">
                <Label>
                  Email Address
                </Label>

                <Input
                  type="email"
                  value={
                    user?.email ||
                    ""
                  }
                  disabled
                />

                <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Email address cannot be changed from this profile form.
                </p>
              </div>

              {/* COUNTRY CODE */}

              <div>
                <Label>
                  Country Code
                </Label>

                <Input
                  type="text"
                  value={
                    countryCode
                  }
                  placeholder="+92"
                  onChange={(event) => {
                    setCountryCode(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                />

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Example: +92
                </p>
              </div>

              {/* PHONE */}

              <div>
                <Label>
                  Phone
                </Label>

                <Input
                  type="tel"
                  value={
                    phone
                  }
                  placeholder="3001234567"
                  onChange={(event) => {
                    setPhone(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                />
              </div>

              {/* ROLE */}

              <div>
                <Label>
                  Role
                </Label>

                <Input
                  type="text"
                  value={
                    roleLabel
                  }
                  disabled
                />
              </div>

              {/* STATUS */}

              <div>
                <Label>
                  Account Status
                </Label>

                <Input
                  type="text"
                  value={
                    statusLabel
                  }
                  disabled
                />
              </div>
            </div>

            {/* =================================================
                READ ONLY INFO
                ================================================= */}

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40">
              <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">
                <InfoIcon />
              </span>

              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                Email address, role and account status are controlled separately
                and cannot be changed from this profile form.
              </p>
            </div>

            {/* =================================================
                ACTIONS
                ================================================= */}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  handleCloseModal
                }
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}