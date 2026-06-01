import { todayPopularCheerleaders } from "@/data/cheerleaders";
import type { TextDictionary } from "@/lib/i18n";
import Link from "next/link";

type TrendingCheerleadersSectionProps = {
  text: TextDictionary;
  locale: string;
};

export default function TrendingCheerleadersSection({ text, locale }: TrendingCheerleadersSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold">{text.trending.title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {todayPopularCheerleaders.map((item) => (
          <Link
            key={item.id}
            href={`/cheeron/${locale}/cheerleaders/${item.id}`}
            className="rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <div className="mb-3 aspect-[16/9] rounded-xl bg-gradient-to-br from-rose-500/40 via-fuchsia-500/30 to-purple-600/40" />
            <div className="mb-2 inline-flex items-center rounded-full bg-rose-500/20 px-2 py-1 text-xs font-bold text-rose-200">
              #{item.rank} {text.trending.rankBadgeSuffix}
            </div>
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="mt-1 text-sm text-fuchsia-200">{item.team}</p>
            <p className="mt-2 text-sm text-zinc-300">{item.intro}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
