import Link from "next/link";
import {
  buildServiceTags,
  getBadgeLabel,
  getCategoryPath,
  getCategoryTitle,
  getLocalizedField,
  getProfilePath,
  getLangConfig,
} from "../lib/nexa-data";

const AVAILABILITY_BADGE_CLASS = "rounded-full bg-mist px-3 py-1 text-xs font-semibold text-teal";

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
    <article className="flex h-full flex-col justify-between rounded-3xl bg-white p-8 shadow-soft">
      <div>
        <div className="space-y-3">
          <h3 className="font-display text-2xl font-bold">{profile.name}</h3>
          <div className="flex flex-wrap items-center gap-3">
            {profile.founder_professional ? (
              <span className="inline-flex items-center rounded-full border border-[#843088] bg-[#e6d6e7] px-3 py-1 text-sm font-semibold text-[#843088]">
                Profissional Fundadora
              </span>
            ) : null}
            <span className={`${AVAILABILITY_BADGE_CLASS} ml-auto`}>
              {badgeLabel}
            </span>
          </div>
          <p className="text-sm font-medium text-teal">{category}</p>
          <p className="text-sm font-semibold text-clay">{roleTitle}</p>
        </div>
        <p className="mt-4 leading-7 text-charcoal/75">{shortBio}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-charcoal/75">
          {serviceTags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-charcoal/15 bg-ivory px-3 py-2">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <Link href={getProfilePath(profile.slug, lang)} className="mt-6 inline-block text-sm font-semibold text-teal">
        {ui.cardProfileCta}
      </Link>
    </article>
  );
}
