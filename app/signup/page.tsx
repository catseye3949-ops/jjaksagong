import { Suspense } from "react";
import AuthShell from "../../components/AuthShell";
import SignupForm from "./SignupForm";

function SignupFallback() {
  return (
    <AuthShell title="회원가입" subtitle="불러오는 중…">
      <p className="text-sm text-white/50">잠시만 기다려주세요.</p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}
