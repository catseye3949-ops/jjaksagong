"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type ReportEmailReceiveButtonProps = {
  reportId: string;
  defaultEmail: string;
};

export default function ReportEmailReceiveButton({
  reportId,
  defaultEmail,
}: ReportEmailReceiveButtonProps) {
  const dialogTitleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{
    kind: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setEmail(defaultEmail);
  }, [open, defaultEmail]);

  const close = useCallback(() => {
    setOpen(false);
    setBanner(null);
    setBusy(false);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBanner(null);
      const trimmed = email.trim();
      if (!trimmed) {
        setBanner({ kind: "error", text: "이메일을 입력해 주세요." });
        return;
      }
      setBusy(true);
      try {
        const res = await fetch("/api/reports/email", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId, email: trimmed }),
        });
        if (res.status === 401) {
          setBanner({
            kind: "info",
            text: "보안 세션이 없거나 만료되었어요. 로그아웃 후 다시 로그인한 뒤 시도해 주세요.",
          });
          return;
        }
        if (!res.ok) {
          setBanner({
            kind: "error",
            text: "이메일 발송에 실패했어요. 잠시 후 다시 시도해주세요.",
          });
          return;
        }
        setBanner({
          kind: "success",
          text: "입력하신 이메일로 리포트를 보냈어요.",
        });
      } catch {
        setBanner({
          kind: "error",
          text: "이메일 발송에 실패했어요. 잠시 후 다시 시도해주세요.",
        });
      } finally {
        setBusy(false);
      }
    },
    [email, reportId],
  );

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(ev) => {
              if (ev.target === ev.currentTarget) close();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              className="flex max-h-[85vh] min-h-0 w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#121528] text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            >
              <form
                onSubmit={onSubmit}
                className="flex min-h-0 max-h-full flex-1 flex-col overflow-hidden"
              >
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6">
                  <h2
                    id={dialogTitleId}
                    className="text-lg font-semibold text-white"
                  >
                    리포트 이메일로 받기
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    받을 이메일 주소를 입력한 뒤 보내기를 눌러 주세요.
                  </p>

                  <label className="mt-5 block text-xs font-medium text-white/50">
                    이메일
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-fuchsia-400/40 focus:ring-2"
                      placeholder="you@example.com"
                      disabled={busy}
                    />
                  </label>

                  {banner ? (
                    <p
                      className={[
                        "mt-4 break-words text-sm leading-relaxed",
                        banner.kind === "success"
                          ? "text-emerald-300/95"
                          : banner.kind === "info"
                            ? "text-amber-200/95"
                            : "text-rose-300/95",
                      ].join(" ")}
                    >
                      {banner.text}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0 border-t border-white/10 px-6 pb-6 pt-5">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
                      disabled={busy}
                    >
                      닫기
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(217,70,239,0.3)] transition hover:opacity-95 disabled:opacity-50"
                    >
                      {busy ? "보내는 중…" : "보내기"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border-t border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-medium text-fuchsia-100/95 transition hover:bg-white/[0.07]"
      >
        리포트 이메일로 받기
      </button>
      {modal}
    </>
  );
}
