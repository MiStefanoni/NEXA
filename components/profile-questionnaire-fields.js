"use client";

import { CATEGORY_META, CATEGORY_ORDER } from "../lib/nexa-data";
import { buildProfileSlugFromName } from "../lib/admin-profile";

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

export function TextField({ label, value, onChange, placeholder = "", type = "text", readOnly = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-charcoal/80">{label}</span>
      <input
        type={type}
        value={value || ""}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal read-only:cursor-not-allowed read-only:opacity-80"
      />
    </label>
  );
}

export function TextareaField({ label, value, onChange, rows = 4, placeholder = "" }) {
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

export function SelectField({ label, value, onChange, options }) {
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
  applicantDescriptionLabel = "Descrição enviada",
}) {
  const applicant = record?.applicant || {};
  const profile = record?.profile || {};
  const handleProfileNameChange = (value) => {
    onProfileFieldChange("name", value);
    onProfileFieldChange("slug", buildProfileSlugFromName(value));
  };

  return (
    <div className="grid gap-8">
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
        </div>
        <div className="mt-4">
          <TextareaField label={applicantDescriptionLabel} value={applicant.description} onChange={(value) => onApplicantFieldChange("description", value)} rows={4} />
        </div>
        {showAdminNotes ? (
          <div className="mt-4">
            <TextareaField label="Notas internas" value={adminNotes} onChange={onAdminNotesChange} rows={4} placeholder="Ex.: aguardando portfólio, faltou revisar tradução, rejeitado por inconsistência de escopo." />
          </div>
        ) : null}
      </section>

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
              <input
                type="checkbox"
                checked={Boolean(profile.verified)}
                onChange={(event) => onProfileFieldChange("verified", event.target.checked)}
                className="h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal"
              />
              Perfil verificado
            </label>
            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(profile.featured)}
                onChange={(event) => onProfileFieldChange("featured", event.target.checked)}
                className="h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal"
              />
              Destaque na home
            </label>
            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(profile.founder_professional)}
                onChange={(event) => onProfileFieldChange("founder_professional", event.target.checked)}
                className="h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal"
              />
              Profissional fundadora
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

      {[1, 2, 3].map((index) => (
        <section key={index} className="rounded-3xl bg-ivory p-6">
          <h3 className="font-display text-2xl font-bold">Serviço {index}</h3>
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

      {[1, 2, 3].map((index) => (
        <section key={`portfolio-${index}`} className="rounded-3xl bg-ivory p-6">
          <h3 className="font-display text-2xl font-bold">Portfólio {index}</h3>
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
    </div>
  );
}
