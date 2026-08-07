import PageMeta from "../../components/common/PageMeta";

import AuthLayout from "./AuthPageLayout";

import SignUpForm from "../../components/auth/SignUpForm";

/* =========================================================
   SIGN UP PAGE
   ========================================================= */

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sign Up | Project Tracker"
        description="Create a Project Tracker account to access project management, Risk Register, Evidence and electrical safety workflow features."
      />

      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}