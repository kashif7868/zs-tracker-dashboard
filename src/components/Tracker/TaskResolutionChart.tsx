import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

import flatpickr from "flatpickr";

import { CalenderIcon } from "../../icons";

import {
  getTasks,
  type Task,
} from "../../services/task_register/task.service";

/* =========================================================
   TYPES
   ========================================================= */

type WeeklyTaskRecord = {
  weekStart: Date;
  weekEnd: Date;

  registered: number;
  complete: number;
  inProgress: number;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const WEEKS_IN_DEFAULT_RANGE = 12;

/* =========================================================
   DATE HELPERS
   ========================================================= */

const normalizeStartOfDay = (
  value: Date
): Date => {
  const date = new Date(value);

  date.setHours(0, 0, 0, 0);

  return date;
};

const normalizeEndOfDay = (
  value: Date
): Date => {
  const date = new Date(value);

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
    normalizeStartOfDay(value);

  const day = date.getDay();

  /*
    Monday ko first day of week
    treat kar rahe hain.
  */
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
    getStartOfWeek(value);

  const end =
    new Date(start);

  end.setDate(
    start.getDate() + 6
  );

  return normalizeEndOfDay(end);
};

const createDefaultDateRange = () => {
  const endDate =
    normalizeEndOfDay(
      new Date()
    );

  const startDate =
    getStartOfWeek(
      new Date()
    );

  startDate.setDate(
    startDate.getDate() -
      (WEEKS_IN_DEFAULT_RANGE -
        1) *
        7
  );

  return {
    startDate,
    endDate,
  };
};

const formatWeekLabel = (
  date: Date
): string => {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
};

const formatSelectedRange = (
  startDate: Date,
  endDate: Date
): string => {
  const formatter =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  return `${formatter.format(
    startDate
  )} — ${formatter.format(
    endDate
  )}`;
};

const parseTaskDate = (
  value?: string
): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

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
      requestError.response?.data
        ?.errors?.[0]?.message ||
      requestError.response?.data
        ?.errors?.[0]?.msg ||
      requestError.response?.data
        ?.message ||
      "Task resolution data could not be loaded."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Task resolution data could not be loaded.";
};

/* =========================================================
   FETCH ALL TASK PAGES
   ========================================================= */

const fetchAllTasks =
  async (): Promise<Task[]> => {
    const firstPage =
      await getTasks({
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "asc",
      });

    const allTasks = [
      ...firstPage.tasks,
    ];

    const totalPages =
      firstPage.pagination
        .totalPages;

    if (totalPages <= 1) {
      return allTasks;
    }

    const pageRequests =
      Array.from(
        {
          length:
            totalPages - 1,
        },
        (_, index) =>
          getTasks({
            page: index + 2,

            limit:
              firstPage.pagination
                .limit,

            sortBy: "createdAt",

            sortOrder: "asc",
          })
      );

    const remainingPages =
      await Promise.all(
        pageRequests
      );

    remainingPages.forEach(
      (result) => {
        allTasks.push(
          ...result.tasks
        );
      }
    );

    return allTasks;
  };

/* =========================================================
   BUILD WEEKLY TASK DATA

   Weekly comparison:

   Registered:
   Week mein create hone wale total Tasks.

   Complete:
   Usi week mein create hone wale Tasks jo ab Complete hain.

   In Progress:
   Usi week mein create hone wale Tasks jo ab In Progress hain.
   ========================================================= */

const buildWeeklyTaskData = (
  tasks: Task[],
  selectedStartDate: Date,
  selectedEndDate: Date
): WeeklyTaskRecord[] => {
  const rangeStart =
    getStartOfWeek(
      selectedStartDate
    );

  const rangeEnd =
    getEndOfWeek(
      selectedEndDate
    );

  const records: WeeklyTaskRecord[] =
    [];

  const currentWeek =
    new Date(rangeStart);

  while (
    currentWeek <= rangeEnd
  ) {
    const weekStart =
      normalizeStartOfDay(
        currentWeek
      );

    const weekEnd =
      getEndOfWeek(
        weekStart
      );

    const weeklyTasks =
      tasks.filter((task) => {
        const createdAt =
          parseTaskDate(
            task.createdAt
          );

        if (!createdAt) {
          return false;
        }

        return (
          createdAt >=
            weekStart &&
          createdAt <= weekEnd
        );
      });

    const complete =
      weeklyTasks.filter(
        (task) =>
          task.status ===
          "complete"
      ).length;

    const inProgress =
      weeklyTasks.filter(
        (task) =>
          task.status ===
          "in_progress"
      ).length;

    records.push({
      weekStart,
      weekEnd,

      registered:
        weeklyTasks.length,

      complete,
      inProgress,
    });

    currentWeek.setDate(
      currentWeek.getDate() +
        7
    );
  }

  return records;
};

/* =========================================================
   LOADING CHART
   ========================================================= */

