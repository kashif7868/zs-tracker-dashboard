import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import {
  useSidebar,
} from "../context/SidebarContext";

import {
  ThemeToggleButton,
} from "../components/common/ThemeToggleButton";

import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

/* =========================================================
   TYPES
   ========================================================= */

type SearchRoute = {
  keywords: string[];
  path: string;
};

/* =========================================================
   SEARCH ROUTES
   ========================================================= */

const SEARCH_ROUTES: SearchRoute[] = [
  {
    keywords: [
      "dashboard",
      "home",
      "overview",
    ],

    path: "/",
  },

  {
    keywords: [
      "projects",
      "project",
      "all projects",
    ],

    path: "/projects",
  },

  {
    keywords: [
      "create project",
      "new project",
    ],

    path: "/projects/create",
  },

  {
    keywords: [
      "task",
      "tasks",
      "task register",
      "risk",
      "risks",
      "risk register",
    ],

    path: "/tasks",
  },

  {
    keywords: [
      "create task",
      "new task",
      "create risk",
      "new risk",
    ],

    path: "/tasks/create",
  },

  {
    keywords: [
      "documents",
      "document",
      "reports",
      "report",
    ],

    path: "/documents",
  },

  {
    keywords: [
      "action plan",
      "action plans",
      "corrective action",
      "corrective actions",
      "create action plan",
    ],

    path: "/action-plans",
  },

  {
    keywords: [
      "testing",
      "controls",
      "testing controls",
    ],

    path: "/testing-controls",
  },

  {
    keywords: [
      "users",
      "user",
    ],

    path: "/users",
  },

  {
    keywords: [
      "settings",
      "roles",
      "permissions",
    ],

    path: "/settings",
  },

  {
    keywords: [
      "support",
      "help",
    ],

    path: "/support",
  },

  {
    keywords: [
      "profile",
      "account",
    ],

    path: "/profile",
  },
];

/* =========================================================
   ICONS
   ========================================================= */

const ProjectTrackerIcon = () => (
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

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9.25 3C5.79822 3 3 5.79822 3 9.25C3 12.7018 5.79822 15.5 9.25 15.5C10.7469 15.5 12.1208 14.9737 13.1971 14.0962L16.5503 17.4497C16.8432 17.7426 17.3181 17.7426 17.611 17.4497C17.9039 17.1568 17.9039 16.6819 17.611 16.389L14.2579 13.0358C15.1362 11.9593 15.663 10.5848 15.663 9.0873C15.663 5.63552 12.8648 2.8373 9.413 2.8373L9.25 3ZM4.5 9.25C4.5 6.62665 6.62665 4.5 9.25 4.5C11.8734 4.5 14 6.62665 14 9.25C14 11.8734 11.8734 14 9.25 14C6.62665 14 4.5 11.8734 4.5 9.25Z"
      fill="currentColor"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 7H20" />
    <path d="M4 12H20" />
    <path d="M4 17H20" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6L18 18" />
    <path d="M18 6L6 18" />
  </svg>
);

const MoreIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </svg>
);

/* =========================================================
   PAGE LABEL
   ========================================================= */

const getPageLabel = (
  pathname: string
): string => {
  if (
    pathname === "/"
  ) {
    return "Dashboard";
  }

  if (
    pathname.startsWith(
      "/projects/create"
    )
  ) {
    return "Create Project";
  }

  if (
    pathname.startsWith(
      "/projects"
    )
  ) {
    return "Projects";
  }

  if (
    pathname.startsWith(
      "/tasks/create"
    )
  ) {
    return "Create Task";
  }

  if (
    pathname.startsWith(
      "/tasks"
    )
  ) {
    return "Task Register";
  }

  /*
    Legacy Risk URLs are redirected to /tasks in App.tsx.
    These labels remain only as a safe compatibility fallback.
  */

  if (
    pathname.startsWith(
      "/risks/create"
    )
  ) {
    return "Create Task";
  }

  if (
    pathname.startsWith(
      "/risks"
    )
  ) {
    return "Task Register";
  }

  if (
    pathname.startsWith(
      "/action-plans/create"
    )
  ) {
    return "Create Action Plan";
  }

  if (
    pathname.startsWith(
      "/action-plans"
    )
  ) {
    return "Action Plans";
  }

  if (
    pathname.startsWith(
      "/documents"
    )
  ) {
    return "Documents";
  }

  if (
    pathname.startsWith(
      "/testing-controls"
    )
  ) {
    return "Testing & Controls";
  }

  if (
    pathname.startsWith(
      "/users"
    )
  ) {
    return "Users";
  }

  if (
    pathname.startsWith(
      "/settings"
    )
  ) {
    return "Settings";
  }

  if (
    pathname.startsWith(
      "/profile"
    )
  ) {
    return "Profile";
  }

  if (
    pathname.startsWith(
      "/support"
    )
  ) {
    return "Support";
  }

  return "Project Tracker";
};

/* =========================================================
   HEADER
   ========================================================= */

