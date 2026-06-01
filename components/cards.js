import Link from "next/link";
import { Badge } from "./design-system/badge";
import { Card } from "./design-system/card";
import {
  buildServiceTags,
  getBadgeLabel,
  getCategoryTitle,
  getLocalizedField,
  getProfilePath,
  getLangConfig,
} from "../lib/nexa-data";

export function CategoryCard({ slug, lang }) {
  const ui = getLangConfig(lang);
  const meta = getCategoryTitle({ category_slug: slug }, lang)
    ? null
    : null;
  return meta;
}

export function ProfessionalCard({ profile, lang }) {
  const ui = getLangConfig(lang);
  const category = getCategoryTitle(profile, lang);
  const roleTitle = getLocalizedField(profile, "role_title", lang, ui.profileFallback);
  const shortBio = getLocalizedField(profile, "short_bio", lang, ui.profileFallback);
  const badgeLabel = getBadgeLabel(profile, lang);
  const serviceTags = buildServiceTags(profile, lang);

  return (
    <Card className="flex h-full flex-col justify-between">
      <div>
        <div className="space-y-3">
          <h3 className="font-display text-2xl font-bold">{profile.name}</h3>
          <div className="flex flex-wrap items-center gap-3">
            {profile.founder_professional ? (
              <Badge variant="founder" size="md">
                Profissional Fundadora
              </Badge>
            ) : null}
            <Badge variant="warm" className="ml-auto">
              {badgeLabel}
            </Badge>
          </div>
          <p className="text-sm font-medium text-teal">{category}</p>
          <p className="text-sm font-semibold text-clay">{roleTitle}</p>
        </div>
        <p className="mt-4 leading-7 text-charcoal/75">{shortBio}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-charcoal/75">
          {serviceTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="neutral" className="px-3 py-2">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <Link href={getProfilePath(profile.slug, lang)} className="mt-6 inline-block text-sm font-semibold text-teal">
        {ui.cardProfileCta}
      </Link>
    </Card>
  );
}