function LoadingChart() {
  return (
    <section className="min-w-0 animate-pulse rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="h-6 w-56 rounded bg-gray-200 dark:bg-gray-800" />

          <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="h-11 w-72 max-w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            key={index}
            className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>

      <div className="mt-6 h-[310px] rounded-xl bg-gray-100 dark:bg-gray-800" />
    </section>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function TaskResolutionChart() {
  const datePickerRef =
    useRef<HTMLInputElement>(
      null
    );

  const defaultDateRange =
    useMemo(
      () =>
        createDefaultDateRange(),
      []
    );

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [
    selectedStartDate,
    setSelectedStartDate,
  ] = useState<Date>(
    defaultDateRange.startDate
  );

  const [
    selectedEndDate,
    setSelectedEndDate,
  ] = useState<Date>(
    defaultDateRange.endDate
  );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD TASKS
     ======================================================= */

  const loadTasks =
    useCallback(
      async (
        showRefreshLoader = false
      ) => {
        try {
          if (showRefreshLoader) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const result =
            await fetchAllTasks();

          setTasks(result);
        } catch (requestError) {
          setTasks([]);

          setError(
            getErrorMessage(
              requestError
            )
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  /* =======================================================
     AVAILABLE TASK DATE LIMITS
     ======================================================= */

  const earliestTaskDate =
    useMemo(() => {
      const validDates = tasks
        .map((task) =>
          parseTaskDate(
            task.createdAt
          )
        )
        .filter(
          (
            date
          ): date is Date =>
            date !== null
        )
        .sort(
          (
            firstDate,
            secondDate
          ) =>
            firstDate.getTime() -
            secondDate.getTime()
        );

      return validDates[0]
        ? normalizeStartOfDay(
            validDates[0]
          )
        : defaultDateRange
            .startDate;
    }, [
      tasks,
      defaultDateRange,
    ]);

  const latestAllowedDate =
    useMemo(
      () =>
        normalizeEndOfDay(
          new Date()
        ),
      []
    );

  /* =======================================================
     CALENDAR
     ======================================================= */

  useEffect(() => {
    if (!datePickerRef.current) {
      return;
    }

    const datePicker =
      flatpickr(
        datePickerRef.current,
        {
          mode: "range",

          static: true,

          monthSelectorType:
            "static",

          dateFormat:
            "d M Y",

          defaultDate: [
            selectedStartDate,
            selectedEndDate,
          ],

          minDate:
            earliestTaskDate,

          maxDate:
            latestAllowedDate,

          clickOpens: true,

          prevArrow:
            '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',

          nextArrow:
            '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 15L12.5 10L7.5 5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',

          onChange: (
            selectedDates
          ) => {
            if (
              selectedDates.length ===
              1
            ) {
              const selectedDate =
                normalizeStartOfDay(
                  selectedDates[0]
                );

              setSelectedStartDate(
                selectedDate
              );

              setSelectedEndDate(
                normalizeEndOfDay(
                  selectedDate
                )
              );
            }

            if (
              selectedDates.length ===
              2
            ) {
              setSelectedStartDate(
                normalizeStartOfDay(
                  selectedDates[0]
                )
              );

              setSelectedEndDate(
                normalizeEndOfDay(
                  selectedDates[1]
                )
              );
            }
          },
        }
      );

    return () => {
      if (
        !Array.isArray(
          datePicker
        )
      ) {
        datePicker.destroy();
      }
    };
  }, [
    earliestTaskDate,
    latestAllowedDate,
  ]);

  /* =======================================================
     WEEKLY DATA
     ======================================================= */

  const weeklyData =
    useMemo(
      () =>
        buildWeeklyTaskData(
          tasks,
          selectedStartDate,
          selectedEndDate
        ),
      [
        tasks,
        selectedStartDate,
        selectedEndDate,
      ]
    );

  /* =======================================================
     FILTERED RANGE TASKS
     ======================================================= */

  const selectedRangeTasks =
    useMemo(() => {
      const rangeStart =
        normalizeStartOfDay(
          selectedStartDate
        );

      const rangeEnd =
        normalizeEndOfDay(
          selectedEndDate
        );

      return tasks.filter(
        (task) => {
          const createdAt =
            parseTaskDate(
              task.createdAt
            );

          if (!createdAt) {
            return false;
          }

          return (
            createdAt >=
              rangeStart &&
            createdAt <= rangeEnd
          );
        }
      );
    }, [
      tasks,
      selectedStartDate,
      selectedEndDate,
    ]);

  /* =======================================================
     SUMMARY
     ======================================================= */

  const totalRegistered =
    selectedRangeTasks.length;

  const totalCompleted =
    selectedRangeTasks.filter(
      (task) =>
        task.status ===
        "complete"
    ).length;

  const totalInProgress =
    selectedRangeTasks.filter(
      (task) =>
        task.status ===
        "in_progress"
    ).length;

  /* =======================================================
     CHART DATA
     ======================================================= */

  const categories =
    useMemo(
      () =>
        weeklyData.map(
          (record) =>
            formatWeekLabel(
              record.weekStart
            )
        ),
      [weeklyData]
    );

  const series = useMemo(
    () => [
      {
        name:
          "Tasks Registered",

        data: weeklyData.map(
          (record) =>
            record.registered
        ),
      },

      {
        name:
          "Tasks Complete",

        data: weeklyData.map(
          (record) =>
            record.complete
        ),
      },

      {
        name:
          "Tasks In Progress",

        data: weeklyData.map(
          (record) =>
            record.inProgress
        ),
      },
    ],
    [weeklyData]
  );

  /* =======================================================
     CHART OPTIONS
     ======================================================= */

  const options =
    useMemo<ApexOptions>(
      () => ({
        colors: [
          "#64748B",
          "#16A34A",
          "#F59E0B",
        ],

        chart: {
          fontFamily:
            "Outfit, sans-serif",

          height: 310,

          type: "area",

          toolbar: {
            show: false,
          },

          animations: {
            enabled: true,
            speed: 500,
          },

          zoom: {
            enabled: false,
          },
        },

        legend: {
          show: true,

          position: "top",

          horizontalAlign:
            "left",

          fontFamily:
            "Outfit, sans-serif",

          fontSize: "13px",

          markers: {
            size: 6,
          },

          itemMargin: {
            horizontal: 12,
          },
        },

        stroke: {
          curve: "smooth",

          width: [
            2.5,
            2.5,
            2.5,
          ],
        },

        fill: {
          type: "gradient",

          gradient: {
            shadeIntensity: 1,

            opacityFrom: 0.3,

            opacityTo: 0.03,

            stops: [
              0,
              90,
              100,
            ],
          },
        },

        markers: {
          size: 0,

          strokeColors:
            "#ffffff",

          strokeWidth: 2,

          hover: {
            size: 6,
          },
        },

        grid: {
          borderColor:
            "#E5E7EB",

          strokeDashArray: 4,

          xaxis: {
            lines: {
              show: false,
            },
          },

          yaxis: {
            lines: {
              show: true,
            },
          },
        },

        dataLabels: {
          enabled: false,
        },

        tooltip: {
          enabled: true,

          shared: true,

          intersect: false,

          y: {
            formatter: (
              value: number
            ) =>
              `${Math.round(
                value
              )} Task record${
                value === 1
                  ? ""
                  : "s"
              }`,
          },
        },

        xaxis: {
          type: "category",

          categories,

          axisBorder: {
            show: false,
          },

          axisTicks: {
            show: false,
          },

          tooltip: {
            enabled: false,
          },

          labels: {
            style: {
              fontSize: "12px",

              colors:
                "#6B7280",

              fontFamily:
                "Outfit, sans-serif",
            },
          },
        },

        yaxis: {
          min: 0,

          forceNiceScale: true,

          decimalsInFloat: 0,

          labels: {
            formatter: (
              value: number
            ) =>
              Math.round(
                value
              ).toString(),

            style: {
              fontSize: "12px",

              colors: [
                "#6B7280",
              ],

              fontFamily:
                "Outfit, sans-serif",
            },
          },
        },

        noData: {
          text:
            "No Task records available",

          align: "center",

          verticalAlign:
            "middle",

          style: {
            color: "#6B7280",

            fontSize: "14px",

            fontFamily:
              "Outfit, sans-serif",
          },
        },
      }),
      [categories]
    );

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return <LoadingChart />;
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Task Resolution Statistics
            </h3>

            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              Live Data
            </span>
          </div>

          <p className="mt-1 text-theme-sm leading-6 text-gray-500 dark:text-gray-400">
            Date range ke mutabiq
            registered, In Progress aur Complete Tasks compare karein.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <label
              htmlFor="task-resolution-range"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400"
            >
              Select Date Range
            </label>

            <div className="relative">
              <CalenderIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />

              <input
                id="task-resolution-range"
                ref={datePickerRef}
                type="text"
                readOnly
                className="h-11 w-full min-w-[250px] cursor-pointer rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm font-semibold text-gray-700 outline-none transition hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-700 dark:focus:ring-emerald-500/10 sm:w-[280px]"
                placeholder="Select date range"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {formatSelectedRange(
                selectedStartDate,
                selectedEndDate
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              void loadTasks(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            <span
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            >
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
            </span>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadTasks();
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-gray-900 dark:text-red-400"
          >
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY */}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Registered
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {totalRegistered}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Complete
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {totalCompleted}
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            In Progress
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {totalInProgress}
          </p>
        </div>
      </div>

      {/* CHART */}

      {totalRegistered === 0 ? (
        <div className="flex min-h-[310px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center dark:border-gray-800 dark:bg-gray-900/40">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-xl font-bold text-gray-400 dark:bg-gray-800">
            0
          </div>

          <p className="mt-4 text-sm font-bold text-gray-800 dark:text-gray-200">
            No Task records in this range
          </p>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Calendar se doosri date
            range select karein.
          </p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[760px] xl:min-w-full">
            <Chart
              key={`${selectedStartDate.toISOString()}-${selectedEndDate.toISOString()}-${tasks.length}`}
              options={options}
              series={series}
              type="area"
              height={310}
            />
          </div>
        </div>
      )}
    </section>
  );
}