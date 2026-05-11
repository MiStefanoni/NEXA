import { notFound } from "next/navigation";
import { ProfilePage } from "../../../../components/profile-page";
import { getCurrentLang, getLangConfig, getLocalizedField } from "../../../../lib/nexa-data";
import { getProfessionals } from "../../../../lib/nexa-server";

export async function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const profile = (await getProfessionals()).find((item) => item.slug === params.slug);

  if (!profile) {
    return {
      title: ui.profileNotFoundTitle,
      description: ui.profileNotFoundText,
    };
  }

  const roleTitle = getLocalizedField(profile, "role_title", lang, ui.profileFallback);
  const metadata = {
    title: `${profile.name} | Nexa`,
    description: `${profile.name} | ${roleTitle} | Nexa`,
  };
  if (lang === "en") metadata.robots = ui.robots;
  return metadata;
}

export default async function ProfileRoute({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  const profile = (await getProfessionals()).find((item) => item.slug === params.slug);

  if (!profile) {
    notFound();
  }

  return <ProfilePage profile={profile} lang={lang} ui={ui} />;
}
