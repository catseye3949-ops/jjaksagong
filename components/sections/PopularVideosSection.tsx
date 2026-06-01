import { popularFancams } from "@/data/videos";
import type { TextDictionary } from "@/lib/i18n";

type PopularVideosSectionProps = {
  text: TextDictionary;
};

export default function PopularVideosSection({ text }: PopularVideosSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-xl font-bold">{text.videos.title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {popularFancams.map((video) => (
          <article key={video.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="mb-3 aspect-video rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800" />
            <h3 className="text-sm font-semibold sm:text-base">{video.title}</h3>
            <p className="mt-1 text-xs text-zinc-400">{video.channel}</p>
            <p className="mt-1 text-xs text-zinc-300">
              {text.videos.viewsLabel} {video.views}
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:border-fuchsia-400 hover:text-fuchsia-200"
            >
              {text.videos.watchButton}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
