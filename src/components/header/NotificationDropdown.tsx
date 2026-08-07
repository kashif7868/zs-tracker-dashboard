import {
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  Dropdown,
} from "../ui/dropdown/Dropdown";

/* =========================================================
   ICONS
   ========================================================= */

const BellIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    className="size-5"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
      fill="currentColor"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    className="size-5"
    aria-hidden="true"
  >
    <path d="M6 6L18 18" />
    <path d="M18 6L6 18" />
  </svg>
);

const EmptyNotificationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-7"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 16 3 16H21C21 16 18 15 18 8Z" />

    <path d="M10 20H14" />

    <path d="M9 11L11 13L15 9" />
  </svg>
);

/* =========================================================
   NOTIFICATION DROPDOWN
   ========================================================= */

export default function NotificationDropdown() {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  /* =======================================================
     NOTIFICATIONS

     Notification backend/module is not implemented yet.

     Keep this false until real unread notification data
     becomes available.
     ======================================================= */

  const hasUnreadNotifications =
    false;

  const toggleDropdown = () => {
    setIsOpen(
      (current) =>
        !current
    );
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="relative">
      {/* ===================================================
          BELL BUTTON
          =================================================== */}

      <button
        type="button"
        onClick={
          toggleDropdown
        }
        className={`relative flex size-10 items-center justify-center rounded-xl border transition ${
          isOpen
            ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
        }`}
        aria-label="Notifications"
        aria-expanded={
          isOpen
        }
      >
        <BellIcon />

        {/* REAL UNREAD INDICATOR ONLY */}

        {hasUnreadNotifications ? (
          <span className="absolute right-1.5 top-1.5 flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-40" />

            <span className="relative inline-flex size-2 rounded-full bg-orange-500" />
          </span>
        ) : null}
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
        className="fixed left-4 right-4 top-[72px] z-[99999] mt-2 flex max-h-[calc(100dvh-88px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[360px]"
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-gray-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                Notifications
              </h5>

              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Project Tracker
              </span>
            </div>

            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              System and workflow updates
            </p>
          </div>

          <button
            type="button"
            onClick={
              closeDropdown
            }
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close notifications"
          >
            <CloseIcon />
          </button>
        </div>

        {/* =================================================
            EMPTY STATE
            ================================================= */}

        <div className="flex min-h-[270px] flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <EmptyNotificationIcon />
          </div>

          <h6 className="mt-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            No notifications
          </h6>

          <p className="mt-2 max-w-[270px] text-xs leading-5 text-gray-500 dark:text-gray-400">
            Project Tracker notifications will appear here when notification
            services are enabled.
          </p>

          <Link
            to="/risks"
            onClick={
              closeDropdown
            }
            className="mt-5 inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-900 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
          >
            Open Risk Register
          </Link>
        </div>

        {/* =================================================
            FOOTER
            ================================================= */}

        <div className="shrink-0 border-t border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/30">
          <div className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />

            <p className="text-[10px] leading-4 text-gray-400">
              Notification service not configured
            </p>
          </div>
        </div>
      </Dropdown>
    </div>
  );
}