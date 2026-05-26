import { isValidEmail, sanitizeText } from "./server-utils";

function hasContent(value) {
  return Boolean(String(value || "").trim());
}

export function getInviteApplicationValidationErrors({ applicant, profile, invitedEmail }) {
  const errors = [];
  const applicantName = sanitizeText(applicant?.name, 200);
  const applicantEmail = sanitizeText(applicant?.email, 320);
  const applicantCategory = sanitizeText(applicant?.category, 200);
  const applicantLocation = sanitizeText(applicant?.location, 200);
  const roleTitle = sanitizeText(profile?.role_title_pt, 500);
  const shortBio = sanitizeText(profile?.short_bio_pt, 5000);
  const fullAbout = sanitizeText(profile?.full_about_pt, 5000);
  const serviceTitle = sanitizeText(profile?.service_1_title_pt, 500);
  const serviceDescription = sanitizeText(profile?.service_1_description_pt, 5000);

  if (!applicantName) errors.push("Nome é obrigatório.");
  if (!applicantEmail) errors.push("Email é obrigatório.");
  if (applicantEmail && !isValidEmail(applicantEmail)) errors.push("Email inválido.");
  if (!applicantCategory) errors.push("Categoria é obrigatória.");
  if (!applicantLocation && !hasContent(profile?.location)) errors.push("Localização é obrigatória.");
  if (!roleTitle) errors.push("Título profissional em português é obrigatório.");
  if (!shortBio) errors.push("Resumo em português é obrigatório.");
  if (!fullAbout) errors.push("Texto sobre em português é obrigatório.");
  if (!serviceTitle) errors.push("Título do primeiro serviço é obrigatório.");
  if (!serviceDescription) errors.push("Descrição do primeiro serviço é obrigatória.");
  if (invitedEmail && applicantEmail && applicantEmail !== invitedEmail) {
    errors.push("O email informado não corresponde ao convite.");
  }

  return errors;
}
