"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getLangConfig,
  getCategoryTitle,
  getLocalizedField,
  getLocalizedLanguages,
  getLinkLabel,
  normalizeExternalUrl,
  getPortfolioItem,
  getServiceDelivery,
  getServiceDescription,
  getServiceTitle,
} from "../lib/nexa-data";

export function ProfilePage({ profile, lang }) {
  const ui = getLangConfig(lang);
  const category = getCategoryTitle(profile, lang);
  const roleTitle = getLocalizedField(profile, "role_title", lang, ui.profileFallback);
  const shortBio = getLocalizedField(profile, "short_bio", lang, ui.profileFallback);
  const fullAbout = getLocalizedField(profile, "full_about", lang, ui.profileFallback);
  const clientFocus = getLocalizedField(profile, "client_focus", lang, ui.profileFallback);
  const websiteLabel = getLinkLabel(profile.website, profile.website_label, ui.labels.website);
  const socialLabel = getLinkLabel(profile.social_link, profile.social_label, ui.labels.social);
  const websiteHref = normalizeExternalUrl(profile.website);
  const socialHref = normalizeExternalUrl(profile.social_link);
  const profileImage = String(profile.profile_image || "").trim();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleContactSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      professionalSlug: profile.slug,
    };

    if (!payload.name || !payload.email) {
      setFeedback(ui.contactModal.validation);
      return;
    }

    setSending(true);
    setFeedback("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || ui.contactModal.error);
      }

      form.reset();
      setIsModalOpen(false);
      setSuccess(true);
    } catch (submissionError) {
      setFeedback(submissionError.message || ui.contactModal.error);
    } finally {
      setSending(false);
    }
  }

  const services = [1, 2, 3]
    .map((index) => ({
      title: getServiceTitle(profile, index, lang),
      description: getServiceDescription(profile, index, lang),
      delivery: getServiceDelivery(profile, index, lang),
    }))
    .filter((service) => service.title);

  const portfolio = [1, 2, 3]
    .map((index) => getPortfolioItem(profile, index, lang))
    .filter((item) => item.title);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{ui.labels.profileDetail}</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{profile.name}</h1>
        <p className="mt-4 text-lg leading-8 text-charcoal/75">{shortBio}</p>
      </div>
      <div className="mb-8 rounded-3xl border border-charcoal/10 bg-white/80 p-3 shadow-soft backdrop-blur">
        <nav aria-label="Profile sections" className="flex flex-wrap gap-2 text-sm font-semibold">
          {[
            { href: "#profile-about", label: ui.sections.about },
            { href: "#profile-services", label: ui.sections.services },
            { href: "#profile-experience", label: ui.sections.experience },
            { href: "#profile-portfolio", label: ui.sections.portfolio },
            { href: "#profile-contact", label: ui.sections.contact },
          ].map((link) => (
            <a key={link.href} href={link.href} className="rounded-2xl px-4 py-2 text-charcoal/75 transition-colors hover:bg-mist hover:text-teal">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <section className="mb-8 rounded-3xl bg-white p-8 shadow-soft">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-3xl font-bold">{profile.name}</h2>
              {profile.verified ? (
                <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-teal">{ui.verified}</span>
              ) : null}
              {profile.founder_professional ? (
                <span className="inline-flex items-center rounded-full border border-[#843088] bg-[#e6d6e7] px-3 py-1 text-sm font-semibold text-[#843088]">
                  Profissional Fundadora
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-lg font-medium text-clay">{category}</p>
            <p className="mt-2 text-sm font-semibold text-charcoal/70">{roleTitle}</p>
            <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl bg-mist px-4 py-4">
                <dt className="text-charcoal/55">{ui.labels.location}</dt>
                <dd className="mt-1 font-semibold">{profile.location || ""}</dd>
              </div>
              <div className="rounded-2xl bg-mist px-4 py-4">
                <dt className="text-charcoal/55">{ui.labels.languages}</dt>
                <dd className="mt-1 font-semibold">{getLocalizedLanguages(profile.languages, lang)}</dd>
              </div>
            </dl>
          </div>
          <div className="xl:justify-self-end">
            <div className="overflow-hidden rounded-[2rem] bg-mist shadow-soft">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`Foto de ${profile.name}`}
                  className="h-[18rem] w-[14rem] object-cover object-center"
                />
              ) : (
                <div className="flex h-[18rem] w-[14rem] items-center justify-center px-6 text-center text-sm font-semibold text-charcoal/55">
                  Imagem de perfil indisponível
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-8">
          <section id="profile-about" className="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 className="font-display text-2xl font-bold">{ui.sections.about}</h3>
            <p className="mt-5 leading-8 text-charcoal/75">{fullAbout}</p>
          </section>

          <section id="profile-services" className="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 className="font-display text-2xl font-bold">{ui.sections.services}</h3>
            <div className="mt-6 space-y-5">
              {services.map((service) => (
                <article key={service.title} className="rounded-3xl border border-charcoal/10 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{service.title}</h4>
                      <p className="mt-3 leading-7 text-charcoal/75">{service.description}</p>
                    </div>
                    <dl className="min-w-48 space-y-3 text-sm">
                      <div>
                        <dt className="text-charcoal/55">{ui.labels.delivery}</dt>
                        <dd className="font-semibold">{service.delivery}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="profile-experience" className="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 className="font-display text-2xl font-bold">{ui.sections.experience}</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl bg-mist p-6">
                <p className="text-sm text-charcoal/60">{ui.labels.experience}</p>
                <p className="mt-2 font-display text-3xl font-bold">{profile.experience_years || ""}</p>
              </article>
              <article className="rounded-3xl bg-mist p-6">
                <p className="text-sm text-charcoal/60">{ui.labels.clientFocus}</p>
                <p className="mt-2 font-display text-3xl font-bold">{clientFocus}</p>
              </article>
              <article className="rounded-3xl bg-mist p-6">
                <p className="text-sm text-charcoal/60">{ui.labels.projectsDelivered}</p>
                <p className="mt-2 font-display text-3xl font-bold">{profile.projects_delivered || ""}</p>
              </article>
            </div>
          </section>

          <section id="profile-portfolio" className="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 className="font-display text-2xl font-bold">{ui.sections.portfolio}</h3>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {portfolio.map((item) => (
                <article key={item.title} className="rounded-3xl bg-mist p-6">
                  <p className="text-sm font-semibold text-clay">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-charcoal/75">{item.description}</p>
                  {item.url ? (
                    <a
                      href={normalizeExternalUrl(item.url)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-5 inline-flex items-center text-sm font-semibold text-teal hover:underline"
                    >
                      Veja o projeto
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section id="profile-contact" className="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft xl:sticky xl:top-28">
            <h3 className="font-display text-2xl font-bold">{ui.sections.contact}</h3>
            <ul className="mt-6 space-y-4 text-sm">
              <li>
                <span className="block text-charcoal/55">{ui.labels.email}</span>
                <a href={`mailto:${profile.email || ""}`} className="mt-1 inline-block font-semibold text-teal">
                  {profile.email || ""}
                </a>
              </li>
              <li>
                <span className="block text-charcoal/55">{ui.labels.website}</span>
                <a
                  href={websiteHref || "#"}
                  target={websiteHref ? "_blank" : undefined}
                  rel={websiteHref ? "noreferrer noopener" : undefined}
                  className="mt-1 inline-block font-semibold text-teal"
                >
                  {websiteLabel}
                </a>
              </li>
              <li>
                <span className="block text-charcoal/55">{ui.labels.social}</span>
                <a
                  href={socialHref || "#"}
                  target={socialHref ? "_blank" : undefined}
                  rel={socialHref ? "noreferrer noopener" : undefined}
                  className="mt-1 inline-block font-semibold text-teal"
                >
                  {socialLabel}
                </a>
              </li>
            </ul>
            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-clay px-5 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90"
              onClick={() => {
                setFeedback("");
                setSuccess(false);
                setIsModalOpen(true);
              }}
            >
              {ui.contactViaNexa}
            </button>
          </section>

        </aside>
      </div>

      {success ? (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-50 px-6">
          <div className="pointer-events-auto mx-auto flex max-w-xl items-start justify-between gap-4 rounded-3xl border border-charcoal/10 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold text-charcoal">{ui.contactModal.success}</p>
            <button
              type="button"
              aria-label={ui.contactModal.close}
              className="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-charcoal transition-colors hover:text-teal"
              onClick={() => setSuccess(false)}
            >
              X
            </button>
          </div>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 bg-charcoal/35 px-6 py-8" aria-hidden="false">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative mx-auto flex min-h-full max-w-2xl items-center justify-center">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
              className="relative w-full rounded-3xl bg-white p-8 shadow-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 id="contact-modal-title" className="font-display text-2xl font-bold">
                  {ui.contactModal.title}
                </h3>
                <button
                  type="button"
                  aria-label={ui.contactModal.close}
                  className="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-charcoal transition-colors hover:text-teal"
                  onClick={() => setIsModalOpen(false)}
                >
                  X
                </button>
              </div>
              <form className="mt-6 grid gap-5" onSubmit={handleContactSubmit}>
                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-sm font-medium">
                    {ui.contactModal.name}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder={ui.contactModal.namePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-sm font-medium">
                    {ui.contactModal.email}
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder={ui.contactModal.emailPlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium">
                    {ui.contactModal.phone}
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="text"
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder={ui.contactModal.phonePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-2 block text-sm font-medium">
                    {ui.contactModal.message}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows="6"
                    required
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder={ui.contactModal.messagePlaceholder}
                  />
                </div>
                {feedback ? (
                  <p className="rounded-2xl border border-clay/15 bg-mist px-4 py-3 text-sm text-charcoal/75">{feedback}</p>
                ) : null}
                <button type="submit" disabled={sending} className="rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90 disabled:opacity-60">
                  {sending ? "..." : ui.contactModal.send}
                </button>
              </form>
            </section>
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <Link href={`/${lang}/professionals`} className="text-sm font-semibold text-teal">
          {ui.backToProfessionals}
        </Link>
      </div>
    </section>
  );
}
