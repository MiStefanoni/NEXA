import { notFound } from "next/navigation";
import { AppShell } from "../../components/app-shell";
import { getCurrentLang, getLangConfig } from "../../lib/nexa-data";

export default function LangLayout({ children, params }) {
  const lang = getCurrentLang(params.lang);
  if (lang !== params.lang) {
    notFound();
  }

  const ui = getLangConfig(lang);
  return <AppShell lang={lang} ui={ui}>{children}</AppShell>;
}
