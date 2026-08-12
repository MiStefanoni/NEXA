"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORY_META, CATEGORY_ORDER } from "../lib/nexa-data";
import { buildProfileSlugFromName } from "../lib/admin-profile";
import { Checkbox, FieldLabel, Input, Select, Textarea } from "./design-system/field";

export const SERVICE_DELIVERY_OPTIONS = [
  { value: "Remote", label: "Remoto" },
  { value: "Local", label: "Local" },
  { value: "Remote and Local", label: "Remoto e local" },
];

export const REMOTE_OPTIONS = [
  { value: "Local", label: "Local" },
  { value: "Remote", label: "Remoto" },
  { value: "Remote and Local", label: "Remoto e local" },
];

export const WEBSITE_LABEL_OPTIONS = [
  { value: "Site", label: "Site" },
  { value: "LinkedIn", label: "LinkedIn" },
];

export const SOCIAL_LABEL_OPTIONS = [
  { value: "Instagram", label: "Instagram" },
  { value: "TikTok", label: "TikTok" },
];

const MAX_DYNAMIC_ITEMS = 3;

const SERVICE_FIELDS = [
  "title_pt",
  "title_en",
  "description_pt",
  "description_en",
  "delivery",
  "engagement_pt",
  "engagement_en",
];

const PORTFOLIO_FIELDS = ["title_pt", "title_en", "description_pt", "description_en", "url"];

function hasAnyValue(profile, prefix, index, fields) {
  return fields.some((field) => {
    if (prefix === "service" && field === "delivery") return false;
    return Boolean(String(profile?.[`${prefix}_${index}_${field}`] || "").trim());
  });
}

function getVisibleCount(profile, prefix, fields, minimum = 0) {
  let count = minimum;
  for (let index = 1; index <= MAX_DYNAMIC_ITEMS; index += 1) {
    if (hasAnyValue(profile, prefix, index, fields)) {
      count = index;
    }
  }
  return count;
}

function moveDynamicItem({ profile, prefix, fields, from, to, onProfileFieldChange }) {
  fields.forEach((field) => {
    const nextValue =
      field === "delivery"
        ? profile?.[`${prefix}_${from}_${field}`] || "Local"
        : profile?.[`${prefix}_${from}_${field}`] || "";
    onProfileFieldChange(`${prefix}_${to}_${field}`, nextValue);
  });
}

function clearDynamicItem({ prefix, fields, index, onProfileFieldChange }) {
  fields.forEach((field) => {
    onProfileFieldChange(`${prefix}_${index}_${field}`, field === "delivery" ? "Local" : "");
  });
}

