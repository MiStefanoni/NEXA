import { AboutPage } from "../../../components/about-page";
import { getCurrentLang, getLangConfig } from "../../../lib/nexa-data";

export function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const page = getLangConfig(lang).aboutPage;
  const metadata = {
    title: page.title,
    description: page.description,
  };
  if (page.robots) metadata.robots = page.robots;
  return metadata;
}

export default function AboutRoutePage({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  return <AboutPage ui={ui} page={ui.aboutPage} />;
}
