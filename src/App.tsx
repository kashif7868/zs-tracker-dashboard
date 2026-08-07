import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";

import Home from "./pages/Dashboard/Home";
import NotFound from "./pages/OtherPage/NotFound";

import ProjectsPage from "./pages/Projects/ProjectsPage";
import CreateProjectPage from "./pages/Projects/CreateProjectPage";
import ProjectDetailsPage from "./pages/Projects/ProjectDetailsPage";
import EditProjectPage from "./pages/Projects/EditProjectPage";

import RiskRegisterPage from "./pages/RiskRegister/RiskRegisterPage";
import CreateRiskPage from "./pages/RiskRegister/CreateRiskPage";
import RiskDetailsPage from "./pages/RiskRegister/RiskDetailsPage";

import EvidencePage from "./pages/Evidence/EvidencePage";

import DocumentsPage from "./pages/Documents/DocumentsPage";

import UsersPage from "./pages/Users/UsersPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import SupportPage from "./pages/Support/Support";
import UserProfiles from "./pages/UserProfiles";

import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import AppLayout from "./layout/AppLayout";

import {
  AuthProvider,
} from "./context/AuthContext";

/* =========================================================
   PLACEHOLDER PAGE
   ========================================================= */

type PlaceholderPageProps = {
  title: string;
  description: string;
};

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="w-full min-w-0 max-w-full">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />

        <p className="pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
          Project Tracker
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </section>
    </div>
  );
}

/* =========================================================
   APPLICATION
   ========================================================= */

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <AuthProvider>
        <Routes>
          {/* =================================================
              PUBLIC AUTH ROUTES
              ================================================= */}

          <Route
            path="/signin"
            element={<SignIn />}
          />

          <Route
            path="/signup"
            element={<SignUp />}
          />

          {/* =================================================
              PROTECTED ROUTES
              ================================================= */}

          <Route
            element={
              <ProtectedRoute />
            }
          >
            <Route
              element={
                <AppLayout />
              }
            >
              {/* =================================================
                  DASHBOARD
                  ================================================= */}

              <Route
                index
                element={<Home />}
              />

              <Route
                path="/dashboard"
                element={
                  <Navigate
                    to="/"
                    replace
                  />
                }
              />

              {/* =================================================
                  PROJECTS
                  ================================================= */}

              <Route
                path="/projects"
                element={
                  <ProjectsPage />
                }
              />

              <Route
                path="/projects/create"
                element={
                  <CreateProjectPage />
                }
              />

              <Route
                path="/projects/:projectId"
                element={
                  <ProjectDetailsPage />
                }
              />

              <Route
                path="/projects/:projectId/edit"
                element={
                  <EditProjectPage />
                }
              />

              {/* =================================================
                  RISK REGISTER
                  ================================================= */}

              <Route
                path="/risks"
                element={
                  <RiskRegisterPage />
                }
              />

              <Route
                path="/risks/create"
                element={
                  <CreateRiskPage />
                }
              />

              <Route
                path="/risks/:riskId"
                element={
                  <RiskDetailsPage />
                }
              />

              {/* =================================================
                  EVIDENCE
                  ================================================= */}

              <Route
                path="/evidence"
                element={
                  <EvidencePage />
                }
              />

              {/* =================================================
                  ACTION PLANS
                  ================================================= */}

              <Route
                path="/action-plans"
                element={
                  <PlaceholderPage
                    title="Action Plans"
                    description="Corrective-action management will be connected in a later module."
                  />
                }
              />

              {/* =================================================
                  TESTING AND CONTROLS
                  ================================================= */}

              <Route
                path="/testing-controls"
                element={
                  <PlaceholderPage
                    title="Testing & Controls"
                    description="Electrical testing and control records will be connected in a later module."
                  />
                }
              />

              {/* =================================================
                  DOCUMENTS & REPORTS
                  ================================================= */}

              <Route
                path="/documents"
                element={
                  <DocumentsPage />
                }
              />

              {/* =================================================
                  NOTIFICATIONS
                  ================================================= */}

              <Route
                path="/notifications"
                element={
                  <PlaceholderPage
                    title="Notifications"
                    description="Project and Risk notifications will be connected in a later module."
                  />
                }
              />

              {/* =================================================
                  USERS
                  ================================================= */}

              <Route
                path="/users"
                element={
                  <UsersPage />
                }
              />

              {/* =================================================
                  PROFILE
                  ================================================= */}

              <Route
                path="/profile"
                element={
                  <UserProfiles />
                }
              />

              {/* =================================================
                  SUPPORT
                  ================================================= */}

              <Route
                path="/support"
                element={
                  <SupportPage />
                }
              />

              {/* =================================================
                  SETTINGS

                  Roles and Permissions yahin manage hongi.
                  Separate Roles route nahi hai.
                  ================================================= */}

              <Route
                path="/settings"
                element={
                  <SettingsPage />
                }
              />
            </Route>
          </Route>

          {/* =================================================
              FALLBACK
              ================================================= */}

          <Route
            path="*"
            element={
              <NotFound />
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}