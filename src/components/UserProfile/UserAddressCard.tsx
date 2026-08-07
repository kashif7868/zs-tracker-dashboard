/* =========================================================
   ICONS
   ========================================================= */

const LocationIcon = () => (
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
    <path d="M20 10C20 15.5 12 22 12 22C12 22 4 15.5 4 10C4 5.6 7.6 2 12 2C16.4 2 20 5.6 20 10Z" />

    <circle
      cx="12"
      cy="10"
      r="3"
    />
  </svg>
);

/* =========================================================
   USER ADDRESS CARD
   ========================================================= */

export default function UserAddressCard() {
  return (
    <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-5 lg:p-6">
        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <LocationIcon />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Location Details
              </p>

              <h4 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                Address Information
              </h4>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Address information has not been configured for this account.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <span className="size-2 rounded-full bg-gray-300 dark:bg-gray-600" />

            Not Configured
          </span>
        </div>

        {/* =================================================
            ADDRESS DETAILS
            ================================================= */}

        <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20 sm:grid-cols-2 lg:grid-cols-4">
          {/* COUNTRY */}

          <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 sm:border-r lg:border-b-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Country
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-400 dark:text-gray-500">
              —
            </p>
          </div>

          {/* CITY / STATE */}

          <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              City / State
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-400 dark:text-gray-500">
              —
            </p>
          </div>

          {/* POSTAL CODE */}

          <div className="min-w-0 border-b border-gray-100 p-4 dark:border-gray-800 sm:border-b-0 sm:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Postal Code
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-400 dark:text-gray-500">
              —
            </p>
          </div>

          {/* TAX ID */}

          <div className="min-w-0 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Tax ID
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-400 dark:text-gray-500">
              —
            </p>
          </div>
        </div>

        {/* =================================================
            INFORMATION NOTE
            ================================================= */}

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />

          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            These fields will remain unavailable until address information is
            supported for the account.
          </p>
        </div>
      </div>
    </div>
  );
}