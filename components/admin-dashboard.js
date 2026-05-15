"use client";

import { CATEGORY_META, CATEGORY_ORDER } from "../lib/nexa-data";
import { useEffect, useState } from "react";

const STATUS_LABELS = {
  pending: "Pendências",
  approved: "Aprovadas",
  rejected: "Rejeitadas",
};

const SERVICE_DELIVERY_OPTIONS = [
  { value: "Remote", label: "Remoto" },
  { value: "Local", label: "Local" },
  { value: "Remote and Local", label: "Remoto e local" },
];
const REMOTE_OPTIONS = [
  { value: "Local", label: "Local" },
  { value: "Remote", label: "Remoto" },
  { value: "Remote and Local", label: "Remoto e local" },
];

function formatDate(value) {
  if (!value) return "Agora";
  return new Date(value).toLocaleString("pt-BR");
}

function TextField({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-charcoal/80">{label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal"
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, rows = 4, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-charcoal/80">{label}</span>
      <textarea
        value={value || ""}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-charcoal/80">{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal"
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FileField({ label, value, onChange }) {
  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-charcoal/80">{label}</span>
      <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-charcoal/20 bg-white px-4 py-5 text-sm font-semibold text-charcoal transition-colors hover:border-teal hover:text-teal">
        <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
        Escolher imagem
      </label>
      {value ? (
        <div className="mt-4 overflow-hidden rounded-3xl border border-charcoal/10 bg-white p-2 shadow-soft">
          <img src={value} alt="Pré-visualização da imagem de perfil" className="h-48 w-full rounded-[1.25rem] object-cover" />
        </div>
      ) : null}
    </div>
  );
}

function StatusList({ title, records, activeId, onSelect }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className="text-sm text-charcoal/60">{records.length} registro(s)</p>
        </div>
      </div>
      <div className="space-y-3">
        {records.length ? (
          records.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                activeId === record.id ? "border-teal bg-mist" : "border-charcoal/10 bg-ivory hover:border-teal"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-charcoal">{record.profile.name || record.applicant.name || "Sem nome"}</p>
                  <p className="mt-1 text-sm text-charcoal/65">{record.profile.category_pt || record.applicant.category || "Categoria pendente"}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-charcoal/70">
                  #{record.id}
                </span>
              </div>
              <p className="mt-3 text-sm text-charcoal/70">
                Atualizado em {formatDate(record.updated_at)}
              </p>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-charcoal/15 bg-ivory px-4 py-6 text-sm text-charcoal/65">
            Nenhum registro nesta área.
          </div>
        )}
      </div>
    </section>
  );
}

