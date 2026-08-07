import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";

/* =========================================================
   CONSTANTS
   ========================================================= */

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

/* =========================================================
   HELPERS
   ========================================================= */

const getAvatarUrl = (
  avatar?: string
): string => {
  if (
    !avatar ||
    typeof avatar !== "string"
  ) {
    return "";
  }

  const normalizedAvatar =
    avatar.trim();

  if (!normalizedAvatar) {
    return "";
  }

  if (
    normalizedAvatar.startsWith(
      "http://"
    ) ||
    normalizedAvatar.startsWith(
      "https://"
    ) ||
    normalizedAvatar.startsWith(
      "data:"
    ) ||
    normalizedAvatar.startsWith(
      "blob:"
    )
  ) {
    return normalizedAvatar;
  }

  const apiBaseUrl =
    import.meta.env
      .VITE_API_BASE_URL
      ?.trim() ||
    "http://localhost:5000/api/v1";

  const serverBaseUrl =
    apiBaseUrl.replace(
      /\/api\/v1\/?$/i,
      ""
    );

  const avatarPath =
    normalizedAvatar.startsWith(
      "/"
    )
      ? normalizedAvatar
      : `/${normalizedAvatar}`;

  return `${serverBaseUrl}${avatarPath}`;
};

const getInitials = (
  name?: string
): string => {
  if (
    !name ||
    typeof name !== "string"
  ) {
    return "U";
  }

  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
};

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

  if (words.length === 0) {
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
          };
        };
      };

    return (
      requestError.response
        ?.data?.message ||
      requestError.response
        ?.data?.error ||
      "Profile picture could not be updated."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Profile picture could not be updated.";
};

/* =========================================================
   ICON
   ========================================================= */

const CameraIcon = () => (
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
    <path d="M4 8C4 6.9 4.9 6 6 6H8L9.5 4H14.5L16 6H18C19.1 6 20 6.9 20 8V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V8Z" />

    <circle
      cx="12"
      cy="13"
      r="3.5"
    />
  </svg>
);

/* =========================================================
   USER META CARD
   ========================================================= */

