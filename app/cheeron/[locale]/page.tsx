import Navbar from "@/components/layout/Navbar";
import FanSupportSection from "@/components/sections/FanSupportSection";
import HeroSection from "@/components/sections/HeroSection";
import PopularVideosSection from "@/components/sections/PopularVideosSection";
import TeamGridSection from "@/components/sections/TeamGridSection";
import TodayGamesSection from "@/components/sections/TodayGamesSection";
import TrendingCheerleadersSection from "@/components/sections/TrendingCheerleadersSection";
import { isSupportedLocale, SUPPORTED_LOCALES, TEXT, type Locale } from "@/lib/i18n";
import { redirect } from "next/navigation";

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function CheeronLocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    redirect("/cheeron/ko");
  }

  const text = TEXT[locale as Locale];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Navbar text={text} />
        <HeroSection text={text} />
        <TrendingCheerleadersSection text={text} locale={locale} />
        <TodayGamesSection text={text} />
        <PopularVideosSection text={text} />
        <TeamGridSection text={text} />
        <FanSupportSection text={text} />
      </div>
    </main>
  );
}
