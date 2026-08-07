import {
  useRef,
  type ChangeEvent,
} from "react";

type CalendarDatePickerProps = {
  id: string;
  name: string;
  label: string;
  value: string;

  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  min?: string;
  max?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
    />

    <path d="M16 3V7" />
    <path d="M8 3V7" />
    <path d="M3 10H21" />

    <path d="M8 14H8.01" />
    <path d="M12 14H12.01" />
    <path d="M16 14H16.01" />

    <path d="M8 18H8.01" />
    <path d="M12 18H12.01" />
  </svg>
);

export default function CalendarDatePicker({
  id,
  name,
  label,
  value,
  onChange,
  min,
  max,
  error,
  required = false,
  disabled = false,
}: CalendarDatePickerProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    if (disabled) {
      return;
    }

    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();

    try {
      input.showPicker();
    } catch {
      input.click();
    }
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="date"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={onChange}
          className={`h-11 w-full cursor-pointer rounded-xl border bg-transparent py-2.5 pl-4 pr-12 text-sm text-gray-800 outline-none transition focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60 dark:text-white dark:[color-scheme:dark] dark:disabled:bg-gray-800 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
              : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-500/10 dark:border-gray-700"
          }`}
        />

        <button
          type="button"
          onClick={openCalendar}
          disabled={disabled}
          aria-label={`Open ${label} calendar`}
          className="absolute right-1.5 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
        >
          <CalendarIcon />
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}