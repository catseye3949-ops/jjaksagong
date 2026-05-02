import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] px-4 py-16 pt-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[360px] w-[360px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[20%] h-[320px] w-[320px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <section className="relative mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-white/8 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-6 text-white/65">{subtitle}</p>
        ) : null}
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