export function AdminDashboard({ initialData }) {
  const [dashboard, setDashboard] = useState(initialData);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorState, setEditorState] = useState(null);

  const lists = {
    pending: dashboard.pending || [],
    approved: dashboard.approved || [],
    rejected: dashboard.rejected || [],
  };

  useEffect(() => {
    if (!selectedRecord) {
      const first = lists[activeStatus]?.[0] || lists.pending?.[0] || lists.approved?.[0] || lists.rejected?.[0];
      if (first) {
        setSelectedRecord(first);
        setEditorState(first);
      }
      return;
    }

    const fresh =
      lists.pending.find((item) => item.id === selectedRecord.id) ||
      lists.approved.find((item) => item.id === selectedRecord.id) ||
      lists.rejected.find((item) => item.id === selectedRecord.id);

    if (fresh) {
      setSelectedRecord(fresh);
      setEditorState(fresh);
    }
  }, [dashboard, activeStatus, selectedRecord]);

  async function fetchDashboard() {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Falha ao carregar o dashboard.");
    }
    setDashboard(result.data);
    return result.data;
  }

  async function fetchRecord(id) {
    const response = await fetch(`/api/admin/applications/${id}`, { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Falha ao carregar o registro.");
    }
    setSelectedRecord(result.record);
    setEditorState(result.record);
  }

  function updateProfileField(key, value) {
    setEditorState((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value,
      },
    }));
  }

  function updateRootField(key, value) {
    setEditorState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave(status) {
    if (!editorState?.id) return;

    setFeedback("");
    setError(false);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/applications/${editorState.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          admin_notes: editorState.admin_notes,
          applicant: editorState.applicant,
          profile: editorState.profile,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível salvar.");
      }

      await fetchDashboard();
      setSelectedRecord(result.record);
      setEditorState(result.record);
      setActiveStatus(result.record.status);
      setFeedback(
        status === "approved"
          ? "Perfil aprovado e publicado imediatamente na Nexa."
          : status === "rejected"
            ? "Registro movido para a área de rejeitadas."
            : "Registro salvo em pendências.",
      );
    } catch (submissionError) {
      setError(true);
      setFeedback(submissionError.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateDraft() {
    setFeedback("");
    setError(false);
    try {
      const response = await fetch("/api/admin/applications", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível criar o rascunho.");
      }
      await fetchDashboard();
      setSelectedRecord(result.record);
      setEditorState(result.record);
      setActiveStatus("pending");
    } catch (submissionError) {
      setError(true);
      setFeedback(submissionError.message || "Não foi possível criar o rascunho.");
    }
  }

  async function handleImportLegacy() {
    setFeedback("");
    setError(false);
    try {
      const response = await fetch("/api/admin/bootstrap", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Falha ao importar perfis atuais.");
      }
      await fetchDashboard();
      setFeedback(`${result.imported} perfil(is) públicos importados para a base administrativa.`);
    } catch (submissionError) {
      setError(true);
      setFeedback(submissionError.message || "Falha ao importar perfis atuais.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const currentList = lists[activeStatus] || [];

  return (
    <main className="min-h-screen bg-ivory px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Nexa Admin</p>
              <h1 className="mt-3 font-display text-4xl font-bold">Gestão de candidaturas e perfis</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-charcoal/75">
                Revise aplicações, publique perfis aprovados imediatamente e mantenha o diretório profissional da Nexa sempre atualizado.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateDraft}
                className="rounded-2xl bg-clay px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-clay/90"
              >
                Novo perfil
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-charcoal/15 bg-white px-5 py-3 text-sm font-semibold text-charcoal shadow-soft hover:border-teal hover:text-teal"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        {!dashboard.dbConfigured ? (
          <section className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
            <h2 className="font-display text-2xl font-bold text-charcoal">Banco de dados ainda não configurado</h2>
            <p className="mt-4 leading-8 text-charcoal/75">
              Configure `DATABASE_URL`, `ADMIN_SESSION_SECRET` e `ADMIN_PASSWORD_HASH` ou `ADMIN_PASSWORD` para ativar o painel seguro, o fluxo de aprovação e a publicação instantânea no site público.
            </p>
          </section>
        ) : null}

        {dashboard.dbConfigured && !dashboard.approved.length && dashboard.legacyProfilesCount > 0 ? (
          <section className="mt-8 rounded-[2rem] border border-charcoal/10 bg-white p-8 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">Importar os perfis públicos atuais</h2>
                <p className="mt-3 max-w-3xl leading-8 text-charcoal/75">
                  A base administrativa ainda está vazia. Importe os perfis já publicados em `professionals.json` para começar a gerenciá-los dentro do novo fluxo em Next.js.
                </p>
              </div>
              <button
                type="button"
                onClick={handleImportLegacy}
                className="rounded-2xl bg-teal px-5 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-90"
              >
                Importar perfis atuais
              </button>
            </div>
          </section>
        ) : null}

        {feedback ? (
          <p className={`mt-8 rounded-3xl px-5 py-4 text-sm ${error ? "border border-red-200 bg-red-50 text-red-700" : "border border-charcoal/10 bg-white text-charcoal/75 shadow-soft"}`}>
            {feedback}
          </p>
        ) : null}

        <section className="mt-8 flex flex-wrap gap-3">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-soft transition-colors ${
                activeStatus === status
                  ? "border-teal bg-mist text-teal"
                  : "border-charcoal/15 bg-white text-charcoal hover:border-teal hover:text-teal"
              }`}
            >
              {label}
            </button>
          ))}
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.4fr]">
          <StatusList
            title={STATUS_LABELS[activeStatus]}
            records={currentList}
            activeId={selectedRecord?.id}
            onSelect={(id) => {
              setSelectedRecord(null);
              setEditorState(null);
              fetchRecord(id).catch((submissionError) => {
                setError(true);
                setFeedback(submissionError.message || "Falha ao abrir o registro.");
              });
            }}
          />

          <section className="rounded-[2rem] bg-white p-6 shadow-soft lg:p-8">
            {editorState ? (
              <>
                <div className="flex flex-col gap-5 border-b border-charcoal/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">
                      Registro #{editorState.id}
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold">
                      {editorState.profile.name || editorState.applicant.name || "Novo perfil"}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-charcoal/70">
                      Enviado em {formatDate(editorState.submitted_at)} • Status atual:{" "}
                      <span className="font-semibold">{STATUS_LABELS[editorState.status]}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave("pending")}
                      className="rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-sm font-semibold text-charcoal shadow-soft hover:border-teal hover:text-teal disabled:opacity-60"
                    >
                      Salvar em pendências
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave("rejected")}
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-soft disabled:opacity-60"
                    >
                      Rejeitar
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSave("approved")}
                      className="rounded-2xl bg-clay px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-clay/90 disabled:opacity-60"
                    >
                      Aprovar e publicar
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid gap-8">
                  <section className="rounded-3xl bg-ivory p-6">
                    <h3 className="font-display text-2xl font-bold">Dados de candidatura</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <TextField label="Nome enviado" value={editorState.applicant.name} onChange={(value) => updateRootField("applicant", { ...editorState.applicant, name: value })} />
                      <TextField label="Email enviado" value={editorState.applicant.email} onChange={(value) => updateRootField("applicant", { ...editorState.applicant, email: value })} />
                      <TextField label="Categoria enviada" value={editorState.applicant.category} onChange={(value) => updateRootField("applicant", { ...editorState.applicant, category: value })} />
                      <TextField label="Localização enviada" value={editorState.applicant.location} onChange={(value) => updateRootField("applicant", { ...editorState.applicant, location: value })} />
                    </div>
                    <div className="mt-4">
                      <TextareaField label="Descrição enviada" value={editorState.applicant.description} onChange={(value) => updateRootField("applicant", { ...editorState.applicant, description: value })} rows={4} />
                    </div>
                    <div className="mt-4">
                      <TextareaField label="Notas internas" value={editorState.admin_notes} onChange={(value) => updateRootField("admin_notes", value)} rows={4} placeholder="Ex.: aguardando portfólio, faltou revisar tradução, rejeitado por inconsistência de escopo." />
                    </div>
                  </section>

                  <section className="rounded-3xl bg-ivory p-6">
                    <h3 className="font-display text-2xl font-bold">Perfil público</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <TextField label="Nome" value={editorState.profile.name} onChange={(value) => updateProfileField("name", value)} />
                      <TextField label="Slug" value={editorState.profile.slug} onChange={(value) => updateProfileField("slug", value)} />
                      <SelectField
                        label="Categoria"
                        value={editorState.profile.category_slug}
                        onChange={(value) => updateProfileField("category_slug", value)}
                        options={CATEGORY_ORDER.map((slug) => ({ value: slug, label: CATEGORY_META[slug].pt.title }))}
                      />
                      <SelectField
                        label="Local ou remoto"
                        value={editorState.profile.remote_or_local}
                        onChange={(value) => updateProfileField("remote_or_local", value)}
                        options={REMOTE_OPTIONS}
                      />
                      <TextField label="Localização" value={editorState.profile.location} onChange={(value) => updateProfileField("location", value)} />
                      <TextField label="Idiomas" value={editorState.profile.languages} onChange={(value) => updateProfileField("languages", value)} placeholder="English, Portuguese" />
                      <TextField label="Email público" value={editorState.profile.email} onChange={(value) => updateProfileField("email", value)} type="email" />
                      <TextField label="Website" value={editorState.profile.website} onChange={(value) => updateProfileField("website", value)} placeholder="https://..." />
                      <TextField label="Label do website" value={editorState.profile.website_label} onChange={(value) => updateProfileField("website_label", value)} />
                      <TextField label="Link social" value={editorState.profile.social_link} onChange={(value) => updateProfileField("social_link", value)} placeholder="https://..." />
                      <TextField label="Label social" value={editorState.profile.social_label} onChange={(value) => updateProfileField("social_label", value)} />
                      <TextField label="URL da imagem" value={editorState.profile.profile_image} onChange={(value) => updateProfileField("profile_image", value)} placeholder="https://... ou deixe vazio para usar upload" />
                    </div>
                    <div className="mt-4">
                      <FileField label="Imagem de Perfil" value={editorState.profile.profile_image} onChange={(value) => updateProfileField("profile_image", value)} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-6 text-sm">
                      <label className="inline-flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(editorState.profile.verified)}
                          onChange={(event) => updateProfileField("verified", event.target.checked)}
                          className="h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal"
                        />
                        Perfil verificado
                      </label>
                      <label className="inline-flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(editorState.profile.featured)}
                          onChange={(event) => updateProfileField("featured", event.target.checked)}
                          className="h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal"
                        />
                        Destaque na home
                      </label>
                      <label className="inline-flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(editorState.profile.founder_professional)}
                          onChange={(event) => updateProfileField("founder_professional", event.target.checked)}
                          className="h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal"
                        />
                        Profissional fundadora
                      </label>
                    </div>
                  </section>

                  <section className="rounded-3xl bg-ivory p-6">
                    <h3 className="font-display text-2xl font-bold">Conteúdo em português</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <TextField label="Título profissional" value={editorState.profile.role_title_pt} onChange={(value) => updateProfileField("role_title_pt", value)} />
                      <TextField label="Foco de clientes" value={editorState.profile.client_focus_pt} onChange={(value) => updateProfileField("client_focus_pt", value)} />
                      <TextField label="Experiência" value={editorState.profile.experience_years} onChange={(value) => updateProfileField("experience_years", value)} placeholder="7+" />
                      <TextField label="Projetos entregues" value={editorState.profile.projects_delivered} onChange={(value) => updateProfileField("projects_delivered", value)} placeholder="65+" />
                    </div>
                    <div className="mt-4 grid gap-4">
                      <TextareaField label="Resumo curto" value={editorState.profile.short_bio_pt} onChange={(value) => updateProfileField("short_bio_pt", value)} rows={4} />
                      <TextareaField label="Sobre / biografia" value={editorState.profile.full_about_pt} onChange={(value) => updateProfileField("full_about_pt", value)} rows={6} />
                    </div>
                  </section>

                  {[1, 2, 3].map((index) => (
                    <section key={index} className="rounded-3xl bg-ivory p-6">
                      <h3 className="font-display text-2xl font-bold">Serviço {index}</h3>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <TextField label="Título PT" value={editorState.profile[`service_${index}_title_pt`]} onChange={(value) => updateProfileField(`service_${index}_title_pt`, value)} />
                        <SelectField
                          label="Formato"
                          value={editorState.profile[`service_${index}_delivery`]}
                          onChange={(value) => updateProfileField(`service_${index}_delivery`, value)}
                          options={SERVICE_DELIVERY_OPTIONS}
                        />
                      </div>
                      <div className="mt-4 grid gap-4">
                        <TextareaField label="Descrição PT" value={editorState.profile[`service_${index}_description_pt`]} onChange={(value) => updateProfileField(`service_${index}_description_pt`, value)} rows={4} />
                      </div>
                    </section>
                  ))}

                  {[1, 2, 3].map((index) => (
                    <section key={`portfolio-${index}`} className="rounded-3xl bg-ivory p-6">
                      <h3 className="font-display text-2xl font-bold">Portfólio {index}</h3>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <TextField label="Título PT" value={editorState.profile[`portfolio_${index}_title_pt`]} onChange={(value) => updateProfileField(`portfolio_${index}_title_pt`, value)} />
                        <TextField
                          label="Veja o projeto"
                          value={editorState.profile[`portfolio_${index}_url`]}
                          onChange={(value) => updateProfileField(`portfolio_${index}_url`, value)}
                          placeholder="https://..."
                          type="url"
                        />
                      </div>
                      <div className="mt-4 grid gap-4">
                        <TextareaField label="Descrição PT" value={editorState.profile[`portfolio_${index}_description_pt`]} onChange={(value) => updateProfileField(`portfolio_${index}_description_pt`, value)} rows={4} />
                      </div>
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center rounded-[2rem] border border-dashed border-charcoal/15 bg-ivory px-6 text-center text-charcoal/65">
                Selecione um registro para revisar, editar ou publicar.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
