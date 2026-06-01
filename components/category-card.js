import Link from "next/link";
import { Card } from "./design-system/card";
import { getCategoryMeta, getCategoryPath, getLangConfig } from "../lib/nexa-data";

export function CategoryCard({ slug, lang }) {
  const ui = getLangConfig(lang);
  const meta = getCategoryMeta(slug, lang);

  return (
    <Card className="flex h-full flex-col justify-between p-7">
      <div>
        <h3 className="font-display text-2xl font-bold">{meta.title}</h3>
        <p className="mt-3 leading-7 text-charcoal/75">{meta.description}</p>
      </div>
      <Link href={getCategoryPath(slug, lang)} className="mt-6 inline-flex items-center text-sm font-semibold text-teal">
        {ui.categoriesPage.cta}
      </Link>
    </Card>
  );
}
