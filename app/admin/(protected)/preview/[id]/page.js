import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfilePage } from "../../../../../components/profile-page";
import { getApplicationRecord } from "../../../../../lib/admin-store";

export const metadata = { title: "Pré-visualização do perfil | Nexa Admin" };

export default async function AdminProfilePreviewPage({ params, searchParams }) {
  const record = await getApplicationRecord(Number(params.id));
  if (!record) notFound();
  const profile = searchParams?.update === "1" && record.profileUpdate?.profile ? record.profileUpdate.profile : record.profile;

  return (
    <main className="min-h-screen bg-ivory">
      <div className="border-b border-charcoal/10 bg-nexa_nude px-6 py-4 text-center text-sm font-semibold text-charcoal">
        Pré-visualização administrativa — este perfil não será publicado até a ação “Publicar perfil”.{" "}
        <Link href="/admin" className="text-nexa_orange hover:underline">Voltar ao Admin</Link>
      </div>
      <ProfilePage profile={profile} lang="pt" />
    </main>
  );
}
