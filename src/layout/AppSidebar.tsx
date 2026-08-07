import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Link,
  useLocation,
} from "react-router";

import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";

import {
  useSidebar,
} from "../context/SidebarContext";

/* =========================================================
   TYPES
   ========================================================= */

type NavSubItem = {
  name: string;
  path: string;
};

type NavItem = {
  name: string;

  icon: ReactNode;

  path?: string;

  subItems?: NavSubItem[];
};

/* =========================================================
   BRAND ICON
   ========================================================= */

const ProjectTrackerLogo = ({
  className = "size-6",
}: {
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3L20 6V11C20 16 16.5 19.6 12 21C7.5 19.6 4 16 4 11V6L12 3Z" />

    <path d="M8.5 12L10.8 14.3L15.8 9.3" />
  </svg>
);

/* =========================================================
   MAIN MENU
   ========================================================= */

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,

    name: "Dashboard",

    path: "/",
  },

  {
    icon: <BoxCubeIcon />,

    name: "Projects",

    subItems: [
      {
        name: "All Projects",

        path: "/projects",
      },

      {
        name: "Create Project",

        path: "/projects/create",
      },
    ],
  },

  {
    icon: <TableIcon />,

    name: "Risk Register",

    subItems: [
      {
        name: "Risk Register",

        path: "/risks",
      },

      {
        name: "Create Risk",

        path: "/risks/create",
      },
    ],
  },

  {
    icon: <PageIcon />,

    name: "Documents",

    path: "/documents",
  },

  {
    icon: <ListIcon />,

    name: "Testing & Controls",

    path: "/testing-controls",
  },

  {
    icon: <UserCircleIcon />,

    name: "Users",

    path: "/users",
  },

  {
    icon: <PlugInIcon />,

    name: "Settings",

    path: "/settings",
  },
];

/* =========================================================
   SUPPORT MENU
   ========================================================= */

const othersItems: NavItem[] = [
  {
    icon: <PageIcon />,

    name: "Support",

    path: "/support",
  },
];

