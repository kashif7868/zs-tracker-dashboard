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
  buildRiskDashboardSummary,
  getRisks,
  type Risk,
} from "../../services/risk/risk.service";

/* =========================================================
   TYPES
   ========================================================= */

type WeeklyActivity = {
  weekStart: Date;
  weekEnd: Date;

  inProgress: number;
  complete: number;
  total: number;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const TOTAL_WEEKS = 12;

/* =========================================================
   DATE HELPERS
   ========================================================= */

const startOfDay = (
  value: Date
): Date => {
  const date =
    new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
};

const endOfDay = (
  value: Date
): Date => {
  const date =
    new Date(value);

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
};

const getStartOfWeek = (
  value: Date
): Date => {
  const date =
    startOfDay(
      value
    );

  const day =
    date.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  date.setDate(
    date.getDate() +
      difference
  );

  return date;
};

const getEndOfWeek = (
  value: Date
): Date => {
  const start =
    getStartOfWeek(
      value
    );

  const end =
    new Date(start);

  end.setDate(
    start.getDate() + 6
  );

  return endOfDay(
    end
  );
};

const parseDate = (
  value?: string
): Date | null => {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

const formatWeekLabel = (
  value: Date
): string => {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",

      month:
        "short",
    }
  ).format(
    value
  );
};

const formatWeekRange = (
  startDate: Date,
  endDate: Date
): string => {
  const formatter =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        day:
          "2-digit",

        month:
          "short",
      }
    );

  return `${formatter.format(
    startDate
  )} – ${formatter.format(
    endDate
  )}`;
};

/* =========================================================
   ERROR HELPER
   ========================================================= */

