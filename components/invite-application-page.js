"use client";

import { useEffect, useState } from "react";
import { ProfileQuestionnaireFields } from "./profile-questionnaire-fields";
import { createInviteApplicationDraft } from "../lib/admin-profile";
import { getInviteApplicationValidationErrors } from "../lib/application-validation";
import { CATEGORY_META } from "../lib/nexa-data";

const MAX_AI_DESCRIPTION_LENGTH = 4000;

function buildInviteDraft(invite) {
  return createInviteApplicationDraft({ name: invite?.name || "", email: invite?.email || "" });
}

function normalizeAnswerValue(value, questionType) {
  if (questionType === "multi_choice") {
    return Array.isArray(value) ? value : [];
  }
  return String(value || "");
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
  const [mode, setMode] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSession, setAiSession] = useState(null);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiAnswers, setAiAnswers] = useState({});
  const [aiAccuracyConfirmed, setAiAccuracyConfirmed] = useState(false);

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

  function setMessage(message, isError = false) {
    setFeedback(message);
    setError(isError);
  }

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
      applicant: {
        ...current.applicant,
        ...(key === "name" ? { name: value } : {}),
        ...(key === "category_slug" ? { category: CATEGORY_META[value]?.pt?.title || current.applicant.category } : {}),
        ...(key === "location" ? { location: value } : {}),
        ...(key === "website" ? { website: value } : {}),
      },
      profile: {
        ...current.profile,
        [key]: value,
      },
    }));
  }

  function continueManually() {
    setMode("manual");
    setAiLoading(false);
    setMessage("");
  }

  async function startAiProfile() {
    const description = aiDescription.trim();
    if (!description) {
      setMessage("Conte um pouco sobre você e o seu trabalho antes de continuar.", true);
      return;
    }

    setAiLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile-assistant/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, locale: "pt", initialDescription: description }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível utilizar o assistente neste momento.");
      }

      setAiSession(result.session || null);
      if (result.state === "questions_pending") {
        setAiQuestions(result.questions || []);
        setAiAnswers({});
        setMode("ai-questions");
        return;
      }

      if (result.record) {
        setRecord(result.record);
      }
      setMode("ai-review");
    } catch (startError) {
      setMessage(startError.message || "Não foi possível utilizar o assistente neste momento.", true);
    } finally {
      setAiLoading(false);
    }
  }

  function updateAiAnswer(question, value) {
    setAiAnswers((current) => ({
      ...current,
      [question.id]: normalizeAnswerValue(value, question.type),
    }));
  }

  function toggleAiChoice(question, option) {
    const current = normalizeAnswerValue(aiAnswers[question.id], "multi_choice");
    const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option];
    updateAiAnswer(question, next);
  }

  async function submitAiAnswers() {
    const missingRequired = aiQuestions.find((question) => {
      const value = normalizeAnswerValue(aiAnswers[question.id], question.type);
      return question.required && (Array.isArray(value) ? !value.length : !String(value).trim());
    });

    if (missingRequired) {
      setMessage("Responda as perguntas obrigatórias para continuar.", true);
      return;
    }

    setAiLoading(true);
    setMessage("");

    try {
      const answers = aiQuestions.map((question) => {
        const answer = normalizeAnswerValue(aiAnswers[question.id], question.type);
        const skipped = Array.isArray(answer) ? !answer.length : !String(answer).trim();
        return {
          questionId: question.id,
          question: question.question,
          answer,
          skipped,
        };
      });
      const response = await fetch("/api/profile-assistant/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId: aiSession?.id, locale: "pt", answers }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível gerar seu perfil.");
      }

      setAiSession(result.session || aiSession);
      if (result.record) {
        setRecord(result.record);
      }
      setMode("ai-review");
    } catch (answerError) {
      setMessage(answerError.message || "Não foi possível gerar seu perfil.", true);
    } finally {
      setAiLoading(false);
    }
  }

  async function regenerateAiProfile() {
    if (!aiSession?.id) return;

    setAiLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile-assistant/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId: aiSession.id, locale: "pt" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível gerar outra versão.");
      }

      setAiSession(result.session || aiSession);
      if (result.record) {
        setRecord(result.record);
      }
      setAiAccuracyConfirmed(false);
      setMessage("Nova versão gerada. Revise as informações antes de enviar.");
    } catch (regenerateError) {
      setMessage(regenerateError.message || "Não foi possível gerar outra versão.", true);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!record || !token || !invite) return;

    const aiAssisted = mode === "ai-review";
    if (aiAssisted && !aiAccuracyConfirmed) {
      setMessage("Confirme que revisou as informações geradas antes de enviar.", true);
      return;
    }

    const validationErrors = getInviteApplicationValidationErrors({
      applicant: record.applicant,
      profile: record.profile,
      invitedEmail: invite.email,
    });

    if (validationErrors.length) {
      setMessage(validationErrors[0], true);
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/applications/invite/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          applicant: record.applicant,
          profile: record.profile,
          source: aiAssisted ? "ai-assisted" : undefined,
          aiSessionId: aiAssisted ? aiSession?.id : undefined,
          aiAccuracyConfirmed: aiAssisted ? aiAccuracyConfirmed : undefined,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar sua candidatura.");
      }

      setSubmitted(true);
    } catch (submissionError) {
      setMessage(submissionError.message || "Não foi possível enviar sua candidatura.", true);
    } finally {
      setSending(false);
    }
  }

  function renderFeedback() {
    if (!feedback) return null;
    return (
      <p
        className={`rounded-2xl px-4 py-3 text-sm ${
          error ? "border border-red-200 bg-red-50 text-red-700" : "border border-nexa_purple/15 bg-nexa_nude text-charcoal/75"
        }`}
      >
        {feedback}
      </p>
    );
  }

  function renderModeSelection() {
    return (
      <div className="mt-6 grid gap-4">
        <h3 className="font-display text-2xl font-bold">Como você prefere criar seu perfil?</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={continueManually}
            className="rounded-2xl border border-charcoal/10 bg-ivory p-5 text-left transition hover:border-nexa_purple/30"
          >
            <span className="block font-semibold text-charcoal">Preencher manualmente</span>
            <span className="mt-2 block text-sm leading-6 text-charcoal/65">Usar o questionário atual da Nexa.</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("ai-start");
              setMessage("");
            }}
            className="rounded-2xl border border-charcoal/10 bg-ivory p-5 text-left transition hover:border-nexa_purple/30"
          >
            <span className="block font-semibold text-charcoal">Criar meu perfil com ajuda da IA</span>
            <span className="mt-2 block text-sm leading-6 text-charcoal/65">Escrever um texto livre e revisar um rascunho editável.</span>
          </button>
        </div>
      </div>
    );
  }

  function renderAiStart() {
    return (
      <div className="mt-6 grid gap-5">
        <div>
          <h3 className="font-display text-2xl font-bold">Conte um pouco sobre você e o seu trabalho</h3>
          <p className="mt-3 leading-7 text-charcoal/75">
            Não precisa organizar as informações. Conte, com suas próprias palavras, sobre sua profissão, experiência, serviços, clientes e forma de atendimento.
            A Nexa ajudará você a transformar essas informações em um perfil profissional.
          </p>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-ivory p-5 text-sm leading-7 text-charcoal/75">
          <p className="font-semibold text-charcoal">Se puder, mencione:</p>
          <ul className="mt-2 list-disc pl-5">
            <li>o que você faz</li>
            <li>há quanto tempo trabalha na área</li>
            <li>quais serviços oferece</li>
            <li>quem costuma atender</li>
            <li>onde atende</li>
            <li>se trabalha online ou presencialmente</li>
            <li>formação ou certificações relevantes</li>
          </ul>
        </div>
        <p className="rounded-2xl border border-nexa_purple/15 bg-nexa_nude px-4 py-3 text-sm leading-6 text-charcoal/75">
          As informações fornecidas serão processadas por um serviço de inteligência artificial para auxiliar na criação do seu perfil. Nenhuma informação será publicada sem sua revisão, envio e posterior aprovação pela Nexa. Não informe CPF/RG, senhas, dados confidenciais de clientes, registros privados de saúde ou informações privadas que você não deseja exibir profissionalmente.
        </p>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-charcoal/80">Seu texto</span>
          <textarea
            value={aiDescription}
            maxLength={MAX_AI_DESCRIPTION_LENGTH}
            rows={9}
            onChange={(event) => setAiDescription(event.target.value)}
            className="min-h-[14rem] w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm leading-6 text-charcoal outline-none transition focus:border-nexa_orange focus:ring-4 focus:ring-nexa_orange/10"
            placeholder="Ex.: Sou nutricionista há 8 anos, atendo mulheres online e em São Paulo..."
          />
          <span className="mt-2 block text-xs text-charcoal/55">
            {aiDescription.length}/{MAX_AI_DESCRIPTION_LENGTH} caracteres
          </span>
        </label>
        {renderFeedback()}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startAiProfile}
            disabled={aiLoading}
            className="rounded-2xl bg-nexa_purple px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-nexa_purple/90 disabled:opacity-60"
          >
            {aiLoading ? "Criando..." : "Criar meu perfil"}
          </button>
          <button
            type="button"
            onClick={continueManually}
            className="rounded-2xl border border-charcoal/10 bg-white px-6 py-4 text-sm font-semibold text-charcoal hover:border-nexa_purple/30"
          >
            Continuar preenchendo manualmente
          </button>
        </div>
      </div>
    );
  }

  function renderQuestionInput(question) {
    const value = normalizeAnswerValue(aiAnswers[question.id], question.type);

    if (question.type === "single_choice") {
      return (
        <div className="mt-3 flex flex-wrap gap-3">
          {(question.options || []).map((option) => (
            <label key={option} className="inline-flex items-center gap-2 rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm">
              <input
                type="radio"
                name={question.id}
                checked={value === option}
                onChange={() => updateAiAnswer(question, option)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    if (question.type === "multi_choice") {
      return (
        <div className="mt-3 flex flex-wrap gap-3">
          {(question.options || []).map((option) => (
            <label key={option} className="inline-flex items-center gap-2 rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => toggleAiChoice(question, option)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    return (
      <textarea
        value={value}
        maxLength={2000}
        rows={3}
        onChange={(event) => updateAiAnswer(question, event.target.value)}
        className="mt-3 w-full rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm leading-6 text-charcoal outline-none transition focus:border-nexa_orange focus:ring-4 focus:ring-nexa_orange/10"
      />
    );
  }

  function renderAiQuestions() {
    return (
      <div className="mt-6 grid gap-5">
        <div>
          <h3 className="font-display text-2xl font-bold">Só precisamos de mais algumas informações</h3>
          <p className="mt-3 leading-7 text-charcoal/75">Responda o que fizer sentido para o seu perfil. Perguntas opcionais podem ficar em branco.</p>
        </div>
        <div className="grid gap-4">
          {aiQuestions.map((question) => (
            <div key={question.id} className="rounded-2xl bg-ivory p-5">
              <p className="font-semibold text-charcoal">
                {question.question} {question.required ? <span className="text-nexa_orange">*</span> : null}
              </p>
              {renderQuestionInput(question)}
              {!question.required ? <p className="mt-2 text-xs text-charcoal/55">Você pode pular esta pergunta.</p> : null}
            </div>
          ))}
        </div>
        {renderFeedback()}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={submitAiAnswers}
            disabled={aiLoading}
            className="rounded-2xl bg-nexa_purple px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-nexa_purple/90 disabled:opacity-60"
          >
            {aiLoading ? "Gerando..." : "Continuar"}
          </button>
          <button
            type="button"
            onClick={continueManually}
            className="rounded-2xl border border-charcoal/10 bg-white px-6 py-4 text-sm font-semibold text-charcoal hover:border-nexa_purple/30"
          >
            Continuar preenchendo manualmente
          </button>
        </div>
      </div>
    );
  }

  function renderForm() {
    const aiAssisted = mode === "ai-review";
    return (
      <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
        {aiAssisted ? (
          <p className="rounded-2xl border border-nexa_purple/15 bg-nexa_nude px-4 py-3 text-sm text-charcoal/75">
            Criado com ajuda da IA — revise as informações antes de enviar.
          </p>
        ) : null}
        <ProfileQuestionnaireFields
          record={record}
          onApplicantFieldChange={updateApplicantField}
          onProfileFieldChange={updateProfileField}
          emailReadOnly
          profileEmailReadOnly
          showApplicantSection={false}
          applicantSectionTitle="Dados da candidatura"
          applicantNameLabel="Nome"
          applicantEmailLabel="Email do convite"
          applicantCategoryLabel="Categoria"
          applicantLocationLabel="Localização"
          applicantDescriptionLabel="Descrição"
        />
        {aiAssisted ? (
          <div className="grid gap-4 rounded-2xl border border-charcoal/10 bg-white p-5 text-sm leading-6 text-charcoal/75">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={aiAccuracyConfirmed}
                onChange={(event) => setAiAccuracyConfirmed(event.target.checked)}
                className="mt-1"
              />
              <span>
                Confirmo que revisei as informações deste perfil e que elas representam corretamente minha experiência, qualificações e serviços.
              </span>
            </label>
            <p>
              Este perfil foi criado com auxílio de inteligência artificial. Nenhuma informação será publicada sem sua revisão, envio e posterior aprovação da Nexa.
            </p>
          </div>
        ) : null}
        {renderFeedback()}
        <div className="flex flex-wrap gap-3">
          {aiAssisted ? (
            <>
              <button
                type="button"
                onClick={() => setMessage("Rascunho salvo nesta sessão.")}
                className="rounded-2xl border border-charcoal/10 bg-white px-6 py-4 text-sm font-semibold text-charcoal hover:border-nexa_purple/30"
              >
                Salvar rascunho
              </button>
              <button
                type="button"
                onClick={regenerateAiProfile}
                disabled={aiLoading || Number(aiSession?.generation_count || 0) >= 2}
                className="rounded-2xl border border-charcoal/10 bg-white px-6 py-4 text-sm font-semibold text-charcoal hover:border-nexa_purple/30 disabled:opacity-60"
              >
                {aiLoading ? "Gerando..." : "Gerar outra versão"}
              </button>
            </>
          ) : null}
          <button
            type="submit"
            disabled={sending}
            className="rounded-2xl bg-nexa_purple px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-nexa_purple/90 disabled:opacity-60"
          >
            {sending ? "Enviando..." : aiAssisted ? "Enviar para análise" : "Enviar candidatura"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <main>
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-nexa_orange">Convite privado</p>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Preencha seu perfil na Nexa</h1>
            <p className="mt-5 leading-8 text-charcoal/75">
              Este formulário é pessoal e vinculado ao convite enviado para o seu email. Depois do envio, a equipe da Nexa irá revisar sua candidatura antes de qualquer publicação.
            </p>
            <p className="mt-4 leading-8 text-charcoal/75">
              Preencha seu perfil da forma mais completa possível. Campos não obrigatórios podem ficar em branco, e, nesse caso, essas informações simplesmente não aparecerão no seu perfil público.
            </p>
            {invite?.expires_at ? (
              <p className="mt-5 rounded-2xl bg-nexa_nude px-4 py-3 text-sm font-semibold text-charcoal/75">
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
              <p className="mt-6 rounded-2xl border border-nexa_purple/15 bg-nexa_nude px-4 py-3 text-sm text-charcoal/75">
                Candidatura enviada com sucesso. A equipe da Nexa irá revisar suas informações antes da publicação.
              </p>
            ) : record ? (
              <>
                {!mode ? renderModeSelection() : null}
                {mode === "ai-start" ? renderAiStart() : null}
                {mode === "ai-questions" ? renderAiQuestions() : null}
                {mode === "manual" || mode === "ai-review" ? renderForm() : null}
              </>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
