import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import {
  useNavigate,
} from "react-router";

import {
  MoreDotIcon,
} from "../../icons";

import {
  Dropdown,
} from "../ui/dropdown/Dropdown";

import {
  DropdownItem,
} from "../ui/dropdown/DropdownItem";

import {
  getRiskDashboardSummary,
  type RiskDashboardSummary,
} from "../../services/risk/risk.service";

/* =========================================================
   CONSTANTS
   ========================================================= */

const EMPTY_SUMMARY: RiskDashboardSummary = {
  totalRisks: 0,
  inProgressRisks: 0,
  completeRisks: 0,
  completionPercentage: 0,
};

/* =========================================================
   ICONS
   ========================================================= */

const TotalRiskIcon = () => (
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
    <path d="M12 3L20 6V11C20 16 16.6 19.7 12 21C7.4 19.7 4 16 4 11V6L12 3Z" />
    <path d="M12 8V13" />
    <path d="M12 16H12.01" />
  </svg>
);

const InProgressIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M12 7V12L15.5 14" />
  </svg>
);

const CompleteIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M8 12L11 15L16.5 9.5" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
    aria-hidden="true"
  >
    <path d="M20 6V11H15" />
    <path d="M4 18V13H9" />
    <path d="M6.1 8.5A7 7 0 0 1 18.8 7L20 11" />
    <path d="M18 15.5A7 7 0 0 1 5.2 17L4 13" />
  </svg>
);

/* =========================================================
   ERROR HELPER
   ========================================================= */

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
      "Project completion data could not be loaded."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Project completion data could not be loaded.";
};

/* =========================================================
   LOADING CARD
   ========================================================= */

