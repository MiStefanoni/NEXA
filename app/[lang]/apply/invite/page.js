import { InviteApplicationPage } from "../../../../components/invite-application-page";
import { getCurrentLang } from "../../../../lib/nexa-data";

export const metadata = {
  title: "Convite de candidatura | Nexa",
  description: "Formulário privado de candidatura profissional da Nexa.",
};

export default function InviteApplyPage({ params }) {
  getCurrentLang(params.lang);
  return <InviteApplicationPage />;
}