export function TextField({ label, value, onChange, placeholder = "", type = "text", readOnly = false }) {
  return (
    <label className="block">
      <FieldLabel className="text-charcoal/80">{label}</FieldLabel>
      <Input
        type={type}
        value={value || ""}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function TextareaField({ label, value, onChange, rows = 4, placeholder = "" }) {
  return (
    <label className="block">
      <FieldLabel className="text-charcoal/80">{label}</FieldLabel>
      <Textarea
        value={value || ""}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <FieldLabel className="text-charcoal/80">{label}</FieldLabel>
      <Select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function FileField({ label, value, onChange }) {
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
      <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-charcoal/20 bg-white px-4 py-5 text-sm font-semibold text-charcoal transition-colors hover:border-nexa_orange hover:text-nexa_orange">
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

export function ProfileQuestionnaireFields({
  record,
  onApplicantFieldChange,
  onProfileFieldChange,
  adminNotes = "",
  onAdminNotesChange,
  emailReadOnly = false,
  profileEmailReadOnly = false,
  showAdminNotes = false,
  showInternalFlags = false,
  applicantSectionTitle = "Dados de candidatura",
  applicantNameLabel = "Nome enviado",
  applicantEmailLabel = "Email enviado",
  applicantCategoryLabel = "Categoria enviada",
  applicantLocationLabel = "Localização enviada",
  applicantReferralCodeLabel = "Insira o Código",
  applicantDescriptionLabel = "Descrição enviada",
  showApplicantSection = true,
}) {
  const applicant = record?.applicant || {};
  const referral = record?.referral || {};
  const profile = record?.profile || {};
  const serviceSignature = useMemo(
    () => SERVICE_FIELDS.map((field) => [1, 2, 3].map((index) => profile?.[`service_${index}_${field}`] || "").join("|")).join("::"),
    [profile],
  );
  const portfolioSignature = useMemo(
    () => PORTFOLIO_FIELDS.map((field) => [1, 2, 3].map((index) => profile?.[`portfolio_${index}_${field}`] || "").join("|")).join("::"),
    [profile],
  );
  const [visibleServices, setVisibleServices] = useState(() => getVisibleCount(profile, "service", SERVICE_FIELDS, 1));
  const [visiblePortfolio, setVisiblePortfolio] = useState(() => getVisibleCount(profile, "portfolio", PORTFOLIO_FIELDS, 0));

  useEffect(() => {
    setVisibleServices(getVisibleCount(profile, "service", SERVICE_FIELDS, 1));
  }, [record?.id, serviceSignature]);

  useEffect(() => {
    setVisiblePortfolio(getVisibleCount(profile, "portfolio", PORTFOLIO_FIELDS, 0));
  }, [record?.id, portfolioSignature]);

  const handleProfileNameChange = (value) => {
    onProfileFieldChange("name", value);
    onProfileFieldChange("slug", buildProfileSlugFromName(value));
  };
  const addService = () => {
    setVisibleServices((current) => Math.min(MAX_DYNAMIC_ITEMS, current + 1));
  };
  const addPortfolio = () => {
    setVisiblePortfolio((current) => Math.min(MAX_DYNAMIC_ITEMS, current + 1));
  };
  const removeService = (indexToRemove) => {
    if (indexToRemove <= 1) return;
    for (let index = indexToRemove; index < MAX_DYNAMIC_ITEMS; index += 1) {
      moveDynamicItem({ profile, prefix: "service", fields: SERVICE_FIELDS, from: index + 1, to: index, onProfileFieldChange });
    }
    clearDynamicItem({ prefix: "service", fields: SERVICE_FIELDS, index: MAX_DYNAMIC_ITEMS, onProfileFieldChange });
    setVisibleServices((current) => Math.max(1, current - 1));
  };
  const removePortfolio = (indexToRemove) => {
    for (let index = indexToRemove; index < MAX_DYNAMIC_ITEMS; index += 1) {
      moveDynamicItem({ profile, prefix: "portfolio", fields: PORTFOLIO_FIELDS, from: index + 1, to: index, onProfileFieldChange });
    }
    clearDynamicItem({ prefix: "portfolio", fields: PORTFOLIO_FIELDS, index: MAX_DYNAMIC_ITEMS, onProfileFieldChange });
    setVisiblePortfolio((current) => Math.max(0, current - 1));
  };

  return (
    <div className="grid gap-8">
      {showApplicantSection ? (
        <section className="rounded-3xl bg-ivory p-6">
          <h3 className="font-display text-2xl font-bold">{applicantSectionTitle}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField label={applicantNameLabel} value={applicant.name} onChange={(value) => onApplicantFieldChange("name", value)} />
            <TextField
              label={applicantEmailLabel}
              value={applicant.email}
              onChange={(value) => onApplicantFieldChange("email", value)}
              type="email"
              readOnly={emailReadOnly}
            />
            <TextField label={applicantCategoryLabel} value={applicant.category} onChange={(value) => onApplicantFieldChange("category", value)} />
            <TextField label={applicantLocationLabel} value={applicant.location} onChange={(value) => onApplicantFieldChange("location", value)} />
            <TextField
              label={applicantReferralCodeLabel}
              value={applicant.referralCode}
              onChange={(value) => onApplicantFieldChange("referralCode", value)}
              placeholder="Insira o código de quem te apresentou a Nexa"
            />
          </div>
          {referral.name || referral.code ? (
            <div className="mt-4 rounded-2xl border border-charcoal/10 bg-white p-4 text-sm text-charcoal/75">
              <p className="font-semibold text-charcoal">Indicação</p>
              {referral.name ? <p className="mt-1">{referral.name}</p> : null}
              {referral.code ? (
                <p className="mt-1">
                  <span className="font-semibold">Código:</span> {referral.code}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4">
            <TextareaField label={applicantDescriptionLabel} value={applicant.description} onChange={(value) => onApplicantFieldChange("description", value)} rows={4} />
          </div>
          {showAdminNotes ? (
            <div className="mt-4">
              <TextareaField label="Notas internas" value={adminNotes} onChange={onAdminNotesChange} rows={4} placeholder="Ex.: aguardando portfólio, faltou revisar tradução, rejeitado por inconsistência de escopo." />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-3xl bg-ivory p-6">
        <h3 className="font-display text-2xl font-bold">Perfil público</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField label="Nome" value={profile.name} onChange={handleProfileNameChange} />
          <TextField label="Slug" value={profile.slug} onChange={() => {}} readOnly />
          <SelectField
            label="Categoria"
            value={profile.category_slug}
            onChange={(value) => onProfileFieldChange("category_slug", value)}
            options={CATEGORY_ORDER.map((slug) => ({ value: slug, label: CATEGORY_META[slug].pt.title }))}
          />
          <SelectField
            label="Local ou remoto"
            value={profile.remote_or_local}
            onChange={(value) => onProfileFieldChange("remote_or_local", value)}
            options={REMOTE_OPTIONS}
          />
          <TextField label="Localização" value={profile.location} onChange={(value) => onProfileFieldChange("location", value)} />
          <TextField label="Idiomas" value={profile.languages} onChange={(value) => onProfileFieldChange("languages", value)} placeholder="English, Portuguese" />
          <TextField
            label="Email público"
            value={profile.email}
            onChange={(value) => onProfileFieldChange("email", value)}
            type="email"
            readOnly={profileEmailReadOnly}
          />
          <TextField label="Website" value={profile.website} onChange={(value) => onProfileFieldChange("website", value)} placeholder="https://..." />
          <SelectField
            label="Label do website"
            value={profile.website_label}
            onChange={(value) => onProfileFieldChange("website_label", value)}
            options={WEBSITE_LABEL_OPTIONS}
          />
          <TextField label="Link social" value={profile.social_link} onChange={(value) => onProfileFieldChange("social_link", value)} placeholder="https://..." />
          <SelectField
            label="Label social"
            value={profile.social_label}
            onChange={(value) => onProfileFieldChange("social_label", value)}
            options={SOCIAL_LABEL_OPTIONS}
          />
          <TextField label="URL da imagem" value={profile.profile_image} onChange={(value) => onProfileFieldChange("profile_image", value)} placeholder="https://... ou deixe vazio para usar upload" />
        </div>
        <div className="mt-4">
          <FileField label="Imagem de Perfil" value={profile.profile_image} onChange={(value) => onProfileFieldChange("profile_image", value)} />
        </div>
        {showInternalFlags ? (
          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <label className="inline-flex items-center gap-3">
              <Checkbox
                checked={Boolean(profile.verified)}
                onChange={(event) => onProfileFieldChange("verified", event.target.checked)}
              />
              Perfil verificado
            </label>
            <label className="inline-flex items-center gap-3">
              <Checkbox
                checked={Boolean(profile.featured)}
                onChange={(event) => onProfileFieldChange("featured", event.target.checked)}
              />
              Destaque na home
            </label>
            <label className="inline-flex items-center gap-3">
              <Checkbox
                checked={Boolean(profile.founder_professional)}
                onChange={(event) => onProfileFieldChange("founder_professional", event.target.checked)}
              />
              Profissional pioneira
            </label>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-ivory p-6">
        <h3 className="font-display text-2xl font-bold">Conteúdo em português</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextField label="Título profissional" value={profile.role_title_pt} onChange={(value) => onProfileFieldChange("role_title_pt", value)} />
          <TextField label="Foco de clientes" value={profile.client_focus_pt} onChange={(value) => onProfileFieldChange("client_focus_pt", value)} />
          <TextField label="Experiência" value={profile.experience_years} onChange={(value) => onProfileFieldChange("experience_years", value)} placeholder="7+" />
          <TextField label="Projetos entregues" value={profile.projects_delivered} onChange={(value) => onProfileFieldChange("projects_delivered", value)} placeholder="65+" />
        </div>
        <div className="mt-4 grid gap-4">
          <TextareaField label="Resumo curto" value={profile.short_bio_pt} onChange={(value) => onProfileFieldChange("short_bio_pt", value)} rows={4} />
          <TextareaField label="Sobre / biografia" value={profile.full_about_pt} onChange={(value) => onProfileFieldChange("full_about_pt", value)} rows={6} />
        </div>
      </section>

      <section className="grid gap-4">
        {Array.from({ length: visibleServices }, (_, offset) => offset + 1).map((index) => (
        <section key={index} className="rounded-3xl bg-ivory p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="font-display text-2xl font-bold">Serviço {index}</h3>
            {index > 1 ? (
              <button
                type="button"
                onClick={() => removeService(index)}
                className="self-start text-sm font-semibold text-charcoal/60 transition-colors hover:text-nexa_orange"
                aria-label={`Remover serviço ${index}`}
              >
                Remover serviço
              </button>
            ) : null}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField label="Título" value={profile[`service_${index}_title_pt`]} onChange={(value) => onProfileFieldChange(`service_${index}_title_pt`, value)} />
            <SelectField
              label="Formato"
              value={profile[`service_${index}_delivery`]}
              onChange={(value) => onProfileFieldChange(`service_${index}_delivery`, value)}
              options={SERVICE_DELIVERY_OPTIONS}
            />
          </div>
          <div className="mt-4 grid gap-4">
            <TextareaField label="Descrição PT" value={profile[`service_${index}_description_pt`]} onChange={(value) => onProfileFieldChange(`service_${index}_description_pt`, value)} rows={4} />
          </div>
        </section>
        ))}
        {visibleServices < MAX_DYNAMIC_ITEMS ? (
          <button
            type="button"
            onClick={addService}
            className="justify-self-start rounded-2xl border border-charcoal/10 bg-white px-5 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-nexa_orange hover:text-nexa_orange"
          >
            + Adicionar outro serviço
          </button>
        ) : null}
      </section>

      <section className="rounded-3xl bg-ivory p-6">
        <h3 className="font-display text-2xl font-bold">Portfólio</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-charcoal/70">
          Adicione projetos, trabalhos ou experiências que ajudem clientes a conhecer melhor o seu trabalho. Esta seção é opcional.
        </p>
        <div className="mt-5 grid gap-4">
          {Array.from({ length: visiblePortfolio }, (_, offset) => offset + 1).map((index) => (
          <section key={`portfolio-${index}`} className="rounded-3xl border border-charcoal/10 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h4 className="font-display text-xl font-bold">Portfólio {index}</h4>
            <button
              type="button"
              onClick={() => removePortfolio(index)}
              className="self-start text-sm font-semibold text-charcoal/60 transition-colors hover:text-nexa_orange"
              aria-label={`Remover portfólio ${index}`}
            >
              Remover portfólio
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField label="Título" value={profile[`portfolio_${index}_title_pt`]} onChange={(value) => onProfileFieldChange(`portfolio_${index}_title_pt`, value)} />
            <TextField
              label="Veja o projeto"
              value={profile[`portfolio_${index}_url`]}
              onChange={(value) => onProfileFieldChange(`portfolio_${index}_url`, value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <div className="mt-4 grid gap-4">
            <TextareaField label="Descrição PT" value={profile[`portfolio_${index}_description_pt`]} onChange={(value) => onProfileFieldChange(`portfolio_${index}_description_pt`, value)} rows={4} />
          </div>
        </section>
          ))}
          {visiblePortfolio < MAX_DYNAMIC_ITEMS ? (
            <button
              type="button"
              onClick={addPortfolio}
              className="justify-self-start rounded-2xl border border-charcoal/10 bg-white px-5 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-nexa_orange hover:text-nexa_orange"
            >
              {visiblePortfolio ? "+ Adicionar outro portfólio" : "+ Adicionar portfólio"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
