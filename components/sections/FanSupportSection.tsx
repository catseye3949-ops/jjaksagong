import { supportMessages } from "@/data/fanMessages";
import type { TextDictionary } from "@/lib/i18n";

type FanSupportSectionProps = {
  text: TextDictionary;
};

export default function FanSupportSection({ text }: FanSupportSectionProps) {
  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-zinc-900 p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-bold">{text.fanSupport.title}</h2>
      <div className="space-y-3">
        {supportMessages.map((msg) => (
          <article key={msg.id} className="rounded-xl border border-white/10 bg-zinc-800/60 p-3">
            <p className="text-xs text-fuchsia-200">{msg.author}</p>
            <p className="mt-1 text-sm text-zinc-200">{msg.text}</p>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 rounded-xl bg-gradient-to-r from-purple-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        {text.fanSupport.cta}
      </button>
    </section>
  );
}