/* =========================================================
   SIDEBAR
   ========================================================= */

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
  } = useSidebar();

  const location =
    useLocation();

  const [
    openSubmenu,
    setOpenSubmenu,
  ] = useState<{
    type:
      | "main"
      | "others";

    index: number;
  } | null>(null);

  const [
    subMenuHeight,
    setSubMenuHeight,
  ] = useState<
    Record<
      string,
      number
    >
  >({});

  const subMenuRefs =
    useRef<
      Record<
        string,
        HTMLDivElement | null
      >
    >({});

  /* =======================================================
     SIDEBAR STATE
     ======================================================= */

  const showFullSidebar =
    isExpanded ||
    isHovered ||
    isMobileOpen;

  /* =======================================================
     ACTIVE ROUTE
     ======================================================= */

  const isRouteActive =
    useCallback(
      (
        path: string
      ) => {
        if (
          path === "/"
        ) {
          return (
            location.pathname ===
            "/"
          );
        }

        return (
          location.pathname ===
            path ||
          location.pathname.startsWith(
            `${path}/`
          )
        );
      },
      [
        location.pathname,
      ]
    );

  /* =======================================================
     SUB ITEM ACTIVE

     Exact match is used first so that:

     /projects/create

     does not make both:
     All Projects
     Create Project

     appear active at the same time.
     ======================================================= */

  const isSubItemActive =
    useCallback(
      (
        path: string
      ) => {
        return (
          location.pathname ===
          path
        );
      },
      [
        location.pathname,
      ]
    );

  /* =======================================================
     AUTOMATICALLY OPEN ACTIVE SUBMENU
     ======================================================= */

  useEffect(() => {
    let matched:
      | {
          type:
            | "main"
            | "others";

          index: number;
        }
      | null =
      null;

    (
      [
        "main",
        "others",
      ] as const
    ).forEach(
      (
        menuType
      ) => {
        const items =
          menuType ===
          "main"
            ? navItems
            : othersItems;

        items.forEach(
          (
            nav,
            index
          ) => {
            if (
              !nav.subItems
            ) {
              return;
            }

            const hasExactSubItem =
              nav.subItems.some(
                (
                  subItem
                ) =>
                  location.pathname ===
                  subItem.path
              );

            const hasNestedSubItem =
              nav.subItems.some(
                (
                  subItem
                ) =>
                  location.pathname.startsWith(
                    `${subItem.path}/`
                  )
              );

            if (
              hasExactSubItem ||
              hasNestedSubItem
            ) {
              matched = {
                type:
                  menuType,

                index,
              };
            }
          }
        );
      }
    );

    setOpenSubmenu(
      matched
    );
  }, [
    location.pathname,
  ]);

  /* =======================================================
     SUBMENU HEIGHT
     ======================================================= */

  useEffect(() => {
    if (
      openSubmenu ===
      null
    ) {
      return;
    }

    const key =
      `${openSubmenu.type}-${openSubmenu.index}`;

    const element =
      subMenuRefs.current[
        key
      ];

    if (!element) {
      return;
    }

    setSubMenuHeight(
      (
        previous
      ) => ({
        ...previous,

        [key]:
          element.scrollHeight,
      })
    );
  }, [
    openSubmenu,
    showFullSidebar,
  ]);

  /* =======================================================
     SUBMENU TOGGLE
     ======================================================= */

  const handleSubmenuToggle =
    (
      index: number,

      menuType:
        | "main"
        | "others"
    ) => {
      setOpenSubmenu(
        (
          previous
        ) => {
          if (
            previous &&
            previous.type ===
              menuType &&
            previous.index ===
              index
          ) {
            return null;
          }

          return {
            type:
              menuType,

            index,
          };
        }
      );
    };

  /* =======================================================
     MENU RENDERER
     ======================================================= */

  const renderMenuItems =
    (
      items:
        NavItem[],

      menuType:
        | "main"
        | "others"
    ) => (
      <ul className="flex flex-col gap-1.5">
        {items.map(
          (
            nav,
            index
          ) => {
            const submenuActive =
              nav.subItems?.some(
                (
                  subItem
                ) =>
                  isRouteActive(
                    subItem.path
                  )
              ) ??
              false;

            const directActive =
              nav.path
                ? isRouteActive(
                    nav.path
                  )
                : false;

            const menuActive =
              submenuActive ||
              directActive;

            const submenuOpen =
              openSubmenu?.type ===
                menuType &&
              openSubmenu?.index ===
                index;

            return (
              <li
                key={
                  nav.name
                }
                className="min-w-0"
              >
                {/* =========================================
                    MENU WITH SUBMENU
                    ========================================= */}

                {nav.subItems ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleSubmenuToggle(
                        index,
                        menuType
                      )
                    }
                    className={`menu-item group w-full cursor-pointer ${
                      menuActive
                        ? "menu-item-active"
                        : "menu-item-inactive"
                    } ${
                      !showFullSidebar
                        ? "lg:justify-center"
                        : "justify-start"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size shrink-0 ${
                        menuActive
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {
                        nav.icon
                      }
                    </span>

                    {showFullSidebar ? (
                      <>
                        <span className="menu-item-text min-w-0 flex-1 truncate text-left">
                          {
                            nav.name
                          }
                        </span>

                        <ChevronDownIcon
                          className={`ml-auto size-5 shrink-0 transition-transform duration-200 ${
                            submenuOpen
                              ? "rotate-180 text-brand-500"
                              : ""
                          }`}
                        />
                      </>
                    ) : null}
                  </button>
                ) : nav.path ? (
                  /* =========================================
                     DIRECT LINK
                     ========================================= */

                  <Link
                    to={
                      nav.path
                    }
                    className={`menu-item group w-full ${
                      directActive
                        ? "menu-item-active"
                        : "menu-item-inactive"
                    } ${
                      !showFullSidebar
                        ? "lg:justify-center"
                        : "justify-start"
                    }`}
                    title={
                      !showFullSidebar
                        ? nav.name
                        : undefined
                    }
                  >
                    <span
                      className={`menu-item-icon-size shrink-0 ${
                        directActive
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {
                        nav.icon
                      }
                    </span>

                    {showFullSidebar ? (
                      <span className="menu-item-text min-w-0 flex-1 truncate">
                        {
                          nav.name
                        }
                      </span>
                    ) : null}
                  </Link>
                ) : null}

                {/* =========================================
                    SUBMENU
                    ========================================= */}

                {nav.subItems &&
                showFullSidebar ? (
                  <div
                    ref={(
                      element
                    ) => {
                      subMenuRefs.current[
                        `${menuType}-${index}`
                      ] =
                        element;
                    }}
                    className="overflow-hidden transition-[height] duration-300 ease-in-out"
                    style={{
                      height:
                        submenuOpen
                          ? `${subMenuHeight[`${menuType}-${index}`] || 0}px`
                          : "0px",
                    }}
                  >
                    <ul className="ml-[42px] mt-1.5 space-y-1 border-l border-gray-100 pl-3 dark:border-gray-800">
                      {nav.subItems.map(
                        (
                          subItem
                        ) => {
                          const exactActive =
                            isSubItemActive(
                              subItem.path
                            );

                          const nestedActive =
                            !nav.subItems?.some(
                              (
                                item
                              ) =>
                                location.pathname ===
                                item.path
                            ) &&
                            location.pathname.startsWith(
                              `${subItem.path}/`
                            );

                          const active =
                            exactActive ||
                            nestedActive;

                          return (
                            <li
                              key={
                                subItem.path
                              }
                              className="min-w-0"
                            >
                              <Link
                                to={
                                  subItem.path
                                }
                                className={`menu-dropdown-item block min-w-0 truncate ${
                                  active
                                    ? "menu-dropdown-item-active"
                                    : "menu-dropdown-item-inactive"
                                }`}
                              >
                                {
                                  subItem.name
                                }
                              </Link>
                            </li>
                          );
                        }
                      )}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          }
        )}
      </ul>
    );

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <aside
      className={`fixed left-0 top-16 z-50 flex h-[calc(100dvh-4rem)] max-w-[calc(100vw-1rem)] flex-col overflow-hidden border-r border-gray-200 bg-white text-gray-900 shadow-xl transition-[width,transform] duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 lg:top-0 lg:h-dvh lg:max-w-none lg:shadow-none ${
        showFullSidebar
          ? "w-[272px]"
          : "w-[88px]"
      } ${
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full"
      } lg:translate-x-0`}
      onMouseEnter={() => {
        if (
          !isExpanded
        ) {
          setIsHovered(
            true
          );
        }
      }}
      onMouseLeave={() => {
        setIsHovered(
          false
        );
      }}
    >
      {/* ===================================================
          BRANDING
          =================================================== */}

      <div
        className={`flex h-[88px] shrink-0 items-center border-b border-gray-100 px-4 dark:border-gray-800 ${
          !showFullSidebar
            ? "justify-center"
            : "justify-start"
        }`}
      >
        <Link
          to="/"
          className={`flex min-w-0 items-center ${
            showFullSidebar
              ? "gap-3"
              : "justify-center"
          }`}
          aria-label="Project Tracker Dashboard"
        >
          {/* BRAND ICON */}

          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
            <ProjectTrackerLogo className="size-6" />
          </div>

          {/* BRAND TEXT */}

          {showFullSidebar ? (
            <div className="min-w-0">
              <p className="truncate text-[17px] font-bold tracking-tight text-gray-900 dark:text-white">
                Project Tracker
              </p>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />

                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Zorays Solar
                </p>
              </div>
            </div>
          ) : null}
        </Link>
      </div>

      {/* ===================================================
          NAVIGATION
          =================================================== */}

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-5">
        <nav className="min-w-0">
          <div className="flex flex-col gap-7">
            {/* =============================================
                PROJECT MANAGEMENT
                ============================================= */}

            <div className="min-w-0">
              <h2
                className={`mb-3 flex h-5 items-center text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 ${
                  !showFullSidebar
                    ? "justify-center"
                    : "justify-start px-3"
                }`}
              >
                {showFullSidebar ? (
                  "Project Management"
                ) : (
                  <HorizontaLDots className="size-5" />
                )}
              </h2>

              {renderMenuItems(
                navItems,
                "main"
              )}
            </div>

            {/* =============================================
                OTHERS
                ============================================= */}

            <div className="min-w-0">
              <h2
                className={`mb-3 flex h-5 items-center text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 ${
                  !showFullSidebar
                    ? "justify-center"
                    : "justify-start px-3"
                }`}
              >
                {showFullSidebar ? (
                  "Others"
                ) : (
                  <HorizontaLDots className="size-5" />
                )}
              </h2>

              {renderMenuItems(
                othersItems,
                "others"
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* ===================================================
          SIDEBAR FOOTER
          =================================================== */}

      {showFullSidebar ? (
        <div className="shrink-0 border-t border-gray-100 p-4 dark:border-gray-800">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-950/40">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-30" />

                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>

              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                Project Tracker
              </p>
            </div>

            <p className="mt-1 text-[10px] leading-4 text-gray-400">
              Risk & Electrical Safety Management
            </p>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 justify-center border-t border-gray-100 py-4 dark:border-gray-800">
          <span
            className="size-2 rounded-full bg-emerald-500"
            title="Project Tracker"
          />
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;