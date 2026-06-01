import { kboTeams } from "@/data/teams";
import type { TextDictionary } from "@/lib/i18n";

type TeamGridSectionProps = {
  text: TextDictionary;
};

export default function TeamGridSection({ text }: TeamGridSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold">{text.teams.title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kboTeams.map((team) => (
          <button
            key={team}
            type="button"
            className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm hover:border-rose-400 hover:text-rose-200"
          >
            {team}
          </button>
        ))}
      </div>
    </section>
  );
}
