import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";

/* =========================================================
   USER PROFILE PAGE
   ========================================================= */

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="My Profile | Project Tracker"
        description="View and manage your Project Tracker account profile, contact information and account details."
      />

      <PageBreadcrumb
        pageTitle="My Profile"
      />

      <div className="w-full min-w-0 max-w-full">
        {/* =================================================
            PAGE HEADER
            ================================================= */}

        <div className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="h-1 w-full bg-emerald-500" />

          <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                Project Tracker
              </p>

              <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                My Profile
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                Manage your personal information, profile photo and account
                details.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
              <span className="size-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Account Profile
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            PROFILE CONTENT
            ================================================= */}

        <div className="space-y-5">
          <UserMetaCard />

          <UserInfoCard />

          <UserAddressCard />
        </div>
      </div>
    </>
  );
}