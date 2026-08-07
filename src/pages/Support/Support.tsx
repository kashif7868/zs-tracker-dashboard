import {
  Link,
} from "react-router";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

/* =========================================================
   TYPES
   ========================================================= */

type SupportCardProps = {
  title: string;
  description: string;
  to: string;
  action: string;
  icon: React.ReactNode;
};

/* =========================================================
   ICONS
   ========================================================= */

const ProjectIcon = () => (
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
    <path d="M4 7C4 5.9 4.9 5 6 5H10L12 7H18C19.1 7 20 7.9 20 9V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V7Z" />

    <path d="M8 12H16" />

    <path d="M8 15H13" />
  </svg>
);

const RiskIcon = () => (
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
    <path d="M12 3L21 20H3L12 3Z" />

    <path d="M12 9V14" />

    <path d="M12 17H12.01" />
  </svg>
);

const AccountIcon = () => (
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
    <circle
      cx="12"
      cy="8"
      r="4"
    />

    <path d="M4 21C4 17.7 7.6 15 12 15C16.4 15 20 17.7 20 21" />
  </svg>
);

const SettingsIcon = () => (
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
    <circle
      cx="12"
      cy="12"
      r="3"
    />

    <path d="M19 12C19 11.4 18.9 10.8 18.8 10.3L21 8.6L19 5.2L16.4 6.3C15.5 5.5 14.4 4.9 13.2 4.6L12.8 2H8.9L8.5 4.6C7.4 4.9 6.3 5.5 5.4 6.3L2.8 5.2L0.8 8.6L3 10.3C2.9 10.8 2.8 11.4 2.8 12C2.8 12.6 2.9 13.2 3 13.7L0.8 15.4L2.8 18.8L5.4 17.7C6.3 18.5 7.4 19.1 8.5 19.4L8.9 22H12.8L13.2 19.4C14.4 19.1 15.5 18.5 16.4 17.7L19 18.8L21 15.4L18.8 13.7C18.9 13.2 19 12.6 19 12Z" />
  </svg>
);

const HelpIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-6"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
    />

    <path d="M9.6 9A2.6 2.6 0 0 1 12 7.5C13.5 7.5 14.7 8.4 14.7 9.8C14.7 11.8 12 11.8 12 14" />

    <path d="M12 17H12.01" />
  </svg>
);

const CheckIcon = () => (
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
    <path d="M5 12L10 17L19 7" />
  </svg>
);

const ArrowIcon = () => (
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
    <path d="M5 12H19" />

    <path d="M14 7L19 12L14 17" />
  </svg>
);

/* =========================================================
   SUPPORT PAGE
   ========================================================= */

export default function SupportPage() {
  return (
    <>
      <PageMeta
        title="Support | Project Tracker"
        description="Project Tracker support, guidance and quick access to projects, Risk Register, account and administration settings."
      />

      <PageBreadcrumb
        pageTitle="Support"
      />

      <div className="w-full min-w-0 max-w-full space-y-5">
        {/* =================================================
            PAGE HEADER
            ================================================= */}

        <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

          <div className="flex flex-col gap-5 p-5 pt-6 sm:flex-row sm:items-center sm:justify-between lg:p-6 lg:pt-7">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Project Tracker
              </p>

              <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                Support Center
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Find guidance for Projects, Risk Register, Evidence, account
                access and administration.
              </p>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <HelpIcon />
            </div>
          </div>
        </section>

        {/* =================================================
            QUICK HELP
            ================================================= */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Help
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Open the relevant Project Tracker module directly.
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SupportCard
              title="Projects"
              description="View and manage project records and project information."
              to="/projects"
              action="Open Projects"
              icon={
                <ProjectIcon />
              }
            />

            <SupportCard
              title="Risk Register"
              description="Review risks, status, Before Evidence and After Evidence."
              to="/risks"
              action="Open Risk Register"
              icon={
                <RiskIcon />
              }
            />

            <SupportCard
              title="My Profile"
              description="Manage your name, contact information and profile picture."
              to="/profile"
              action="Open Profile"
              icon={
                <AccountIcon />
              }
            />

            <SupportCard
              title="Access Settings"
              description="Administrators can manage Roles and Permissions."
              to="/settings"
              action="Open Settings"
              icon={
                <SettingsIcon />
              }
            />
          </div>
        </section>

        {/* =================================================
            SUPPORT INFORMATION
            ================================================= */}

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          {/* ===============================================
              COMMON GUIDANCE
              =============================================== */}

          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="border-b border-gray-100 p-5 dark:border-gray-800 lg:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Guidance
              </p>

              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                Common Support Topics
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Basic checks for the most common Project Tracker workflows.
              </p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <SupportTopic
                title="Cannot access a module"
                description="Access to protected modules depends on your assigned Role and Permissions. Contact an administrator if a required module is unavailable."
              />

              <SupportTopic
                title="Risk cannot be marked Complete"
                description="A Risk requires at least one Before Evidence image and one After Evidence image before manual completion is allowed."
              />

              <SupportTopic
                title="Risk returned to In Progress"
                description="If required Before or After Evidence is removed from a completed Risk, its status may return to In Progress."
              />

              <SupportTopic
                title="Profile picture upload"
                description="Profile pictures support JPG, JPEG, PNG and WEBP files with a maximum size of 5 MB."
              />

              <SupportTopic
                title="Account status or Role"
                description="Role and account status cannot be changed from the personal profile form. These values are controlled through administration."
              />
            </div>
          </section>

          {/* ===============================================
              SUPPORT STATUS
              =============================================== */}

          <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
              Assistance
            </p>

            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              Need Additional Help?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              If a problem cannot be resolved using the guidance on this page,
              provide the administrator with the affected module, record and
              exact error message.
            </p>

            <div className="mt-5 space-y-3">
              <SupportRequirement
                text="Affected module or page"
              />

              <SupportRequirement
                text="Project or Risk reference"
              />

              <SupportRequirement
                text="Exact error message"
              />

              <SupportRequirement
                text="Screenshot when applicable"
              />

              <SupportRequirement
                text="Steps that produced the issue"
              />
            </div>

            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/30">
              <div className="flex items-start gap-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />

                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Support requests
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                    An in-app support ticket service is not configured yet.
                    Support requests should currently be handled through your
                    Project Tracker administrator.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SUPPORT CARD
   ========================================================= */

function SupportCard({
  title,
  description,
  to,
  action,
  icon,
}: SupportCardProps) {
  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-emerald-900">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500/15">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 flex-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
        {description}
      </p>

      <Link
        to={
          to
        }
        className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        {action}

        <ArrowIcon />
      </Link>
    </article>
  );
}

/* =========================================================
   SUPPORT TOPIC
   ========================================================= */

function SupportTopic({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0 p-5 lg:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckIcon />
        </span>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SUPPORT REQUIREMENT
   ========================================================= */

function SupportRequirement({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-950/30">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
        <CheckIcon />
      </span>

      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
        {text}
      </p>
    </div>
  );
}