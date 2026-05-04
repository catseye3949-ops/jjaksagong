import type { PurchasedReport } from "./domain/user";

export function buildPurchasedReportResultHref(
  report: PurchasedReport,
): string {
  const q = new URLSearchParams();
  q.set("name", report.name);
  q.set("birthdate", report.birth);
  if (report.birthtime) q.set("birthtime", report.birthtime);
  q.set("gender", report.gender);
  q.set("reportId", report.id);
  return `/result?${q.toString()}`;
}
