"use client";

import { useState } from "react";

export function ApplicationForm({ lang, ui, source, withExtraFields = false }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);

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
        <label htmlFor={`name-${source}`} className="mb-2 block text-sm font-medium">
          {lang === "en" ? "Name" : "Nome"}
        </label>
        <input
          id={`name-${source}`}
          name="name"
          type="text"
          required
          className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
          placeholder={lang === "en" ? "Your full name" : "Seu nome completo"}
        />
      </div>
      <div>
        <label htmlFor={`email-${source}`} className="mb-2 block text-sm font-medium">
          Email
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
          placeholder={lang === "en" ? "name@example.com" : "nome@exemplo.com"}
        />
      </div>
      {withExtraFields ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`category-${source}`} className="mb-2 block text-sm font-medium">
              {lang === "en" ? "Category" : "Categoria"}
            </label>
            <select
              id={`category-${source}`}
              name="category"
              required
              className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none focus:border-teal"
              defaultValue=""
            >
              <option value="">{lang === "en" ? "Select a category" : "Selecione uma categoria"}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`location-${source}`} className="mb-2 block text-sm font-medium">
              {lang === "en" ? "Location" : "Localização"}
            </label>
            <input
              id={`location-${source}`}
              name="location"
              type="text"
              className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
              placeholder={lang === "en" ? "City, state, or remote" : "Cidade, estado ou remoto"}
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor={`category-${source}`} className="mb-2 block text-sm font-medium">
            {lang === "en" ? "Category" : "Categoria"}
          </label>
          <select
            id={`category-${source}`}
            name="category"
            required
            className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none focus:border-teal"
            defaultValue=""
          >
            <option value="">{lang === "en" ? "Select a category" : "Selecione uma categoria"}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}
      {withExtraFields && (
        <div>
          <label htmlFor={`website-${source}`} className="mb-2 block text-sm font-medium">
            {lang === "en" ? "Website or portfolio" : "Website ou portfólio"}
          </label>
          <input
            id={`website-${source}`}
            name="website"
            type="url"
            className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
            placeholder="https://seusite.com"
          />
        </div>
      )}
      <div>
        <label htmlFor={`description-${source}`} className="mb-2 block text-sm font-medium">
          {lang === "en" ? "Description" : "Descrição"}
        </label>
        <textarea
          id={`description-${source}`}
          name="description"
          rows={withExtraFields ? 6 : 5}
          required
          className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
          placeholder={
            lang === "en"
              ? "Tell us about your work, services, and ideal clients."
              : "Conte sobre seu trabalho, serviços e clientes ideais."
          }
        />
      </div>
      {feedback ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            error ? "border border-red-200 bg-red-50 text-red-700" : "border border-clay/15 bg-mist text-charcoal/75"
          }`}
        >
          {feedback}
        </p>
      ) : null}
      <button type="submit" disabled={sending} className="rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90 disabled:opacity-60">
        {sending ? ui.applicationForm.sending : lang === "en" ? "Submit application" : "Enviar candidatura"}
      </button>
    </form>
  );
}
