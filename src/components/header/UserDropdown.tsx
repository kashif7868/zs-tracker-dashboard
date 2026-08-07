import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  Dropdown,
} from "../ui/dropdown/Dropdown";

import {
  DropdownItem,
} from "../ui/dropdown/DropdownItem";

/* =========================================================
   AVATAR URL
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

/* =========================================================
   USER INITIALS
   ========================================================= */

const getUserInitials = (
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

  if (
    parts.length === 0
  ) {
    return "U";
  }

  if (
    parts.length === 1
  ) {
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

/* =========================================================
   ROLE LABEL
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
    .map(
      (
        word: string
      ) =>
        word
          .charAt(0)
          .toUpperCase() +
        word
          .slice(1)
          .toLowerCase()
    )
    .join(" ");
};

/* =========================================================
   STATUS LABEL
   ========================================================= */

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

/* =========================================================
   ICONS
   ========================================================= */

const ProfileIcon = () => (
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
      cy="8"
      r="4"
    />

    <path d="M4 21C4 17.7 7.6 15 12 15C16.4 15 20 17.7 20 21" />
  </svg>
);

const SettingsIcon = () => (
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
      r="3"
    />

    <path d="M19.4 15A1.7 1.7 0 0 0 19.7 16.9L19.8 17A2 2 0 1 1 17 19.8L16.9 19.7A1.7 1.7 0 0 0 15 19.4A1.7 1.7 0 0 0 14 21V21.2A2 2 0 1 1 10 21.2V21A1.7 1.7 0 0 0 9 19.4A1.7 1.7 0 0 0 7.1 19.7L7 19.8A2 2 0 1 1 4.2 17L4.3 16.9A1.7 1.7 0 0 0 4.6 15A1.7 1.7 0 0 0 3 14H2.8A2 2 0 1 1 2.8 10H3A1.7 1.7 0 0 0 4.6 9A1.7 1.7 0 0 0 4.3 7.1L4.2 7A2 2 0 1 1 7 4.2L7.1 4.3A1.7 1.7 0 0 0 9 4.6A1.7 1.7 0 0 0 10 3V2.8A2 2 0 1 1 14 2.8V3A1.7 1.7 0 0 0 15 4.6A1.7 1.7 0 0 0 16.9 4.3L17 4.2A2 2 0 1 1 19.8 7L19.7 7.1A1.7 1.7 0 0 0 19.4 9A1.7 1.7 0 0 0 21 10H21.2A2 2 0 1 1 21.2 14H21A1.7 1.7 0 0 0 19.4 15Z" />
  </svg>
);

const SupportIcon = () => (
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

    <path d="M9.7 9A2.5 2.5 0 0 1 12 7.5C13.4 7.5 14.5 8.4 14.5 9.7C14.5 11.6 12 11.6 12 13.5" />

    <path d="M12 17H12.01" />
  </svg>
);

const LogoutIcon = () => (
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
    <path d="M10 17L15 12L10 7" />

    <path d="M15 12H3" />

    <path d="M14 4H19C20.1 4 21 4.9 21 6V18C21 19.1 20.1 20 19 20H14" />
  </svg>
);

/* =========================================================
   USER DROPDOWN
   ========================================================= */

export default function UserDropdown() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
    isAdmin,
  } = useAuth();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    avatarFailed,
    setAvatarFailed,
  ] =
    useState(false);

  const [
    signingOut,
    setSigningOut,
  ] =
    useState(false);

  /* =======================================================
     DISPLAY VALUES
     ======================================================= */

  const displayName =
    user?.name?.trim() ||
    "User";

  const displayEmail =
    user?.email?.trim() ||
    "";

  const shortName =
    displayName
      .split(/\s+/)
      .filter(Boolean)[0] ||
    "User";

  const initials =
    useMemo(
      () =>
        getUserInitials(
          displayName
        ),
      [
        displayName,
      ]
    );

  const avatarUrl =
    useMemo(
      () =>
        getAvatarUrl(
          user?.avatar
        ),
      [
        user?.avatar,
      ]
    );

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

  const showAvatar =
    Boolean(
      avatarUrl
    ) &&
    !avatarFailed;

  /* =======================================================
     DROPDOWN
     ======================================================= */

  const toggleDropdown =
    () => {
      setIsOpen(
        (
          current
        ) =>
          !current
      );
    };

  const closeDropdown =
    () => {
      setIsOpen(
        false
      );
    };

  /* =======================================================
     SIGN OUT
     ======================================================= */

  const handleSignOut =
    async () => {
      if (
        signingOut
      ) {
        return;
      }

      try {
        setSigningOut(
          true
        );

        closeDropdown();

        await logout();

        navigate(
          "/signin",
          {
            replace: true,
          }
        );
      } finally {
        setSigningOut(
          false
        );
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="relative min-w-0">
      {/* ===================================================
          HEADER BUTTON
          =================================================== */}

      <button
        type="button"
        onClick={
          toggleDropdown
        }
        className={`flex min-w-0 items-center gap-2 rounded-xl border p-1.5 pr-2 transition ${
          isOpen
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-500/10"
            : "border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800"
        }`}
        aria-expanded={
          isOpen
        }
        aria-label="Open user menu"
      >
        {/* AVATAR */}

        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
          {showAvatar ? (
            <img
              src={
                avatarUrl
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
            <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
              {initials}
            </span>
          )}
        </span>

        {/* USER NAME */}

        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-[120px] truncate text-xs font-semibold text-gray-800 dark:text-white/90">
            {shortName}
          </p>

          <p className="mt-0.5 max-w-[120px] truncate text-[9px] font-medium text-gray-400">
            {roleLabel}
          </p>
        </div>

        {/* CHEVRON */}

        <svg
          className={`hidden size-4 shrink-0 stroke-gray-400 transition-transform duration-200 sm:block ${
            isOpen
              ? "rotate-180"
              : ""
          }`}
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4.5 6.75L9 11.25L13.5 6.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ===================================================
          DROPDOWN
          =================================================== */}

      <Dropdown
        isOpen={
          isOpen
        }
        onClose={
          closeDropdown
        }
        className="fixed left-4 right-4 top-[72px] z-[99999] mt-2 flex max-h-[calc(100dvh-88px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[310px]"
      >
        {/* =================================================
            PROFILE SUMMARY
            ================================================= */}

        <div className="relative overflow-hidden border-b border-gray-100 px-4 pb-4 pt-5 dark:border-gray-800">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-emerald-500" />

          <div className="flex min-w-0 items-center gap-3">
            {/* AVATAR */}

            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
              {showAvatar ? (
                <img
                  src={
                    avatarUrl
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
                <span className="text-sm font-bold uppercase text-gray-700 dark:text-gray-200">
                  {initials}
                </span>
              )}
            </div>

            {/* DETAILS */}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {displayName}
              </p>

              {displayEmail ? (
                <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {displayEmail}
                </p>
              ) : null}

              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="inline-flex max-w-full rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="truncate">
                    {roleLabel}
                  </span>
                </span>

                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
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
        </div>

        {/* =================================================
            MENU
            ================================================= */}

        <div className="p-2">
          <ul className="flex flex-col gap-1">
            {/* PROFILE */}

            <li>
              <DropdownItem
                onItemClick={
                  closeDropdown
                }
                tag="a"
                to="/profile"
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:text-emerald-400">
                  <ProfileIcon />
                </span>

                <div className="min-w-0 text-left">
                  <p className="truncate text-xs font-semibold">
                    Edit Profile
                  </p>

                  <p className="mt-0.5 truncate text-[10px] font-normal text-gray-400">
                    Personal information
                  </p>
                </div>
              </DropdownItem>
            </li>

            {/* SETTINGS */}

            {isAdmin ? (
              <li>
                <DropdownItem
                  onItemClick={
                    closeDropdown
                  }
                  tag="a"
                  to="/settings"
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:text-emerald-400">
                    <SettingsIcon />
                  </span>

                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs font-semibold">
                      Account Settings
                    </p>

                    <p className="mt-0.5 truncate text-[10px] font-normal text-gray-400">
                      Roles & permissions
                    </p>
                  </div>
                </DropdownItem>
              </li>
            ) : null}

            {/* SUPPORT */}

            <li>
              <DropdownItem
                onItemClick={
                  closeDropdown
                }
                tag="a"
                to="/support"
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:text-emerald-400">
                  <SupportIcon />
                </span>

                <div className="min-w-0 text-left">
                  <p className="truncate text-xs font-semibold">
                    Support
                  </p>

                  <p className="mt-0.5 truncate text-[10px] font-normal text-gray-400">
                    Help & assistance
                  </p>
                </div>
              </DropdownItem>
            </li>
          </ul>
        </div>

        {/* =================================================
            SIGN OUT
            ================================================= */}

        <div className="border-t border-gray-100 p-2 dark:border-gray-800">
          <button
            type="button"
            disabled={
              signingOut
            }
            onClick={() => {
              void handleSignOut();
            }}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-red-100 group-hover:text-red-600 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-red-500/10 dark:group-hover:text-red-400">
              <LogoutIcon />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-semibold">
                {signingOut
                  ? "Signing out..."
                  : "Sign Out"}
              </p>

              <p className="mt-0.5 text-[10px] font-normal text-gray-400">
                End current session
              </p>
            </div>
          </button>
        </div>
      </Dropdown>
    </div>
  );
}