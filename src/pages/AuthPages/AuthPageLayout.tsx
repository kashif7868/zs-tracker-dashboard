import React from "react";

import { Link } from "react-router";

import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

/* =========================================================
   PROJECT TRACKER ICON
   ========================================================= */

const ProjectTrackerIcon = ({
  className = "size-7",
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
   AUTH LAYOUT
   ========================================================= */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white dark:bg-gray-900">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        {/* =================================================
            LEFT - AUTH FORM
            ================================================= */}

        <div className="relative flex min-h-screen w-full min-w-0 flex-col lg:w-1/2">
          {/* MOBILE BRAND */}

          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800 lg:hidden">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
                <ProjectTrackerIcon className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  Project Tracker
                </p>

                <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Risk Management System
                </p>
              </div>
            </Link>
          </div>

          {/* AUTH PAGE CONTENT */}

          <div className="flex min-h-0 flex-1 flex-col">
            {children}
          </div>
        </div>

        {/* =================================================
            RIGHT - PROJECT TRACKER BRAND PANEL
            ================================================= */}

        <div className="relative hidden min-h-screen w-1/2 overflow-hidden bg-[#11183f] lg:flex lg:items-center lg:justify-center">
          {/* GRID BACKGROUND */}

          <div className="pointer-events-none absolute inset-0 opacity-50">
            <GridShape />
          </div>

          {/* BACKGROUND GLOW */}

          <div className="pointer-events-none absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-3xl" />

          {/* BRAND CONTENT */}

          <div className="relative z-10 flex w-full max-w-[540px] flex-col items-center px-10 text-center">
            {/* ICON */}

            <Link
              to="/"
              className="group flex size-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-sm transition hover:bg-white/15"
              aria-label="Project Tracker"
            >
              <ProjectTrackerIcon className="size-10 transition-transform duration-200 group-hover:scale-105" />
            </Link>

            {/* TITLE */}

            <h1 className="mt-7 text-4xl font-bold tracking-tight text-white xl:text-[42px]">
              Project Tracker
            </h1>

            <p className="mt-3 text-base font-medium text-emerald-300">
              Risk & Electrical Safety Management
            </p>

            {/* DESCRIPTION */}

            <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
              Manage projects, Risk Register records, Evidence and
              rectification progress from one centralized workspace.
            </p>

            {/* FEATURE STRIP */}

            <div className="mt-9 grid w-full max-w-md grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm">
              <div className="px-3 py-4">
                <div className="mx-auto size-2 rounded-full bg-emerald-400" />

                <p className="mt-2 text-xs font-semibold text-white/80">
                  Projects
                </p>
              </div>

              <div className="border-x border-white/10 px-3 py-4">
                <div className="mx-auto size-2 rounded-full bg-amber-400" />

                <p className="mt-2 text-xs font-semibold text-white/80">
                  Risks
                </p>
              </div>

              <div className="px-3 py-4">
                <div className="mx-auto size-2 rounded-full bg-blue-400" />

                <p className="mt-2 text-xs font-semibold text-white/80">
                  Evidence
                </p>
              </div>
            </div>

            {/* FOOTER BRAND */}

            <div className="mt-9 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-400" />

              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                Project Tracker
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            THEME TOGGLER
            ================================================= */}

        <div className="fixed bottom-5 right-5 z-50 hidden sm:block lg:bottom-6 lg:right-6">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}