"use client";

import { useEffect, useState } from "react";
import { Button } from "./design-system/button";
import { FeedbackBanner } from "./design-system/feedback-banner";
import { FieldLabel, FieldMessage, Input, Select, Textarea } from "./design-system/field";

export function ApplicationForm({ lang, ui, source, withExtraFields = false }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralLookup, setReferralLookup] = useState({
    checked: false,
    valid: false,
    name: "",
    code: "",
    locked: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawRef = params.get("ref");
    if (!rawRef) return;

    let cancelled = false;
    const normalizedRef = rawRef.trim();
    setReferralCode(normalizedRef);
    setReferralLookup({ checked: false, valid: false, name: "", code: "", locked: false });

    fetch(`/api/referrals/${encodeURIComponent(normalizedRef)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (cancelled) return;

        if (result?.valid) {
          setReferralCode(result.code || normalizedRef);
          setReferralLookup({
            checked: true,
            valid: true,
            name: result.name || "",
            code: result.code || normalizedRef,
            locked: true,
          });
          return;
        }

        setReferralLookup({ checked: true, valid: false, name: "", code: "", locked: false });
      })
      .catch(() => {
        if (!cancelled) {
          setReferralLookup({ checked: true, valid: false, name: "", code: "", locked: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      referralCode: referralCode.trim(),
      description: String(formData.get("description") || "").trim(),
      source,
    };

    if (!payload.name || !payload.email || !payload.category || !payload.description) {
      setFeedback(ui.applicationForm.validation);
      setError(true);
      return;
    }

    setSending(true);
    setFeedback("");
    setError(false);

    try {
      const response = await fetch("/api/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || ui.applicationForm.error);
      }

      form.reset();
      setReferralCode(referralLookup.locked ? referralLookup.code : "");
      setFeedback(ui.applicationForm.success);
      setError(false);
    } catch (submissionError) {
      setFeedback(submissionError.message || ui.applicationForm.error);
      setError(true);
    } finally {
      setSending(false);
    }
  }

  const categories =
    lang === "en"
      ? [
          "Health, Wellness & Care",
          "Professional & Business Services",
          "Home and Family Care",
          "Education, Development & Consulting",
        ]
      : [
          "Saúde, Bem-Estar e Cuidado",
          "Serviços Profissionais e Negócios",
          "Casa e Família",
          "Educação, Desenvolvimento e Consultoria",
        ];

  return (
    <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
      <div>
        <FieldLabel htmlFor={`name-${source}`}>{lang === "en" ? "Name" : "Nome"}</FieldLabel>
        <Input
          id={`name-${source}`}
          name="name"
          type="text"
          required
          placeholder={lang === "en" ? "Your full name" : "Seu nome completo"}
        />
      </div>
      <div>
        <FieldLabel htmlFor={`email-${source}`}>Email</FieldLabel>
        <Input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          placeholder={lang === "en" ? "name@example.com" : "nome@exemplo.com"}
        />
      </div>
      {withExtraFields ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={`category-${source}`}>{lang === "en" ? "Category" : "Categoria"}</FieldLabel>
            <Select id={`category-${source}`} name="category" required defaultValue="">
              <option value="">{lang === "en" ? "Select a category" : "Selecione uma categoria"}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor={`location-${source}`}>{lang === "en" ? "Location" : "Localização"}</FieldLabel>
            <Input
              id={`location-${source}`}
              name="location"
              type="text"
              placeholder={lang === "en" ? "City, state, or remote" : "Cidade, estado ou remoto"}
            />
          </div>
        </div>
      ) : (
        <div>
          <FieldLabel htmlFor={`category-${source}`}>{lang === "en" ? "Category" : "Categoria"}</FieldLabel>
          <Select id={`category-${source}`} name="category" required defaultValue="">
            <option value="">{lang === "en" ? "Select a category" : "Selecione uma categoria"}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
      )}
      {withExtraFields ? (
        <div>
          <FieldLabel htmlFor={`website-${source}`}>{lang === "en" ? "Website or portfolio" : "Website ou portfólio"}</FieldLabel>
          <Input id={`website-${source}`} name="website" type="url" placeholder="https://seusite.com" />
        </div>
      ) : null}
      <div>
        <FieldLabel htmlFor={`referral-code-${source}`}>
          {lang === "en" ? "Enter Code" : "Insira o Código"}
        </FieldLabel>
        <Input
          id={`referral-code-${source}`}
          name="referralCode"
          type="text"
          value={referralCode}
          readOnly={referralLookup.locked}
          onChange={(event) => {
            setReferralCode(event.target.value);
            setReferralLookup({ checked: false, valid: false, name: "", code: "", locked: false });
          }}
          placeholder={
            lang === "en"
              ? "Enter the code of who introduced you to Nexa"
              : "Insira o código de quem te apresentou a Nexa"
          }
        />
        {referralLookup.valid ? (
          <FieldMessage>
            {lang === "en" ? "Referral" : "Indicação"}: {referralLookup.name}
            {referralLookup.code ? ` · Código: ${referralLookup.code}` : ""}
          </FieldMessage>
        ) : referralLookup.checked && referralCode ? (
          <FieldMessage>{lang === "en" ? "Code not found." : "Código não encontrado."}</FieldMessage>
        ) : null}
      </div>
      <div>
        <FieldLabel htmlFor={`description-${source}`}>{lang === "en" ? "Description" : "Descrição"}</FieldLabel>
        <Textarea
          id={`description-${source}`}
          name="description"
          rows={withExtraFields ? 6 : 5}
          required
          placeholder={
            lang === "en"
              ? "Tell us about your work, services, and ideal clients."
              : "Conte sobre seu trabalho, serviços e clientes ideais."
          }
        />
      </div>
      {feedback ? <FeedbackBanner variant={error ? "error" : "success"}>{feedback}</FeedbackBanner> : null}
      <Button type="submit" disabled={sending} size="lg">
        {sending ? ui.applicationForm.sending : lang === "en" ? "Submit application" : "Enviar candidatura"}
      </Button>
    </form>
  );
}
