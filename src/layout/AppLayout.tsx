import {
  SidebarProvider,
  useSidebar,
} from "../context/SidebarContext";

import { Outlet } from "react-router";

import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

/* =========================================================
   LAYOUT CONTENT
   ========================================================= */

const LayoutContent: React.FC = () => {
  const {
    isExpanded,
    isHovered,
  } = useSidebar();

  const showFullSidebar =
    isExpanded || isHovered;

  /*
    Sidebar widths AppSidebar ke bilkul same hain:

    Expanded: 272px
    Collapsed: 88px
  */

  const desktopMargin =
    showFullSidebar
      ? "lg:ml-[272px]"
      : "lg:ml-[88px]";

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      {/* ===================================================
          SIDEBAR
          =================================================== */}

      <AppSidebar />

      {/* ===================================================
          MOBILE BACKDROP
          =================================================== */}

      <Backdrop />

      {/* ===================================================
          MAIN APPLICATION AREA

          Block width auto rakhi gayi hai.

          Margin add hone ke baad browser automatically
          remaining available width calculate karega.
          =================================================== */}

      <div
        className={`min-w-0 transition-[margin-left] duration-300 ease-in-out ${desktopMargin}`}
      >
        <AppHeader />

        {/* =================================================
            PAGE CONTENT

            overflow-x-hidden page components ko sidebar ya
            viewport ke bahar jane se rokta hai.
            ================================================= */}

        <main className="min-w-0 overflow-x-hidden">
          <div className="mx-auto w-full min-w-0 max-w-[1536px] p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

/* =========================================================
   APPLICATION LAYOUT
   ========================================================= */

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;