const getErrorMessage = (
  error: unknown
): string => {
  if (
    typeof error ===
      "object" &&
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
      "Work activity data could not be loaded."
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Work activity data could not be loaded.";
};

/* =========================================================
   FETCH ALL RISKS
   ========================================================= */

const fetchAllRisks =
  async (): Promise<Risk[]> => {
    const firstPage =
      await getRisks({
        page: 1,

        limit: 100,

        sortBy:
          "createdAt",

        sortOrder:
          "asc",
      });

    const allRisks = [
      ...firstPage.risks,
    ];

    const totalPages =
      firstPage.pagination
        .totalPages;

    if (
      totalPages <= 1
    ) {
      return allRisks;
    }

    const remainingRequests =
      Array.from(
        {
          length:
            totalPages - 1,
        },

        (
          _,
          index
        ) =>
          getRisks({
            page:
              index + 2,

            limit:
              firstPage.pagination
                .limit,

            sortBy:
              "createdAt",

            sortOrder:
              "asc",
          })
      );

    const remainingPages =
      await Promise.all(
        remainingRequests
      );

    remainingPages.forEach(
      (result) => {
        allRisks.push(
          ...result.risks
        );
      }
    );

    return allRisks;
  };

/* =========================================================
   BUILD WEEKLY ACTIVITY
   ========================================================= */

const buildWeeklyActivity = (
  risks: Risk[]
): WeeklyActivity[] => {
  const currentWeekStart =
    getStartOfWeek(
      new Date()
    );

  const firstWeekStart =
    new Date(
      currentWeekStart
    );

  firstWeekStart.setDate(
    firstWeekStart.getDate() -
      (TOTAL_WEEKS - 1) * 7
  );

  return Array.from(
    {
      length:
        TOTAL_WEEKS,
    },

    (
      _,
      index
    ) => {
      const weekStart =
        new Date(
          firstWeekStart
        );

      weekStart.setDate(
        firstWeekStart.getDate() +
          index * 7
      );

      const weekEnd =
        getEndOfWeek(
          weekStart
        );

      const weeklyRisks =
        risks.filter(
          (risk) => {
            const createdAt =
              parseDate(
                risk.createdAt
              );

            if (
              !createdAt
            ) {
              return false;
            }

            return (
              createdAt >=
                weekStart &&
              createdAt <=
                weekEnd
            );
          }
        );

      const inProgress =
        weeklyRisks.filter(
          (risk) =>
            risk.status ===
            "in_progress"
        ).length;

      const complete =
        weeklyRisks.filter(
          (risk) =>
            risk.status ===
            "complete"
        ).length;

      return {
        weekStart,
        weekEnd,

        inProgress,
        complete,

        total:
          weeklyRisks.length,
      };
    }
  );
};

/* =========================================================
   LOADING CARD
   ========================================================= */

function LoadingCard() {
  return (
    <section className="w-full min-w-0 max-w-full animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-5 sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="h-6 w-52 max-w-full rounded bg-gray-200 dark:bg-gray-800" />

            <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="size-9 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />

          <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>

        <div className="mt-5 h-[250px] w-full rounded-xl bg-gray-100 dark:bg-gray-800" />

        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
          <div className="h-4 w-96 max-w-full rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function RiskWorkActivityChart() {
  const navigate =
    useNavigate();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    risks,
    setRisks,
  ] =
    useState<Risk[]>([]);

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
     LOAD RISKS
     ======================================================= */

  const loadRisks =
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
            await fetchAllRisks();

          setRisks(
            result
          );
        } catch (
          requestError
        ) {
          setRisks([]);

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
    void loadRisks();
  }, [
    loadRisks,
  ]);

  /* =======================================================
     DASHBOARD SUMMARY
     ======================================================= */

  const summary =
    useMemo(
      () =>
        buildRiskDashboardSummary(
          risks
        ),
      [
        risks,
      ]
    );

  /* =======================================================
     WEEKLY DATA
     ======================================================= */

  const weeklyActivity =
    useMemo(
      () =>
        buildWeeklyActivity(
          risks
        ),
      [
        risks,
      ]
    );

  const totalActivity =
    useMemo(
      () =>
        weeklyActivity.reduce(
          (
            total,
            record
          ) =>
            total +
            record.total,

          0
        ),
      [
        weeklyActivity,
      ]
    );

  /* =======================================================
     CHART DATA
     ======================================================= */

  const categories =
    useMemo(
      () =>
        weeklyActivity.map(
          (record) =>
            formatWeekLabel(
              record.weekStart
            )
        ),
      [
        weeklyActivity,
      ]
    );

  const series =
    useMemo(
      () => [
        {
          name:
            "In Progress",

          data:
            weeklyActivity.map(
              (record) =>
                record.inProgress
            ),
        },

        {
          name:
            "Complete",

          data:
            weeklyActivity.map(
              (record) =>
                record.complete
            ),
        },
      ],
      [
        weeklyActivity,
      ]
    );

  /* =======================================================
     CHART OPTIONS
     ======================================================= */

  const options =
    useMemo<ApexOptions>(
      () => ({
        colors: [
          "#F59E0B",
          "#16A34A",
        ],

        chart: {
          fontFamily:
            "Outfit, sans-serif",

          type:
            "bar",

          toolbar: {
            show: false,
          },

          animations: {
            enabled:
              true,

            speed:
              450,
          },

          zoom: {
            enabled:
              false,
          },

          redrawOnParentResize:
            true,

          redrawOnWindowResize:
            true,

          parentHeightOffset:
            0,
        },

        plotOptions: {
          bar: {
            horizontal:
              false,

            columnWidth:
              "48%",

            borderRadius:
              5,

            borderRadiusApplication:
              "end",
          },
        },

        dataLabels: {
          enabled:
            false,
        },

        stroke: {
          show:
            true,

          width:
            1,

          colors: [
            "transparent",
          ],
        },

        xaxis: {
          categories,

          axisBorder: {
            show:
              false,
          },

          axisTicks: {
            show:
              false,
          },

          tooltip: {
            enabled:
              false,
          },

          labels: {
            rotate:
              -25,

            rotateAlways:
              false,

            hideOverlappingLabels:
              true,

            trim:
              true,

            maxHeight:
              65,

            style: {
              colors:
                "#6B7280",

              fontSize:
                "11px",

              fontFamily:
                "Outfit, sans-serif",
            },
          },
        },

        yaxis: {
          min:
            0,

          forceNiceScale:
            true,

          decimalsInFloat:
            0,

          labels: {
            formatter: (
              value: number
            ) =>
              Math.round(
                value
              ).toString(),

            style: {
              colors: [
                "#6B7280",
              ],

              fontSize:
                "11px",

              fontFamily:
                "Outfit, sans-serif",
            },
          },
        },

        legend: {
          show:
            true,

          position:
            "top",

          horizontalAlign:
            "left",

          fontFamily:
            "Outfit, sans-serif",

          fontSize:
            "12px",

          markers: {
            size:
              5,
          },

          itemMargin: {
            horizontal:
              8,

            vertical:
              3,
          },
        },

        grid: {
          borderColor:
            "#E5E7EB",

          strokeDashArray:
            4,

          padding: {
            left:
              2,

            right:
              4,

            top:
              0,

            bottom:
              0,
          },

          yaxis: {
            lines: {
              show:
                true,
            },
          },

          xaxis: {
            lines: {
              show:
                false,
            },
          },
        },

        fill: {
          opacity:
            1,
        },

        tooltip: {
          shared:
            true,

          intersect:
            false,

          x: {
            formatter: (
              _value,
              optionsContext
            ) => {
              const index =
                optionsContext
                  .dataPointIndex;

              const record =
                weeklyActivity[
                  index
                ];

              if (
                !record
              ) {
                return "";
              }

              return formatWeekRange(
                record.weekStart,
                record.weekEnd
              );
            },
          },

          y: {
            formatter: (
              value: number
            ) =>
              `${Math.round(
                value
              )} Risk record${
                value === 1
                  ? ""
                  : "s"
              }`,
          },
        },

        noData: {
          text:
            "No Risk activity available",

          align:
            "center",

          verticalAlign:
            "middle",

          style: {
            color:
              "#6B7280",

            fontSize:
              "13px",

            fontFamily:
              "Outfit, sans-serif",
          },
        },

        responsive: [
          {
            breakpoint:
              768,

            options: {
              plotOptions: {
                bar: {
                  columnWidth:
                    "55%",
                },
              },

              legend: {
                fontSize:
                  "11px",

                itemMargin: {
                  horizontal:
                    5,
                },
              },

              xaxis: {
                labels: {
                  rotate:
                    -40,

                  rotateAlways:
                    true,

                  hideOverlappingLabels:
                    true,

                  trim:
                    true,

                  style: {
                    fontSize:
                      "9px",
                  },
                },
              },

              yaxis: {
                labels: {
                  style: {
                    fontSize:
                      "9px",
                  },
                },
              },
            },
          },

          {
            breakpoint:
              480,

            options: {
              plotOptions: {
                bar: {
                  columnWidth:
                    "60%",
                },
              },

              legend: {
                position:
                  "top",

                horizontalAlign:
                  "center",
              },

              grid: {
                padding: {
                  left:
                    0,

                  right:
                    0,
                },
              },

              xaxis: {
                labels: {
                  rotate:
                    -45,

                  style: {
                    fontSize:
                      "8px",
                  },
                },
              },
            },
          },
        ],
      }),
      [
        categories,
        weeklyActivity,
      ]
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

  const openCreateRisk =
    () => {
      closeDropdown();

      navigate(
        "/risks/create"
      );
    };

  const refreshData =
    () => {
      closeDropdown();

      void loadRisks(
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
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="w-full min-w-0 max-w-full p-5 sm:p-6">
        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Work Progress Activity
              </h3>

              <span className="inline-flex shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                12 Weeks
              </span>
            </div>

            <p className="mt-1.5 max-w-2xl text-sm leading-5 text-gray-500 dark:text-gray-400">
              Weekly comparison of In Progress and Complete Risk records.
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
              aria-label="Open work activity options"
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
                  openCreateRisk
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

        {/* =================================================
            ERROR
            ================================================= */}

        {error ? (
          <div className="mt-5 flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words text-sm font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() => {
                void loadRisks(
                  true
                );
              }}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
            >
              {refreshing
                ? "Refreshing..."
                : "Retry"}
            </button>
          </div>
        ) : null}

        {/* =================================================
            SUMMARY
            ================================================= */}

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Current In Progress
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {
                    summary.inProgressRisks
                  }
                </p>
              </div>

              <span className="size-2 shrink-0 rounded-full bg-amber-500" />
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Total Complete
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {
                    summary.completeRisks
                  }
                </p>
              </div>

              <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* =================================================
            CHART

            No overflow-x-auto.
            No fixed min-width.
            ApexCharts uses exactly the available width.
            ================================================= */}

        {totalActivity === 0 ? (
          <div className="mt-5 flex min-h-[250px] w-full min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800">
              0
            </div>

            <p className="mt-4 text-sm font-bold text-gray-800 dark:text-gray-200">
              No Risk activity in the last 12 weeks
            </p>

            <p className="mt-2 max-w-md text-xs leading-5 text-gray-500 dark:text-gray-400">
              Newly created Risk records will automatically appear in this chart.
            </p>
          </div>
        ) : (
          <div className="mt-4 w-full min-w-0 max-w-full overflow-hidden">
            <Chart
              key={`${risks.length}-${summary.inProgressRisks}-${summary.completeRisks}`}
              options={
                options
              }
              series={
                series
              }
              type="bar"
              width="100%"
              height={250}
            />
          </div>
        )}

        {/* =================================================
            FOOTER
            ================================================= */}

        <div className="mt-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <p className="max-w-4xl text-xs leading-5 text-gray-500 dark:text-gray-400">
            Activity is grouped by each Risk&apos;s creation week and current
            workflow status.
          </p>
        </div>
      </div>
    </section>
  );
}