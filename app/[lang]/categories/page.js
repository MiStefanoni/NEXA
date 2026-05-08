import { CategoryCard } from "../../../components/category-card";
import { CATEGORY_ORDER, getCurrentLang, getLangConfig } from "../../../lib/nexa-data";

export function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const metadata = {
    title: ui.categoriesPage.title,
    description: ui.categoriesPage.description,
  };
  if (lang === "en") metadata.robots = ui.robots;
  return metadata;
}

export default function CategoriesPage({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.categoriesPage.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{ui.categoriesPage.heading}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-charcoal/75">{ui.categoriesPage.body}</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CATEGORY_ORDER.map((slug) => (
            <CategoryCard key={slug} slug={slug} lang={lang} />
          ))}
        </div>
      </section>
    </main>
  );
}
