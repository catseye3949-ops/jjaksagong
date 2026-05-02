import { Suspense } from "react";
import AuthShell from "../../components/AuthShell";
import LoginForm from "./LoginForm";

function LoginFallback() {
  return (
    <AuthShell title="로그인" subtitle="불러오는 중…">
      <p className="text-sm text-white/50">잠시만 기다려주세요.</p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
