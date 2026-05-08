import Link from "next/link";

export function LegalPage({ ui, page }) {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Nexa</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">{page.heading}</h1>
          <p className="mt-6 text-lg leading-8 text-charcoal/75">{page.intro}</p>
        </div>
        <div className="mt-12 space-y-6">
          {page.sections.map((section) => (
            <section key={section.title} className="rounded-3xl bg-white p-8 shadow-soft">
              <h2 className="font-display text-2xl font-bold">{section.title}</h2>
              <div className="mt-5 space-y-4">
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="leading-8 text-charcoal/75">
                    {paragraph}
                  </p>
                ))}
                {section.items?.length ? (
                  <ul className="space-y-3 text-sm leading-7 text-charcoal/75">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </div>
        <Link
          href={ui.homePath}
          className="mt-10 inline-flex rounded-2xl border border-charcoal/15 bg-white px-5 py-3 text-sm font-semibold text-charcoal shadow-soft transition-colors hover:border-teal hover:text-teal"
        >
          {ui.backToHome}
        </Link>
      </section>
    </main>
  );
}
