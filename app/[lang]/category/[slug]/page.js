import { notFound } from "next/navigation";
import { CATEGORY_ORDER, getCategoryMeta, getCurrentLang, getLangConfig } from "../../../../lib/nexa-data";
import { ProfessionalCard } from "../../../../components/cards";
import { getProfessionals } from "../../../../lib/nexa-server";

export function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const meta = getCategoryMeta(params.slug, lang);
  if (!meta) return {};
  const ui = getLangConfig(lang);
  const metadata = {
    title: `${meta.title} | Nexa`,
    description: meta.pageDescription,
  };
  if (lang === "en") metadata.robots = ui.robots;
  return metadata;
}

export default function CategoryPage({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const slug = params.slug;

  if (!CATEGORY_ORDER.includes(slug)) {
    notFound();
  }

  const meta = getCategoryMeta(slug, lang);
  const profiles = getProfessionals().filter((profile) => profile.category_slug === slug);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{meta.title}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{meta.title}</h1>
          <p className="mt-6 text-lg leading-8 text-charcoal/75">{meta.pageDescription}</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <ProfessionalCard key={profile.slug} profile={profile} lang={lang} />
          ))}
        </div>
        {!profiles.length ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-base text-charcoal/75 shadow-soft">{ui.directoryEmpty}</div>
        ) : null}
      </section>
    </main>
  );
}