function LoadingCard() {
  return (
    <section className="flex min-h-[440px] w-full min-w-0 max-w-full animate-pulse flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-6 w-40 max-w-full rounded bg-gray-200 dark:bg-gray-800" />

            <div className="mt-3 h-4 w-56 max-w-full rounded bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="size-9 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="mx-auto mt-6 h-[190px] w-full max-w-[310px] rounded-[50%] bg-gray-100 dark:bg-gray-800" />

        <div className="mx-auto mt-4 h-4 w-48 max-w-full rounded bg-gray-200 dark:bg-gray-800" />

        <div className="mt-5 h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="grid grid-cols-3 border-t border-gray-200 dark:border-gray-800">
        {Array.from({
          length: 3,
        }).map(
          (
            _,
            index
          ) => (
            <div
              key={
                index
              }
              className="min-w-0 px-2 py-4 text-center"
            >
              <div className="mx-auto size-7 rounded-lg bg-gray-200 dark:bg-gray-800" />

              <div className="mx-auto mt-2 h-3 w-16 max-w-full rounded bg-gray-200 dark:bg-gray-800" />

              <div className="mx-auto mt-2 h-5 w-8 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function ProjectCompletionCard() {
  const navigate =
    useNavigate();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    summary,
    setSummary,
  ] =
    useState<RiskDashboardSummary>(
      EMPTY_SUMMARY
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD SUMMARY
     ======================================================= */

  const loadSummary =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        try {
          if (
            showRefreshLoader
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError("");

          const result =
            await getRiskDashboardSummary();

          setSummary(
            result
          );
        } catch (
          requestError
        ) {
          setSummary(
            EMPTY_SUMMARY
          );

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadSummary();
  }, [
    loadSummary,
  ]);

  /* =======================================================
     VALUES
     ======================================================= */

  const totalRisks =
    summary.totalRisks;

  const inProgressRisks =
    summary.inProgressRisks;

  const completedRisks =
    summary.completeRisks;

  const completionPercentage =
    Math.min(
      Math.max(
        Number(
          summary.completionPercentage
        ) || 0,
        0
      ),
      100
    );

  const remainingPercentage =
    Math.max(
      100 -
        completionPercentage,
      0
    );

  /* =======================================================
     CHART
     ======================================================= */

  const series =
    useMemo(
      () => [
        completionPercentage,
      ],
      [
        completionPercentage,
      ]
    );

  const options =
    useMemo<ApexOptions>(
      () => ({
        colors: [
          "#16A34A",
        ],

        chart: {
          fontFamily:
            "Outfit, sans-serif",

          type:
            "radialBar",

          sparkline: {
            enabled: true,
          },

          animations: {
            enabled: true,

            speed: 500,
          },

          toolbar: {
            show: false,
          },

          redrawOnParentResize:
            true,

          redrawOnWindowResize:
            true,
        },

        plotOptions: {
          radialBar: {
            startAngle:
              -88,

            endAngle:
              88,

            hollow: {
              size:
                "72%",
            },

            track: {
              background:
                "#E5E7EB",

              strokeWidth:
                "100%",

              margin: 3,
            },

            dataLabels: {
              name: {
                show: false,
              },

              value: {
                fontSize:
                  "34px",

                fontWeight:
                  "700",

                offsetY:
                  -24,

                color:
                  "#111827",

                formatter: (
                  value: number
                ) =>
                  `${Math.round(
                    value
                  )}%`,
              },
            },
          },
        },

        fill: {
          type: "solid",

          colors: [
            "#16A34A",
          ],
        },

        stroke: {
          lineCap:
            "round",
        },

        labels: [
          "Project Completion",
        ],

        tooltip: {
          enabled: true,

          y: {
            formatter: (
              value: number
            ) =>
              `${value.toFixed(
                1
              )}% completed`,
          },
        },
      }),
      []
    );

  /* =======================================================
     DROPDOWN
     ======================================================= */

  const toggleDropdown =
    () => {
      setIsOpen(
        (
          currentState
        ) =>
          !currentState
      );
    };

  const closeDropdown =
    () => {
      setIsOpen(
        false
      );
    };

  const openRiskRegister =
    () => {
      closeDropdown();

      navigate(
        "/risks"
      );
    };

  const createRisk =
    () => {
      closeDropdown();

      navigate(
        "/risks/create"
      );
    };

  const refreshData =
    () => {
      closeDropdown();

      void loadSummary(
        true
      );
    };

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <LoadingCard />
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="flex min-h-[440px] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* ===================================================
          MAIN CONTENT
          =================================================== */}

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        {/* HEADER */}

        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 text-lg font-semibold text-gray-800 dark:text-white/90">
                Project Completion
              </h3>

              <span className="inline-flex shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                Live Data
              </span>
            </div>

            <p className="mt-1.5 max-w-md text-sm leading-5 text-gray-500 dark:text-gray-400">
              Overall Risk rectification progress.
            </p>
          </div>

          {/* OPTIONS */}

          <div className="relative shrink-0">
            <button
              type="button"
              disabled={
                refreshing
              }
              className="dropdown-toggle flex size-9 items-center justify-center rounded-lg transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/5"
              onClick={
                toggleDropdown
              }
              aria-label="Open project completion options"
              aria-expanded={
                isOpen
              }
            >
              <MoreDotIcon className="size-6 text-gray-400" />
            </button>

            <Dropdown
              isOpen={
                isOpen
              }
              onClose={
                closeDropdown
              }
              className="w-48 p-2"
            >
              <DropdownItem
                onItemClick={
                  openRiskRegister
                }
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View Risk Register
              </DropdownItem>

              <DropdownItem
                onItemClick={
                  createRisk
                }
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Create Risk
              </DropdownItem>

              <DropdownItem
                onItemClick={
                  refreshData
                }
                className="flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Refresh Data
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* ERROR */}

        {error ? (
          <div className="mt-4 flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words text-xs font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() => {
                void loadSummary(
                  true
                );
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                <RefreshIcon />
              </span>

              Retry
            </button>
          </div>
        ) : null}

        {/* =================================================
            RADIAL CHART

            Width is explicitly constrained to available card
            width to prevent ApexCharts horizontal overflow.
            ================================================= */}

        <div className="mt-3 w-full min-w-0 max-w-full overflow-hidden">
          <div className="mx-auto w-full min-w-0 max-w-[390px] overflow-hidden">
            <Chart
              options={
                options
              }
              series={
                series
              }
              type="radialBar"
              width="100%"
              height={235}
            />
          </div>
        </div>

        {/* COMPLETION BADGE */}

        <div className="-mt-8 flex w-full min-w-0 justify-center px-3">
          <span className="inline-flex max-w-full items-center justify-center rounded-full bg-emerald-50 px-3 py-1.5 text-center text-[11px] font-bold leading-4 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {completedRisks} of{" "}
            {totalRisks} completed
          </span>
        </div>

        {/* DESCRIPTION */}

        <p className="mx-auto mt-4 max-w-[420px] text-center text-xs leading-5 text-gray-500 dark:text-gray-400 sm:text-sm">
          {completedRisks} completed
          {" · "}
          {inProgressRisks} in progress
        </p>

        {/* =================================================
            PROGRESS BAR
            ================================================= */}

        <div className="mt-auto pt-5">
          <div className="mb-2 flex min-w-0 items-center justify-between gap-3 text-xs font-semibold">
            <span className="truncate text-gray-500 dark:text-gray-400">
              Overall Progress
            </span>

            <span className="shrink-0 text-emerald-700 dark:text-emerald-400">
              {completionPercentage}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-700"
              style={{
                width:
                  `${completionPercentage}%`,
              }}
            />
          </div>

          <div className="mt-2 flex min-w-0 items-center justify-between gap-3 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
            <span className="truncate">
              Completed{" "}
              {completionPercentage}%
            </span>

            <span className="shrink-0">
              Remaining{" "}
              {remainingPercentage.toFixed(
                0
              )}
              %
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================
          BOTTOM SUMMARY
          =================================================== */}

      <div className="grid w-full min-w-0 grid-cols-3 border-t border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-950/30">
        {/* TOTAL */}

        <div className="min-w-0 px-2 py-3.5 text-center sm:px-3">
          <div className="mx-auto flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300">
            <TotalRiskIcon />
          </div>

          <p className="mt-2 truncate text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
            Total Risks
          </p>

          <p className="mt-0.5 text-base font-bold text-gray-800 dark:text-white/90">
            {totalRisks}
          </p>
        </div>

        {/* IN PROGRESS */}

        <div className="min-w-0 border-x border-gray-200 px-2 py-3.5 text-center dark:border-gray-800 sm:px-3">
          <div className="mx-auto flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <InProgressIcon />
          </div>

          <p className="mt-2 truncate text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
            In Progress
          </p>

          <p className="mt-0.5 text-base font-bold text-amber-700 dark:text-amber-400">
            {inProgressRisks}
          </p>
        </div>

        {/* COMPLETE */}

        <div className="min-w-0 px-2 py-3.5 text-center sm:px-3">
          <div className="mx-auto flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CompleteIcon />
          </div>

          <p className="mt-2 truncate text-[10px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
            Complete
          </p>

          <p className="mt-0.5 text-base font-bold text-emerald-700 dark:text-emerald-400">
            {completedRisks}
          </p>
        </div>
      </div>
    </section>
  );
}