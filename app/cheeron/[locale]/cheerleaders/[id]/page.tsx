import { getCheerleaderById } from "@/data/cheerleaders";
import { isSupportedLocale, type Locale, TEXT } from "@/lib/i18n";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type CheerleaderDetailPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

type RepresentativeVideo = {
  id: number;
  title: string;
  channel: string;
  views: string;
};

function getRepresentativeVideos(name: string): RepresentativeVideo[] {
  return [
    { id: 1, title: `${name} 홈 경기 오프닝 응원 직캠`, channel: "Cheeron Highlights", views: "8.2만" },
    { id: 2, title: `${name} 7회 클린업 타임 응원`, channel: "K-Fandom Cam", views: "6.7만" },
    { id: 3, title: `${name} 원정 경기 베스트 모먼트`, channel: "Stadium Archive", views: "5.1만" },
  ];
}

export default async function CheerleaderDetailPage({ params }: CheerleaderDetailPageProps) {
  const { locale, id } = await params;

  if (!isSupportedLocale(locale)) {
    redirect("/cheeron/ko");
  }

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    notFound();
  }

  const cheerleader = getCheerleaderById(numericId);
  if (!cheerleader) {
    notFound();
  }

  const text = TEXT[locale as Locale];
  const videos = getRepresentativeVideos(cheerleader.name);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={`/cheeron/${locale}`}
            className="inline-flex rounded-lg border border-white/15 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:border-fuchsia-400 hover:text-fuchsia-200"
          >
            {text.nav.logo}
          </Link>
        </div>

        <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-6">
          <div className="mb-4 aspect-[16/9] rounded-xl bg-gradient-to-br from-rose-500/40 via-fuchsia-500/30 to-purple-600/40" />
          <div className="mb-2 inline-flex items-center rounded-full bg-rose-500/20 px-2 py-1 text-xs font-bold text-rose-200">
            #{cheerleader.rank} {text.trending.rankBadgeSuffix}
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">{cheerleader.name}</h1>
          <p className="mt-1 text-sm text-fuchsia-200">{cheerleader.team}</p>
          <p className="mt-3 text-sm text-zinc-300">{cheerleader.intro}</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-zinc-800/70 p-3">
            <p className="text-xs text-zinc-400">Instagram</p>
            <p className="mt-1 text-sm text-zinc-200">@{cheerleader.name.replace(/\s+/g, "").toLowerCase()}</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold">대표 직캠</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
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

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:p-6">
          <h2 className="mb-4 text-xl font-bold">{text.fanSupport.title}</h2>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {text.fanSupport.cta}
          </button>
        </section>
      </div>
    </main>
  );
}
