import Link from "next/link";

export function AboutPage({ ui, page }) {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{page.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{page.heading}</h1>
          <p className="mt-6 text-lg leading-8 text-charcoal/75">{page.intro}</p>
        </div>

        <section className="mt-12 rounded-[2rem] bg-white p-8 shadow-soft lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{page.manifestoEyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold">{page.manifestoTitle}</h2>
          <div className="mt-8 space-y-5">
            {page.manifestoParagraphs.map((paragraph) => (
              <p key={paragraph} className="max-w-4xl text-lg leading-8 text-charcoal/75">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] bg-clay px-8 py-10 text-white shadow-soft lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/75">{page.ctaEyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold">{page.ctaTitle}</h2>
          <p className="mt-5 max-w-3xl leading-8 text-white/85">{page.ctaBody}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={ui.professionalsPath}
              className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-semibold text-clay shadow-soft"
            >
              {page.primaryCta}
            </Link>
            <Link
              href={ui.applyPath}
              className="rounded-2xl border border-white/30 px-6 py-4 text-center text-sm font-semibold text-white"
            >
              {page.secondaryCta}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