const AppHeader: React.FC = () => {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
  } = useSidebar();

  const [
    isApplicationMenuOpen,
    setApplicationMenuOpen,
  ] =
    useState(false);

  const [
    searchValue,
    setSearchValue,
  ] =
    useState("");

  const [
    searchError,
    setSearchError,
  ] =
    useState("");

  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  /* =======================================================
     CURRENT PAGE
     ======================================================= */

  const pageLabel =
    useMemo(
      () =>
        getPageLabel(
          location.pathname
        ),
      [
        location.pathname,
      ]
    );

  /* =======================================================
     SIDEBAR TOGGLE
     ======================================================= */

  const handleToggle =
    () => {
      if (
        window.innerWidth >=
        1024
      ) {
        toggleSidebar();

        return;
      }

      toggleMobileSidebar();
    };

  /* =======================================================
     APPLICATION MENU
     ======================================================= */

  const toggleApplicationMenu =
    () => {
      setApplicationMenuOpen(
        (
          current
        ) =>
          !current
      );
    };

  /* =======================================================
     SEARCH
     ======================================================= */

  const handleSearch =
    (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const query =
        searchValue
          .trim()
          .toLowerCase();

      if (!query) {
        return;
      }

      const exactMatch =
        SEARCH_ROUTES.find(
          (
            route
          ) =>
            route.keywords.some(
              (
                keyword
              ) =>
                keyword ===
                query
            )
        );

      const partialMatch =
        exactMatch ||
        SEARCH_ROUTES.find(
          (
            route
          ) =>
            route.keywords.some(
              (
                keyword
              ) =>
                keyword.includes(
                  query
                ) ||
                query.includes(
                  keyword
                )
            )
        );

      if (
        !partialMatch
      ) {
        setSearchError(
          "No matching page found."
        );

        return;
      }

      setSearchError("");

      setSearchValue("");

      navigate(
        partialMatch.path
      );
    };

  /* =======================================================
     CTRL / CMD + K
     ======================================================= */

  useEffect(() => {
    const handleKeyDown =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          (
            event.metaKey ||
            event.ctrlKey
          ) &&
          event.key.toLowerCase() ===
            "k"
        ) {
          event.preventDefault();

          inputRef.current?.focus();
        }

        if (
          event.key ===
          "Escape"
        ) {
          inputRef.current?.blur();

          setSearchError("");
        }
      };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =======================================================
     CLOSE MOBILE APPLICATION MENU AFTER ROUTE CHANGE
     ======================================================= */

  useEffect(() => {
    setApplicationMenuOpen(
      false
    );

    setSearchError("");
  }, [
    location.pathname,
  ]);

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 max-w-full border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="w-full min-w-0 max-w-full">
        {/* =================================================
            PRIMARY HEADER ROW
            ================================================= */}

        <div className="flex h-16 w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-5 lg:h-[72px] lg:px-6">
          {/* =================================================
              LEFT AREA
              ================================================= */}

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* SIDEBAR TOGGLE */}

            <button
              type="button"
              onClick={
                handleToggle
              }
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              aria-label={
                isMobileOpen
                  ? "Close sidebar"
                  : "Toggle sidebar"
              }
            >
              {isMobileOpen ? (
                <CloseIcon />
              ) : (
                <MenuIcon />
              )}
            </button>

            {/* =============================================
                MOBILE BRAND
                ============================================= */}

            <Link
              to="/"
              className="flex min-w-0 items-center gap-2.5 lg:hidden"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
                <ProjectTrackerIcon />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  Project Tracker
                </p>

                <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Zorays Solar
                </p>
              </div>
            </Link>

            {/* =============================================
                DESKTOP PAGE CONTEXT
                ============================================= */}

            <div className="hidden min-w-0 lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                Project Tracker
              </p>

              <p className="mt-0.5 truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                {pageLabel}
              </p>
            </div>

            {/* =============================================
                DESKTOP SEARCH
                ============================================= */}

            <div className="ml-2 hidden min-w-0 flex-1 lg:block">
              <form
                onSubmit={
                  handleSearch
                }
                className="relative max-w-[430px]"
              >
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon />
                </span>

                <input
                  ref={
                    inputRef
                  }
                  type="text"
                  value={
                    searchValue
                  }
                  onChange={(
                    event
                  ) => {
                    setSearchValue(
                      event.target.value
                    );

                    if (
                      searchError
                    ) {
                      setSearchError("");
                    }
                  }}
                  placeholder="Search pages or commands..."
                  autoComplete="off"
                  className="h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-11 pr-16 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-emerald-700 dark:focus:bg-gray-900"
                />

                <span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-900">
                  Ctrl
                  <span>
                    K
                  </span>
                </span>

                {searchError ? (
                  <div className="absolute left-0 top-[46px] z-50 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-lg dark:border-red-900 dark:bg-gray-900 dark:text-red-400">
                    {searchError}
                  </div>
                ) : null}
              </form>
            </div>
          </div>

          {/* =================================================
              RIGHT DESKTOP CONTROLS
              ================================================= */}

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <ThemeToggleButton />

            <NotificationDropdown />

            <div className="ml-1 border-l border-gray-200 pl-3 dark:border-gray-800">
              <UserDropdown />
            </div>
          </div>

          {/* =================================================
              MOBILE APPLICATION MENU
              ================================================= */}

          <button
            type="button"
            onClick={
              toggleApplicationMenu
            }
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Open user menu"
            aria-expanded={
              isApplicationMenuOpen
            }
          >
            <MoreIcon />
          </button>
        </div>

        {/* =================================================
            MOBILE APPLICATION PANEL
            ================================================= */}

        <div
          className={`w-full min-w-0 overflow-hidden border-t border-gray-100 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-900 lg:hidden ${
            isApplicationMenuOpen
              ? "max-h-40 opacity-100"
              : "max-h-0 border-t-transparent opacity-0"
          }`}
        >
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggleButton />

              <NotificationDropdown />
            </div>

            <div className="min-w-0">
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;