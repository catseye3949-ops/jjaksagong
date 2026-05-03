import { Suspense } from "react";
import ReportsClient from "./ReportsClient";

function ReportsFallback() {
  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-24 text-center text-sm text-white/50">
      불러오는 중…
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsFallback />}>
      <ReportsClient />
    </Suspense>
  );
}
