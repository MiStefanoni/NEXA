import { ProfessionalsDirectory } from "../../../components/professionals-directory";
import { CATEGORY_ORDER, getCategoryMeta, getCurrentLang, getLangConfig } from "../../../lib/nexa-data";
import { getProfessionals } from "../../../lib/nexa-server";

export function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const metadata = {
    title: ui.professionalsPage.title,
    description: ui.professionalsPage.description,
  };
  if (lang === "en") metadata.robots = ui.robots;
  return metadata;
}

export default function ProfessionalsPage({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const profiles = getProfessionals();

  return (
    <main>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.professionalsPage.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{ui.professionalsPage.heading}</h1>
          <p className="mt-6 text-lg leading-8 text-charcoal/75">{ui.professionalsPage.body}</p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3 text-sm font-semibold">
          {CATEGORY_ORDER.map((slug) => (
            <a
              key={slug}
              href={`#${slug}`}
              className="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal"
            >
              {getCategoryMeta(slug, lang).title}
            </a>
          ))}
        </div>
        <ProfessionalsDirectory profiles={profiles} lang={lang} />
      </section>
    </main>
  );
}
