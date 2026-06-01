import { todayGames } from "@/data/games";
import type { TextDictionary } from "@/lib/i18n";

type TodayGamesSectionProps = {
  text: TextDictionary;
};

export default function TodayGamesSection({ text }: TodayGamesSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold">{text.games.title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {todayGames.map((game) => (
          <article key={game.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-400">{game.stadium}</p>
            <h3 className="mt-1 text-lg font-semibold">{game.matchup}</h3>
            <p className="mt-1 text-sm text-rose-300">
              {text.games.timeLabel}: {game.time}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {game.expectedCheerleaders.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2.5 py-1 text-xs text-fuchsia-200"
                >
                  {name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
