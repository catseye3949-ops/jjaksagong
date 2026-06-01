import type { TextDictionary } from "@/lib/i18n";

type HeroSectionProps = {
  text: TextDictionary;
};

export default function HeroSection({ text }: HeroSectionProps) {
  return (
    <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-700/30 via-rose-700/20 to-violet-700/30 p-6 sm:p-8">
      <h1 className="text-3xl font-black sm:text-4xl">{text.hero.title}</h1>
      <p className="mt-3 max-w-2xl text-sm text-zinc-200 sm:text-base">
        {text.hero.subtitle}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder={text.hero.searchPlaceholder}
          className="w-full rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-sm placeholder:text-zinc-400 focus:border-fuchsia-400 focus:outline-none"
        />
        <button
          type="button"
          className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          {text.hero.cta}
        </button>
      </div>
    </section>
  );
}
