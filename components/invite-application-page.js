"use client";

import { useEffect, useState } from "react";
import { ProfileQuestionnaireFields } from "./profile-questionnaire-fields";
import { createInviteApplicationDraft } from "../lib/admin-profile";
import { getInviteApplicationValidationErrors } from "../lib/application-validation";

function buildInviteDraft(invite) {
  return createInviteApplicationDraft({ name: invite?.name || "", email: invite?.email || "" });
}

export function InviteApplicationPage() {
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const nextToken = String(search.get("token") || "").trim();
    setToken(nextToken);

    if (!nextToken) {
      setInvalid(true);
      setLoading(false);
      return;
    }

    fetch(`/api/applications/invite/validate?token=${encodeURIComponent(nextToken)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.valid) {
          throw new Error("invalid");
        }

        setInvite(result);
        setRecord(buildInviteDraft(result));
      })
      .catch(() => {
        setInvalid(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function updateApplicantField(key, value) {
    setRecord((current) => ({
      ...current,
      applicant: {
        ...current.applicant,
        [key]: value,
      },
      profile:
        key === "email"
          ? {
              ...current.profile,
              email: value,
            }
          : current.profile,
    }));
  }

  function updateProfileField(key, value) {
    setRecord((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!record || !token || !invite) return;

    const validationErrors = getInviteApplicationValidationErrors({
      applicant: record.applicant,
      profile: record.profile,
      invitedEmail: invite.email,
    });

    if (validationErrors.length) {
      setFeedback(validationErrors[0]);
      setError(true);
      return;
    }

    setSending(true);
    setFeedback("");
    setError(false);

    try {
      const response = await fetch("/api/applications/invite/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          applicant: record.applicant,
          profile: record.profile,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar sua candidatura.");
      }

      setSubmitted(true);
    } catch (submissionError) {
      setFeedback(submissionError.message || "Não foi possível enviar sua candidatura.");
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Convite privado</p>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Preencha seu perfil na Nexa</h1>
            <p className="mt-5 leading-8 text-charcoal/75">
              Este formulário é pessoal e vinculado ao convite enviado para o seu email. Depois do envio, a equipe da Nexa irá revisar sua candidatura antes de qualquer publicação.
            </p>
            {invite?.expires_at ? (
              <p className="mt-5 rounded-2xl bg-mist px-4 py-3 text-sm font-semibold text-charcoal/75">
                Link válido até {new Date(invite.expires_at).toLocaleString("pt-BR")}.
              </p>
            ) : null}
          </div>

          <section className="rounded-3xl bg-white p-8 shadow-soft" aria-labelledby="invite-application-title">
            <h2 id="invite-application-title" className="font-display text-2xl font-bold">
              Questionário profissional
            </h2>

            {loading ? (
              <p className="mt-6 text-sm text-charcoal/70">Validando convite...</p>
            ) : invalid ? (
              <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Este link não está mais disponível.
              </p>
            ) : submitted ? (
              <p className="mt-6 rounded-2xl border border-clay/15 bg-mist px-4 py-3 text-sm text-charcoal/75">
                Candidatura enviada com sucesso. A equipe da Nexa irá revisar suas informações antes da publicação.
              </p>
            ) : record ? (
              <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
                <ProfileQuestionnaireFields
                  record={record}
                  onApplicantFieldChange={updateApplicantField}
                  onProfileFieldChange={updateProfileField}
                  emailReadOnly
                  profileEmailReadOnly
                  applicantSectionTitle="Dados da candidatura"
                  applicantNameLabel="Nome"
                  applicantEmailLabel="Email do convite"
                  applicantCategoryLabel="Categoria"
                  applicantLocationLabel="Localização"
                  applicantDescriptionLabel="Descrição"
                />
                {feedback ? (
                  <p
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      error ? "border border-red-200 bg-red-50 text-red-700" : "border border-clay/15 bg-mist text-charcoal/75"
                    }`}
                  >
                    {feedback}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90 disabled:opacity-60"
                >
                  {sending ? "Enviando..." : "Enviar candidatura"}
                </button>
              </form>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
