import type { TextDictionary } from "@/lib/i18n";

type NavbarProps = {
  text: TextDictionary;
};

export default function Navbar({ text }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 mb-6 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur">
      <nav className="flex items-center justify-between px-4 py-3">
        <div className="text-xl font-extrabold tracking-tight text-fuchsia-300">{text.nav.logo}</div>
        <ul className="hidden items-center gap-5 text-sm text-zinc-300 md:flex">
          <li className="cursor-pointer hover:text-fuchsia-300">{text.nav.ranking}</li>
          <li className="cursor-pointer hover:text-fuchsia-300">{text.nav.todayGames}</li>
          <li className="cursor-pointer hover:text-fuchsia-300">{text.nav.videos}</li>
          <li className="cursor-pointer hover:text-fuchsia-300">{text.nav.teams}</li>
        </ul>
        <button
          type="button"
          aria-label={text.nav.search}
          className="rounded-lg border border-white/15 bg-zinc-800 px-3 py-1.5 text-sm hover:border-fuchsia-400 hover:text-fuchsia-200"
        >
          {text.nav.search}
        </button>
      </nav>
    </header>
  );
}
