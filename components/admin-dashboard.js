"use client";

import { useEffect, useState } from "react";
import { ProfileQuestionnaireFields } from "./profile-questionnaire-fields";

const STATUS_LABELS = {
  pending: "Pendências",
  approved: "Aprovadas",
  rejected: "Rejeitadas",
};

function formatDate(value) {
  if (!value) return "Agora";
  return new Date(value).toLocaleString("pt-BR");
}

function StatusList({ title, records, activeId, onSelect, selectable = false, selectedIds = new Set(), onToggleSelect, onDeleteSelected, deleting = false }) {
  const selectedCount = records.filter((record) => selectedIds.has(record.id)).length;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className="text-sm text-charcoal/60">{records.length} registro(s)</p>
        </div>
        {selectable ? (
          <button
            type="button"
            disabled={!selectedCount || deleting}
            onClick={onDeleteSelected}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            Excluir selecionadas
          </button>
        ) : null}
      </div>
      <div className="space-y-3">
        {records.length ? (
          records.map((record) => (
            <div
              key={record.id}
              className={`rounded-2xl border p-4 transition-colors ${
                activeId === record.id ? "border-teal bg-mist" : "border-charcoal/10 bg-ivory"
              }`}
            >
              <div className="flex items-start gap-3">
                {selectable ? (
                  <label className="mt-1 inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(record.id)}
                      onChange={(event) => onToggleSelect(record.id, event.target.checked)}
                      className="h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal"
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => onSelect(record.id)}
                  className="flex-1 text-left"
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
              </div>
            </div>
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
  const [deleting, setDeleting] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [editorState, setEditorState] = useState(null);
  const [selectedRejectedIds, setSelectedRejectedIds] = useState([]);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    expiresInDays: "7",
  });

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
      } else {
        setEditorState(null);
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
      return;
    }

    const fallback = lists[activeStatus]?.[0] || lists.pending?.[0] || lists.approved?.[0] || lists.rejected?.[0] || null;
    setSelectedRecord(fallback);
    setEditorState(fallback);
  }, [dashboard, activeStatus, selectedRecord]);

  useEffect(() => {
    const rejectedIds = new Set(lists.rejected.map((record) => record.id));
    setSelectedRejectedIds((current) => current.filter((id) => rejectedIds.has(id)));
  }, [dashboard.rejected]);

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

  function updateApplicantField(key, value) {
    setEditorState((current) => ({
      ...current,
      applicant: {
        ...current.applicant,
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

  async function handleSendInvite(event) {
    event.preventDefault();

    setFeedback("");
    setError(false);
    setSendingInvite(true);

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar o convite.");
      }

      setInviteForm({ name: "", email: "", expiresInDays: "7" });
      await fetchDashboard();
      setFeedback("Convite enviado com sucesso.");
    } catch (submissionError) {
      setError(true);
      setFeedback(submissionError.message || "Não foi possível enviar o convite.");
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleRevokeInvite(inviteId) {
    setFeedback("");
    setError(false);

    try {
      const response = await fetch("/api/admin/invites/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível revogar o convite.");
      }

      await fetchDashboard();
      setFeedback("Convite revogado com sucesso.");
    } catch (submissionError) {
      setError(true);
      setFeedback(submissionError.message || "Não foi possível revogar o convite.");
    }
  }

  function handleRejectedSelection(id, checked) {
    setSelectedRejectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((value) => value !== id);
    });
  }

  async function handleDeleteRejected() {
    if (!selectedRejectedIds.length) return;

    setFeedback("");
    setError(false);
    setDeleting(true);

    try {
      const response = await fetch("/api/admin/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedRejectedIds }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível excluir os registros selecionados.");
      }

      await fetchDashboard();
      setSelectedRejectedIds([]);
      setFeedback(`${result.deleted || 0} registro(s) rejeitado(s) excluído(s).`);
    } catch (submissionError) {
      setError(true);
      setFeedback(submissionError.message || "Não foi possível excluir os registros selecionados.");
    } finally {
      setDeleting(false);
    }
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

        {dashboard.dbConfigured ? (
        <section className="mt-8 grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2rem] bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Convites</p>
            <h2 className="mt-3 font-display text-2xl font-bold">Enviar convite de candidatura</h2>
            <form className="mt-6 grid gap-4" onSubmit={handleSendInvite}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-charcoal/80">Nome</span>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(event) => setInviteForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal"
                  placeholder="Opcional"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-charcoal/80">Email</span>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal"
                  placeholder="nome@exemplo.com"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-charcoal/80">Expiração</span>
                <select
                  value={inviteForm.expiresInDays}
                  onChange={(event) => setInviteForm((current) => ({ ...current, expiresInDays: event.target.value }))}
                  className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal"
                >
                  <option value="3">3 dias</option>
                  <option value="7">7 dias</option>
                  <option value="14">14 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={sendingInvite}
                className="rounded-2xl bg-clay px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-clay/90 disabled:opacity-60"
              >
                {sendingInvite ? "Enviando..." : "Enviar convite"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white p-8 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Convites enviados</p>
                <h2 className="mt-3 font-display text-2xl font-bold">Links privados ativos e históricos</h2>
              </div>
              <p className="text-sm text-charcoal/60">{(dashboard.invites || []).length} convite(s)</p>
            </div>
            <div className="mt-6 space-y-4">
              {(dashboard.invites || []).length ? (
                dashboard.invites.map((invite) => (
                  <article key={invite.id} className="rounded-3xl border border-charcoal/10 bg-ivory p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="font-semibold text-charcoal">{invite.name || "Sem nome"}</p>
                        <p className="text-sm text-charcoal/70">{invite.email}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-charcoal/65">
                          <span>Status: {invite.status}</span>
                          <span>Criado em {formatDate(invite.created_at)}</span>
                          <span>Expira em {formatDate(invite.expires_at)}</span>
                          {invite.used_at ? <span>Usado em {formatDate(invite.used_at)}</span> : null}
                        </div>
                      </div>
                      {invite.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-soft"
                        >
                          Revogar
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-charcoal/15 bg-ivory px-4 py-6 text-sm text-charcoal/65">
                  Nenhum convite enviado ainda.
                </div>
              )}
            </div>
          </section>
        </section>
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
            selectable={activeStatus === "rejected"}
            selectedIds={new Set(selectedRejectedIds)}
            onToggleSelect={handleRejectedSelection}
            onDeleteSelected={handleDeleteRejected}
            deleting={deleting}
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

                <ProfileQuestionnaireFields
                  record={editorState}
                  onApplicantFieldChange={updateApplicantField}
                  onProfileFieldChange={updateProfileField}
                  adminNotes={editorState.admin_notes}
                  onAdminNotesChange={(value) => updateRootField("admin_notes", value)}
                  showAdminNotes
                  showInternalFlags
                />
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
