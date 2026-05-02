import { Suspense } from "react";
import AuthShell from "../../components/AuthShell";
import CheckoutClient from "./CheckoutClient";

function CheckoutFallback() {
  return (
    <AuthShell title="결제" subtitle="불러오는 중…">
      <p className="text-sm text-white/50">잠시만 기다려주세요.</p>
    </AuthShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutClient />
    </Suspense>
  );
}
