import Image from "next/image";
import { ApplicationForm } from "../../components/forms";
import { CategoryCard } from "../../components/category-card";
import { FeaturedProfiles } from "../../components/featured-profiles";
import { CATEGORY_ORDER, getCurrentLang, getLangConfig } from "../../lib/nexa-data";
import { getProfessionals } from "../../lib/nexa-server";

export function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const metadata = {
    title: ui.home.title,
    description: ui.home.description,
    alternates: {
      languages: {
        "pt-BR": "/pt/index.html",
        "x-default": "/pt/index.html",
      },
    },
    icons: {
      apple: "/Favicon/apple-touch-icon.png",
      icon: [
        { url: "/Favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/Favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      shortcut: "/Favicon/favicon.ico",
    },
  };

  if (lang === "en") {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

export default async function HomePage({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const profiles = await getProfessionals();

  return (
    <main id="top">
      <section className="mx-auto flex min-h-[85vh] max-w-7xl items-center px-6 pb-16 pt-8 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="grid w-full items-end gap-12 lg:grid-cols-[1fr_minmax(0,45vw)] lg:gap-16">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.home.eyebrow}</p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{ui.home.heading}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-charcoal/75">{ui.home.body}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href={ui.professionalsPath} className="rounded-2xl bg-clay px-6 py-4 text-center text-sm font-semibold text-white shadow-soft hover:bg-clay/90">
                {ui.home.primaryCta}
              </a>
              <a href={ui.applyPath} className="rounded-2xl border border-charcoal/15 bg-white px-6 py-4 text-center text-sm font-semibold text-charcoal shadow-soft hover:border-teal hover:text-teal">
                {ui.home.secondaryCta}
              </a>
            </div>
          </div>
          <div className="flex items-end justify-center lg:justify-end">
            <Image src="/Women.png" alt={ui.home.heroAlt} width={962} height={1080} className="w-full max-w-md self-end object-contain lg:max-w-none" priority />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.home.howEyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{ui.home.howTitle}</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {ui.home.howSteps.map((step) => (
            <article key={step.title} className="rounded-3xl bg-white p-8 shadow-soft">
              <p className="text-sm font-semibold text-clay">{step.label}</p>
              <h3 className="mt-4 font-display text-2xl font-bold">{step.title}</h3>
              <p className="mt-4 leading-7 text-charcoal/75">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.home.categoriesEyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{ui.home.categoriesTitle}</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {CATEGORY_ORDER.map((slug) => (
            <CategoryCard key={slug} slug={slug} lang={lang} />
          ))}
        </div>
      </section>

      <section id="professionals" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.home.featuredEyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{ui.home.featuredTitle}</h2>
        </div>
        <FeaturedProfiles profiles={profiles} lang={lang} />
      </section>

      <section id="join" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.home.joinEyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{ui.home.joinTitle}</h2>
            <p className="mt-5 leading-8 text-charcoal/75">{ui.home.joinBody}</p>
            {ui.home.joinBullets?.length ? (
              <ul className="mt-6 space-y-4 text-sm leading-7 text-charcoal/75">
                {ui.home.joinBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <section className="rounded-3xl bg-white p-8 shadow-soft" aria-labelledby="application-form-title">
            <h3 id="application-form-title" className="font-display text-2xl font-bold">
              {ui.home.applyTitle}
            </h3>
            <p className="mt-3 leading-8 text-charcoal/75">{ui.home.applyBody}</p>
            <ApplicationForm lang={lang} ui={ui} source="home" />
          </section>
        </div>
      </section>
    </main>
  );
}
