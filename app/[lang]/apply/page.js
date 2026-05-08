import { ApplicationForm } from "../../../components/forms";
import { getCurrentLang, getLangConfig } from "../../../lib/nexa-data";

export function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const metadata = {
    title: ui.applyPage.title,
    description: ui.applyPage.description,
  };
  if (lang === "en") metadata.robots = ui.robots;
  return metadata;
}

export default function ApplyPage({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.applyPage.eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{ui.applyPage.heading}</h1>
            <p className="mt-5 leading-8 text-charcoal/75">{ui.applyPage.body}</p>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-charcoal/75">
              {ui.applyPage.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
          <section className="rounded-3xl bg-white p-8 shadow-soft" aria-labelledby="apply-form-title">
            <h2 id="apply-form-title" className="font-display text-2xl font-bold">
              {ui.applyPage.formTitle}
            </h2>
            <ApplicationForm lang={lang} ui={ui} source="apply" withExtraFields />
          </section>
        </div>
      </section>
    </main>
  );
}
