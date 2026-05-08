import { LegalPage } from "../../../components/legal-page";
import { getCurrentLang, getLangConfig } from "../../../lib/nexa-data";

export function generateMetadata({ params }) {
  const lang = getCurrentLang(params.lang);
  const page = getLangConfig(lang).legal.terms;
  const metadata = {
    title: page.title,
    description: page.description,
  };
  if (page.robots) metadata.robots = page.robots;
  return metadata;
}

export default function TermsOfUsePage({ params }) {
  const lang = getCurrentLang(params.lang);
  const ui = getLangConfig(lang);
  return <LegalPage ui={ui} page={ui.legal.terms} />;
}
