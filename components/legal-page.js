import { Button } from "./design-system/button";
import { Card } from "./design-system/card";
import { SectionHeading } from "./design-system/section-heading";

export function LegalPage({ ui, page }) {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
        <SectionHeading eyebrow="Nexa" title={page.heading} body={page.intro} />
        <div className="mt-12 space-y-6">
          {page.sections.map((section) => (
            <Card key={section.title}>
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
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <Button href={ui.homePath} variant="secondary">
            {ui.backToHome}
          </Button>
        </div>
      </section>
    </main>
  );
}
