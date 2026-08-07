import PageMeta from "../../components/common/PageMeta";

import AuthLayout from "./AuthPageLayout";

import SignInForm from "../../components/auth/SignInForm";

/* =========================================================
   SIGN IN PAGE
   ========================================================= */

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Project Tracker"
        description="Sign in to Project Tracker to manage projects, Risk Register records, Evidence and electrical safety rectification progress."
      />

      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}