export default function UserMetaCard() {
  const {
    user,
    refreshUser,
  } = useAuth();

  const {
    isOpen,
    openModal,
    closeModal,
  } = useModal();

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );

  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  const [
    avatarFailed,
    setAvatarFailed,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    removing,
    setRemoving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /* =======================================================
     USER VALUES
     ======================================================= */

  const userId =
    user?._id ||
    user?.id ||
    "";

  const displayName =
    user?.name?.trim() ||
    "User";

  const displayEmail =
    user?.email?.trim() ||
    "Email unavailable";

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

  const initials =
    useMemo(
      () =>
        getInitials(
          displayName
        ),
      [
        displayName,
      ]
    );

  const currentAvatarUrl =
    useMemo(
      () =>
        getAvatarUrl(
          user?.avatar
        ),
      [
        user?.avatar,
      ]
    );

  const displayedAvatarUrl =
    previewUrl ||
    currentAvatarUrl;

  const showAvatar =
    Boolean(
      displayedAvatarUrl
    ) &&
    !avatarFailed;

  /* =======================================================
     RESET AVATAR ERROR
     ======================================================= */

  useEffect(() => {
    setAvatarFailed(false);
  }, [
    displayedAvatarUrl,
  ]);

  /* =======================================================
     PREVIEW CLEANUP
     ======================================================= */

  useEffect(() => {
    return () => {
      if (
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [
    previewUrl,
  ]);

  /* =======================================================
     OPEN MODAL
     ======================================================= */

  const handleOpenModal = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccessMessage("");

    openModal();
  };

  /* =======================================================
     CLOSE MODAL
     ======================================================= */

  const handleCloseModal = () => {
    if (
      saving ||
      removing
    ) {
      return;
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }

    closeModal();
  };

  /* =======================================================
     SELECT AVATAR
     ======================================================= */

  const handleFileChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target
        .files?.[0];

    setError("");
    setSuccessMessage("");

    if (!file) {
      return;
    }

    if (
      !ALLOWED_AVATAR_TYPES.has(
        file.type
      )
    ) {
      setError(
        "Profile picture must be JPG, JPEG, PNG or WEBP."
      );

      event.target.value =
        "";

      return;
    }

    if (
      file.size >
      MAX_AVATAR_SIZE
    ) {
      setError(
        "Profile picture must be 5 MB or smaller."
      );

      event.target.value =
        "";

      return;
    }

    if (
      previewUrl.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    const nextPreviewUrl =
      URL.createObjectURL(
        file
      );

    setSelectedFile(file);
    setPreviewUrl(
      nextPreviewUrl
    );
    setAvatarFailed(false);
  };

  /* =======================================================
     UPLOAD AVATAR
     ======================================================= */

  const handleSaveAvatar =
    async () => {
      if (!userId) {
        setError(
          "Authenticated user could not be identified."
        );

        return;
      }

      if (!selectedFile) {
        setError(
          "Select a profile picture first."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccessMessage("");

        const formData =
          new FormData();

        formData.append(
          "avatar",
          selectedFile
        );

        await api.patch(
          `/users/${encodeURIComponent(
            userId
          )}/avatar`,
          formData
        );

        await refreshUser();

        window.dispatchEvent(
          new CustomEvent(
            "profile:updated"
          )
        );

        setSuccessMessage(
          "Profile picture updated successfully."
        );

        setSelectedFile(null);
        setPreviewUrl("");

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

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
     REMOVE AVATAR
     ======================================================= */

  const handleRemoveAvatar =
    async () => {
      if (!userId) {
        setError(
          "Authenticated user could not be identified."
        );

        return;
      }

      if (!user?.avatar) {
        return;
      }

      const confirmed =
        window.confirm(
          "Remove your current profile picture?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setRemoving(true);
        setError("");
        setSuccessMessage("");

        await api.delete(
          `/users/${encodeURIComponent(
            userId
          )}/avatar`
        );

        setSelectedFile(null);
        setPreviewUrl("");

        await refreshUser();

        window.dispatchEvent(
          new CustomEvent(
            "profile:updated"
          )
        );

        setSuccessMessage(
          "Profile picture removed successfully."
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

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
        setRemoving(false);
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          PROFILE META CARD
          =================================================== */}

      <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

        <div className="p-5 pt-6 lg:p-6 lg:pt-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:flex-row">
              {/* AVATAR */}

              <div className="relative shrink-0">
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  {currentAvatarUrl &&
                  !avatarFailed ? (
                    <img
                      src={
                        currentAvatarUrl
                      }
                      alt={
                        displayName
                      }
                      className="h-full w-full object-cover"
                      onError={() => {
                        setAvatarFailed(
                          true
                        );
                      }}
                    />
                  ) : (
                    <span className="text-xl font-bold uppercase text-gray-700 dark:text-gray-200">
                      {initials}
                    </span>
                  )}
                </div>

                <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-lg border-2 border-white bg-emerald-500 text-white dark:border-gray-900">
                  <CameraIcon />
                </span>
              </div>

              {/* USER INFO */}

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  Account
                </p>

                <h4 className="mt-1 truncate text-xl font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </h4>

                <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                  {displayEmail}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex max-w-full rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <span className="truncate">
                      {roleLabel}
                    </span>
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      user?.status ===
                      "blocked"
                        ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        : user?.status ===
                            "inactive"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* EDIT PHOTO */}

            <button
              type="button"
              onClick={
                handleOpenModal
              }
              disabled={
                !userId
              }
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-900 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 xl:w-auto"
            >
              <CameraIcon />

              Edit Photo
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          EDIT PROFILE PICTURE MODAL
          =================================================== */}

      <Modal
        isOpen={
          isOpen
        }
        onClose={
          handleCloseModal
        }
        className="m-4 max-w-[560px]"
      >
        <div className="relative w-full max-w-[560px] rounded-3xl bg-white p-5 dark:bg-gray-900 sm:p-7">
          {/* HEADER */}

          <div className="pr-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              Project Tracker
            </p>

            <h4 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              Edit Profile Picture
            </h4>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Upload a JPG, JPEG, PNG or WEBP image.
              Maximum file size is 5 MB.
            </p>
          </div>

          {/* ERROR */}

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : null}

          {/* SUCCESS */}

          {successMessage ? (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900 dark:bg-green-950/30">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {successMessage}
              </p>
            </div>
          ) : null}

          {/* PREVIEW */}

          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950/40">
            <div className="flex flex-col items-center">
              <div className="flex size-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {showAvatar ? (
                  <img
                    src={
                      displayedAvatarUrl
                    }
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                    onError={() => {
                      setAvatarFailed(
                        true
                      );
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold uppercase text-gray-700 dark:text-gray-200">
                    {initials}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                {displayName}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {roleLabel}
              </p>
            </div>
          </div>

          {/* FILE INPUT */}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Profile Picture
            </label>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={
                handleFileChange
              }
              disabled={
                saving ||
                removing
              }
              className="block w-full cursor-pointer rounded-xl border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400 dark:file:bg-gray-800 dark:file:text-gray-300"
            />

            {selectedFile ? (
              <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  Selected:{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {selectedFile.name}
                  </span>
                </p>
              </div>
            ) : null}
          </div>

          {/* ACTIONS */}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {user?.avatar ? (
                <button
                  type="button"
                  disabled={
                    saving ||
                    removing
                  }
                  onClick={() => {
                    void handleRemoveAvatar();
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 sm:w-auto"
                >
                  {removing
                    ? "Removing..."
                    : "Remove Photo"}
                </button>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                disabled={
                  saving ||
                  removing
                }
                onClick={
                  handleCloseModal
                }
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !selectedFile ||
                  saving ||
                  removing
                }
                onClick={() => {
                  void handleSaveAvatar();
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Photo"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}