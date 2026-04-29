const NEXA_CATEGORY_ORDER = [
  "saude-bem-estar-cuidado",
  "servicos-profissionais-negocios",
  "educacao-desenvolvimento-consultoria",
];

const NEXA_CATEGORY_META = {
  "saude-bem-estar-cuidado": {
    pt: {
      title: "Saúde, Bem-Estar e Cuidado",
      description:
        "Psicólogas, nutricionistas, fisioterapeutas, personal trainers, terapeutas ocupacionais, fonoaudiólogas, médicas, dentistas, terapeutas, profissionais de estética.",
      note: "Atendimento especializado com foco em saúde, acolhimento e confiança.",
      pageDescription:
        "Encontre profissionais de saúde, bem-estar e cuidado oferecendo suporte especializado, atendimento confiável e experiências mais seguras para suas clientes.",
    },
    en: {
      title: "Health, Wellness & Care",
      description:
        "Psychologists, nutritionists, physical therapists, personal trainers, occupational therapists, speech therapists, doctors, dentists, therapists, and beauty professionals.",
      note: "Specialized care centered on wellbeing, trust, and client support.",
      pageDescription:
        "Explore health, wellness, and care professionals offering trusted expertise, thoughtful support, and structured client experiences.",
    },
  },
  "servicos-profissionais-negocios": {
    pt: {
      title: "Serviços Profissionais e Negócios",
      description:
        "Advogadas, contadoras, consultoras empresariais, recrutadoras, profissionais de RH, estrategistas de marca, arquitetas, designers, programadoras, assessoras, especialistas B2B, personal organizer, diarista, babás.",
      note: "Serviços estruturados para operação, crescimento e suporte profissional.",
      pageDescription:
        "Descubra profissionais que apoiam negócios, rotinas, operações e entregas especializadas com clareza, organização e credibilidade.",
    },
    en: {
      title: "Professional & Business Services",
      description:
        "Lawyers, accountants, business consultants, recruiters, HR professionals, brand strategists, architects, designers, developers, assistants, B2B specialists, personal organizers, cleaners, and nannies.",
      note: "Structured services for operations, growth, and professional support.",
      pageDescription:
        "Discover professionals supporting businesses, households, operations, and specialized delivery with clarity, structure, and credibility.",
    },
  },
  "educacao-desenvolvimento-consultoria": {
    pt: {
      title: "Educação, Desenvolvimento e Consultoria",
      description:
        "Professoras particulares, especialistas em idiomas, orientadoras educacionais, mentoras, consultoras de carreira, educadoras, facilitadoras.",
      note: "Aprendizado, orientação e desenvolvimento com método e clareza.",
      pageDescription:
        "Explore profissionais focadas em ensino, desenvolvimento e consultoria com abordagens estruturadas para aprendizado e crescimento.",
    },
    en: {
      title: "Education, Development & Consulting",
      description:
        "Private tutors, language specialists, educational advisors, mentors, career consultants, educators, and facilitators.",
      note: "Learning, guidance, and development delivered with structure and clarity.",
      pageDescription:
        "Explore professionals focused on education, development, and consulting through structured guidance for learning and growth.",
    },
  },
};

const NEXA_UI = {
  pt: {
    language: "pt",
    cardCategoryCta: "Explorar categoria",
    cardProfileCta: "Ver perfil",
    directoryEmpty: "Nenhuma profissional corresponde a este filtro no momento.",
    featuredEmpty: "Nenhuma profissional em destaque corresponde a este filtro no momento.",
    verified: "Verificada",
    remote: "Remoto",
    local: "Local",
    profileFallback: "Este perfil está disponível atualmente em português.",
    profileNotFoundTitle: "Perfil não encontrado",
    profileNotFoundText: "Não foi possível localizar esta profissional.",
    backToProfessionals: "Voltar para profissionais",
    browseAllProfessionals: "Explorar todas as profissionais",
    sections: {
      about: "Sobre",
      services: "Serviços",
      experience: "Experiência",
      portfolio: "Portfólio",
      contact: "Contato",
    },
    labels: {
      location: "Localização",
      languages: "Idiomas",
      profileType: "Tipo de perfil",
      delivery: "Formato",
      engagement: "Modelo",
      experience: "Experiência",
      clientFocus: "Foco de clientes",
      projectsDelivered: "Projetos entregues",
      email: "Email",
      website: "Website",
      social: "Rede social",
      safetyNote: "Nota de segurança",
      profileDetail: "Perfil",
      category: "Categoria",
    },
    contactViaNexa: "Entrar em contato pela Nexa",
  },
  en: {
    language: "en",
    cardCategoryCta: "Browse category",
    cardProfileCta: "View profile",
    directoryEmpty: "No professionals match this filter yet.",
    featuredEmpty: "No featured professionals match this filter yet.",
    verified: "Verified",
    remote: "Remote",
    local: "Local",
    profileFallback: "This profile is currently available in Portuguese.",
    profileNotFoundTitle: "Profile not found",
    profileNotFoundText: "We couldn't find this professional.",
    backToProfessionals: "Back to professionals",
    browseAllProfessionals: "Browse all professionals",
    sections: {
      about: "About",
      services: "Services",
      experience: "Experience",
      portfolio: "Portfolio",
      contact: "Contact",
    },
    labels: {
      location: "Location",
      languages: "Languages",
      profileType: "Profile type",
      delivery: "Delivery",
      engagement: "Engagement",
      experience: "Experience",
      clientFocus: "Client focus",
      projectsDelivered: "Projects delivered",
      email: "Email",
      website: "Website",
      social: "Social",
      safetyNote: "Safety note",
      profileDetail: "Profile detail",
      category: "Category",
    },
    contactViaNexa: "Contact via Nexa",
  },
};

const LANGUAGE_NAME_MAP = {
  Arabic: { pt: "Árabe", en: "Arabic" },
  English: { pt: "Inglês", en: "English" },
  French: { pt: "Francês", en: "French" },
  Hindi: { pt: "Hindi", en: "Hindi" },
  Italian: { pt: "Italiano", en: "Italian" },
  Mandarin: { pt: "Mandarim", en: "Mandarin" },
  Portuguese: { pt: "Português", en: "Portuguese" },
  Spanish: { pt: "Espanhol", en: "Spanish" },
  Turkish: { pt: "Turco", en: "Turkish" },
  Urdu: { pt: "Urdu", en: "Urdu" },
};

const normalizeBoolean = (value) => String(value).toLowerCase() === "true";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const hasContent = (value) => String(value ?? "").trim() !== "";

const getUi = (lang) => NEXA_UI[lang] || NEXA_UI.pt;

const getCurrentLang = (lang) => (lang === "en" ? "en" : "pt");

const getLocationMode = (profile) =>
  (profile.remote_or_local || "").trim().toLowerCase() === "remote" ? "remote" : "local";

const normalizeSearchText = (value) => String(value || "").trim().toLowerCase();

async function loadProfessionals() {
  const response = await fetch("/data/professionals.json");
  if (!response.ok) {
    throw new Error(`Failed to load professionals.json: HTTP ${response.status}`);
  }

  const profiles = await response.json();
  return profiles.map((profile) => ({
    ...profile,
    verified: normalizeBoolean(profile.verified),
    featured: normalizeBoolean(profile.featured),
  }));
}

function getLocalizedField(profile, baseKey, lang, fallback = "") {
  const normalizedLang = getCurrentLang(lang);
  const requested = profile[`${baseKey}_${normalizedLang}`];
  if (hasContent(requested)) {
    return requested;
  }

  if (normalizedLang === "en") {
    const portuguese = profile[`${baseKey}_pt`];
    if (hasContent(portuguese)) {
      return fallback || getUi("en").profileFallback;
    }
  }

  return profile[`${baseKey}_pt`] || fallback;
}

function getCategoryMeta(categorySlug, lang) {
  const normalizedLang = getCurrentLang(lang);
  return NEXA_CATEGORY_META[categorySlug]?.[normalizedLang] || NEXA_CATEGORY_META[categorySlug]?.pt;
}

function getCategoryTitle(profile, lang) {
  return getLocalizedField(profile, "category", lang, getCategoryMeta(profile.category_slug, lang)?.title || "");
}

function getLocalizedLanguages(value, lang) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => LANGUAGE_NAME_MAP[item]?.[lang] || item)
    .join(", ");
}

function localizeDelivery(value, lang) {
  let output = String(value || "");
  if (lang === "pt") {
    output = output.replaceAll("On-site", "Presencial");
    output = output.replaceAll("Remote", "Remoto");
    output = output.replaceAll("Hybrid", "Híbrido");
  }
  return output;
}

function localizeEngagement(value, lang) {
  let output = String(value || "");
  if (lang === "pt") {
    output = output.replaceAll("Project-based", "Por projeto");
    output = output.replaceAll("Retainer", "Recorrente");
  }
  return output;
}

function getProfileUrl(slug, lang) {
  return `/${getCurrentLang(lang)}/profile-template.html?slug=${encodeURIComponent(slug)}`;
}

function getCategoryUrl(categorySlug, lang) {
  return `/${getCurrentLang(lang)}/category-${categorySlug}.html`;
}

function getLinkLabel(href, label, fallback) {
  if (hasContent(label)) return label;
  if (hasContent(href)) return String(href).replace(/^https?:\/\//, "");
  return fallback;
}

function getBadgeLabel(profile, lang) {
  const ui = getUi(lang);
  if (getLocationMode(profile) === "remote") {
    return ui.remote;
  }

  return (profile.location || "").split(",")[0] || ui.local;
}

function getServiceTitle(profile, index, lang) {
  return getLocalizedField(profile, `service_${index}_title`, lang, "");
}

function getServiceDescription(profile, index, lang) {
  return getLocalizedField(profile, `service_${index}_description`, lang, getUi(lang).profileFallback);
}

function getServiceEngagement(profile, index, lang) {
  return localizeEngagement(profile[`service_${index}_engagement`], lang);
}

function getServiceDelivery(profile, index, lang) {
  return localizeDelivery(profile[`service_${index}_delivery`], lang);
}

function getPortfolioItem(profile, index, lang) {
  return {
    title: getLocalizedField(profile, `portfolio_${index}_title`, lang, ""),
    description: getLocalizedField(profile, `portfolio_${index}_description`, lang, getUi(lang).profileFallback),
  };
}

function buildServiceTags(profile, lang) {
  return [1, 2, 3].map((index) => getServiceTitle(profile, index, lang)).filter(Boolean);
}

function matchesDirectorySearch(profile, query, lang) {
  if (!query) return true;

  const terms = [
    profile.name,
    getCategoryTitle(profile, lang),
    getLocalizedField(profile, "role_title", lang, ""),
    getLocalizedField(profile, "short_bio", lang, ""),
    profile.location,
    getLocalizedLanguages(profile.languages, lang),
    ...buildServiceTags(profile, lang),
  ];

  return terms.join(" ").toLowerCase().includes(query);
}

function renderProfessionalCard(profile, lang) {
  const ui = getUi(lang);
  const category = getCategoryTitle(profile, lang);
  const roleTitle = getLocalizedField(profile, "role_title", lang, ui.profileFallback);
  const shortBio = getLocalizedField(profile, "short_bio", lang, ui.profileFallback);
  const badgeLabel = getBadgeLabel(profile, lang);
  const serviceTags = buildServiceTags(profile, lang);

  return `
    <article class="flex h-full flex-col justify-between rounded-3xl bg-white p-8 shadow-soft">
      <div>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="font-display text-2xl font-bold">${escapeHtml(profile.name)}</h3>
            <p class="mt-2 text-sm font-medium text-teal">${escapeHtml(category)}</p>
          </div>
          <span class="rounded-full bg-mist px-3 py-1 text-xs font-semibold ${getLocationMode(profile) === "remote" ? "text-teal" : "text-charcoal"}">${escapeHtml(badgeLabel)}</span>
        </div>
        <p class="mt-5 text-sm font-semibold text-clay">${escapeHtml(roleTitle)}</p>
        <p class="mt-4 leading-7 text-charcoal/75">${escapeHtml(shortBio)}</p>
        <div class="mt-5 flex flex-wrap gap-2 text-xs font-medium text-charcoal/75">
          ${serviceTags
            .slice(0, 3)
            .map((tag) => `<span class="rounded-full bg-mist px-3 py-2">${escapeHtml(tag)}</span>`)
            .join("")}
        </div>
      </div>
      <a href="${getProfileUrl(profile.slug, lang)}" class="mt-6 inline-block text-sm font-semibold text-teal">${escapeHtml(ui.cardProfileCta)}</a>
    </article>
  `;
}

function setupMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  mobileMenuButton?.addEventListener("click", () => {
    const isOpen = !mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden", isOpen);
    mobileMenuButton.setAttribute("aria-expanded", String(!isOpen));
  });
}

function syncDirectoryFilterUi(filterContainer, activeFilter) {
  if (!filterContainer) return;
  const buttons = filterContainer.querySelectorAll("[data-directory-filter]");
  buttons.forEach((button) => {
    const isActive = button.dataset.directoryFilter === activeFilter;
    button.classList.toggle("border-teal", isActive);
    button.classList.toggle("bg-mist", isActive);
    button.classList.toggle("text-teal", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

async function renderFeaturedProfessionals(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const lang = getCurrentLang(options.lang || document.documentElement.lang);
  const ui = getUi(lang);
  const limit = typeof options === "number" ? options : options.limit || 3;
  const filterContainerId = typeof options === "number" ? null : options.filterContainerId;
  const profiles = await loadProfessionals();
  const filterContainer = filterContainerId ? document.getElementById(filterContainerId) : null;
  let activeFilter = "all";

  const getSelectedProfiles = () => {
    const matchesAvailability = (profile) =>
      activeFilter === "all" || getLocationMode(profile) === activeFilter;
    const featured = profiles.filter((profile) => profile.featured && matchesAvailability(profile)).slice(0, limit);
    const fallback = profiles.filter(matchesAvailability).slice(0, limit);
    return featured.length ? featured : fallback;
  };

  const renderProfiles = () => {
    const selected = getSelectedProfiles();
    container.innerHTML =
      selected.map((profile) => renderProfessionalCard(profile, lang)).join("") ||
      `<div class="rounded-3xl bg-white p-8 text-base text-charcoal/75 shadow-soft lg:col-span-3">${escapeHtml(ui.featuredEmpty)}</div>`;
  };

  filterContainer?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-directory-filter]");
    if (!button) return;
    activeFilter = button.dataset.directoryFilter || "all";
    syncDirectoryFilterUi(filterContainer, activeFilter);
    renderProfiles();
  });

  syncDirectoryFilterUi(filterContainer, activeFilter);
  renderProfiles();
}

async function renderProfessionalsDirectory(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const lang = getCurrentLang(options.lang || document.documentElement.lang);
  const ui = getUi(lang);
  const profiles = await loadProfessionals();
  const filterContainer = document.getElementById("directory-location-filter");
  const searchInput = document.getElementById("directory-search");
  let activeFilter = "all";
  let searchQuery = "";

  const renderSections = () => {
    const sections = NEXA_CATEGORY_ORDER.map((slug) => {
      const meta = getCategoryMeta(slug, lang);
      const categoryProfiles = profiles.filter((profile) => {
        if (profile.category_slug !== slug) return false;
        const matchesAvailability =
          activeFilter === "all" || getLocationMode(profile) === activeFilter;
        return matchesAvailability && matchesDirectorySearch(profile, searchQuery, lang);
      });

      if (!categoryProfiles.length) {
        return "";
      }

      return `
        <section id="${escapeHtml(slug)}" class="mt-14 first:mt-0">
          <div class="mb-6 max-w-3xl">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(meta.title)}</p>
            <h2 class="mt-2 font-display text-3xl font-bold">${escapeHtml(meta.description)}</h2>
          </div>
          <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            ${categoryProfiles.map((profile) => renderProfessionalCard(profile, lang)).join("")}
          </div>
        </section>
      `;
    }).join("");

    container.innerHTML =
      sections ||
      `<div class="rounded-3xl bg-white p-8 text-base text-charcoal/75 shadow-soft">${escapeHtml(ui.directoryEmpty)}</div>`;
  };

  filterContainer?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-directory-filter]");
    if (!button) return;
    activeFilter = button.dataset.directoryFilter || "all";
    syncDirectoryFilterUi(filterContainer, activeFilter);
    renderSections();
  });

  searchInput?.addEventListener("input", (event) => {
    searchQuery = normalizeSearchText(event.target.value);
    renderSections();
  });

  syncDirectoryFilterUi(filterContainer, activeFilter);
  renderSections();
}

async function renderCategoryDirectory(containerId, categorySlug, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const lang = getCurrentLang(options.lang || document.documentElement.lang);
  const profiles = await loadProfessionals();
  const categoryProfiles = profiles.filter((profile) => profile.category_slug === categorySlug);
  container.innerHTML = categoryProfiles.map((profile) => renderProfessionalCard(profile, lang)).join("");
}

function buildProfileMain(profile, lang) {
  const ui = getUi(lang);
  const category = getCategoryTitle(profile, lang);
  const roleTitle = getLocalizedField(profile, "role_title", lang, ui.profileFallback);
  const shortBio = getLocalizedField(profile, "short_bio", lang, ui.profileFallback);
  const fullAbout = getLocalizedField(profile, "full_about", lang, ui.profileFallback);
  const profileType = getLocalizedField(profile, "profile_type", lang, ui.profileFallback);
  const clientFocus = getLocalizedField(profile, "client_focus", lang, ui.profileFallback);
  const experienceSummary = getLocalizedField(profile, "experience_summary", lang, ui.profileFallback);
  const safetyNote = getLocalizedField(profile, "safety_note", lang, ui.profileFallback);
  const websiteLabel = getLinkLabel(profile.website, profile.website_label, ui.labels.website);
  const socialLabel = getLinkLabel(profile.social_link, profile.social_label, ui.labels.social);
  const verifiedBadge = profile.verified
    ? `<span class="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-teal">${escapeHtml(ui.verified)}</span>`
    : "";

  const services = [1, 2, 3]
    .map((index) => {
      const title = getServiceTitle(profile, index, lang);
      if (!title) return "";
      return `
        <article class="rounded-3xl border border-charcoal/10 p-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 class="text-lg font-semibold">${escapeHtml(title)}</h4>
              <p class="mt-3 leading-7 text-charcoal/75">${escapeHtml(getServiceDescription(profile, index, lang))}</p>
            </div>
            <dl class="min-w-48 space-y-3 text-sm">
              <div>
                <dt class="text-charcoal/55">${escapeHtml(ui.labels.delivery)}</dt>
                <dd class="font-semibold">${escapeHtml(getServiceDelivery(profile, index, lang))}</dd>
              </div>
              <div>
                <dt class="text-charcoal/55">${escapeHtml(ui.labels.engagement)}</dt>
                <dd class="font-semibold">${escapeHtml(getServiceEngagement(profile, index, lang))}</dd>
              </div>
            </dl>
          </div>
        </article>
      `;
    })
    .join("");

  const portfolio = [1, 2, 3]
    .map((index) => {
      const item = getPortfolioItem(profile, index, lang);
      if (!item.title) return "";
      return `
        <article class="rounded-3xl bg-mist p-6">
          <p class="text-sm font-semibold text-clay">${escapeHtml(item.title)}</p>
          <p class="mt-3 text-sm leading-7 text-charcoal/75">${escapeHtml(item.description)}</p>
        </article>
      `;
    })
    .join("");

  return `
    <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div class="mb-8 max-w-2xl">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(ui.labels.profileDetail)}</p>
        <h1 class="mt-3 font-display text-4xl font-bold sm:text-5xl">${escapeHtml(profile.name)}</h1>
        <p class="mt-4 text-lg leading-8 text-charcoal/75">${escapeHtml(shortBio)}</p>
      </div>
      <div class="mb-8 rounded-3xl border border-charcoal/10 bg-white/80 p-3 shadow-soft backdrop-blur">
        <nav aria-label="Profile sections" class="flex flex-wrap gap-2 text-sm font-semibold">
          <a href="#profile-about" class="rounded-2xl px-4 py-2 text-charcoal/75 transition-colors hover:bg-mist hover:text-teal">${escapeHtml(ui.sections.about)}</a>
          <a href="#profile-services" class="rounded-2xl px-4 py-2 text-charcoal/75 transition-colors hover:bg-mist hover:text-teal">${escapeHtml(ui.sections.services)}</a>
          <a href="#profile-experience" class="rounded-2xl px-4 py-2 text-charcoal/75 transition-colors hover:bg-mist hover:text-teal">${escapeHtml(ui.sections.experience)}</a>
          <a href="#profile-portfolio" class="rounded-2xl px-4 py-2 text-charcoal/75 transition-colors hover:bg-mist hover:text-teal">${escapeHtml(ui.sections.portfolio)}</a>
          <a href="#profile-contact" class="rounded-2xl px-4 py-2 text-charcoal/75 transition-colors hover:bg-mist hover:text-teal">${escapeHtml(ui.sections.contact)}</a>
        </nav>
      </div>
      <div class="grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
        <div class="space-y-8">
          <section class="rounded-3xl bg-white p-8 shadow-soft">
            <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-3">
                  <h2 class="font-display text-3xl font-bold">${escapeHtml(profile.name)}</h2>
                  ${verifiedBadge}
                </div>
                <p class="mt-3 text-lg font-medium text-clay">${escapeHtml(category)}</p>
                <p class="mt-2 text-sm font-semibold text-charcoal/70">${escapeHtml(roleTitle)}</p>
              </div>
              <dl class="grid gap-3 text-sm sm:grid-cols-3 lg:text-right">
                <div>
                  <dt class="text-charcoal/55">${escapeHtml(ui.labels.location)}</dt>
                  <dd class="mt-1 font-semibold">${escapeHtml(profile.location || "")}</dd>
                </div>
                <div>
                  <dt class="text-charcoal/55">${escapeHtml(ui.labels.languages)}</dt>
                  <dd class="mt-1 font-semibold">${escapeHtml(getLocalizedLanguages(profile.languages, lang))}</dd>
                </div>
                <div>
                  <dt class="text-charcoal/55">${escapeHtml(ui.labels.profileType)}</dt>
                  <dd class="mt-1 font-semibold">${escapeHtml(profileType)}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section id="profile-about" class="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 class="font-display text-2xl font-bold">${escapeHtml(ui.sections.about)}</h3>
            <p class="mt-5 leading-8 text-charcoal/75">${escapeHtml(fullAbout)}</p>
          </section>

          <section id="profile-services" class="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 class="font-display text-2xl font-bold">${escapeHtml(ui.sections.services)}</h3>
            <div class="mt-6 space-y-5">
              ${services}
            </div>
          </section>

          <section id="profile-experience" class="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 class="font-display text-2xl font-bold">${escapeHtml(ui.sections.experience)}</h3>
            <div class="mt-6 grid gap-4 md:grid-cols-3">
              <article class="rounded-3xl bg-mist p-6">
                <p class="text-sm text-charcoal/60">${escapeHtml(ui.labels.experience)}</p>
                <p class="mt-2 font-display text-3xl font-bold">${escapeHtml(profile.experience_years || "")}</p>
              </article>
              <article class="rounded-3xl bg-mist p-6">
                <p class="text-sm text-charcoal/60">${escapeHtml(ui.labels.clientFocus)}</p>
                <p class="mt-2 font-display text-3xl font-bold">${escapeHtml(clientFocus)}</p>
              </article>
              <article class="rounded-3xl bg-mist p-6">
                <p class="text-sm text-charcoal/60">${escapeHtml(ui.labels.projectsDelivered)}</p>
                <p class="mt-2 font-display text-3xl font-bold">${escapeHtml(profile.projects_delivered || "")}</p>
              </article>
            </div>
            <p class="mt-6 leading-8 text-charcoal/75">${escapeHtml(experienceSummary)}</p>
          </section>

          <section id="profile-portfolio" class="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft">
            <h3 class="font-display text-2xl font-bold">${escapeHtml(ui.sections.portfolio)}</h3>
            <div class="mt-6 grid gap-5 md:grid-cols-3">
              ${portfolio}
            </div>
          </section>
        </div>

        <aside class="space-y-6">
          <section id="profile-contact" class="scroll-mt-28 rounded-3xl bg-white p-8 shadow-soft xl:sticky xl:top-28">
            <h3 class="font-display text-2xl font-bold">${escapeHtml(ui.sections.contact)}</h3>
            <ul class="mt-6 space-y-4 text-sm">
              <li>
                <span class="block text-charcoal/55">${escapeHtml(ui.labels.email)}</span>
                <a href="mailto:${escapeHtml(profile.email || "")}" class="mt-1 inline-block font-semibold text-teal">${escapeHtml(profile.email || "")}</a>
              </li>
              <li>
                <span class="block text-charcoal/55">${escapeHtml(ui.labels.website)}</span>
                <a href="${escapeHtml(profile.website || "#")}" class="mt-1 inline-block font-semibold text-teal">${escapeHtml(websiteLabel)}</a>
              </li>
              <li>
                <span class="block text-charcoal/55">${escapeHtml(ui.labels.social)}</span>
                <a href="${escapeHtml(profile.social_link || "#")}" class="mt-1 inline-block font-semibold text-teal">${escapeHtml(socialLabel)}</a>
              </li>
            </ul>
            <a href="/${lang}/apply.html" class="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-clay px-5 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90">${escapeHtml(ui.contactViaNexa)}</a>
          </section>

          <section class="rounded-3xl bg-mist p-8 shadow-soft">
            <h3 class="font-display text-xl font-bold">${escapeHtml(ui.labels.safetyNote)}</h3>
            <p class="mt-4 leading-7 text-charcoal/75">${escapeHtml(safetyNote)}</p>
          </section>
        </aside>
      </div>
    </section>
  `;
}

function updateProfileLanguageSwitcher(slug) {
  document.querySelectorAll("[data-profile-lang-switch]").forEach((link) => {
    const targetLang = link.dataset.profileLangSwitch;
    link.href = `/${targetLang}/profile-template.html?slug=${encodeURIComponent(slug)}`;
  });
}

async function renderProfileTemplate(options = {}) {
  const container = document.getElementById(options.containerId || "profile-root");
  if (!container) return;

  const lang = getCurrentLang(options.lang || document.documentElement.lang);
  const ui = getUi(lang);
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    container.innerHTML = `
      <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div class="rounded-3xl bg-white p-8 shadow-soft">
          <h1 class="font-display text-3xl font-bold">${escapeHtml(ui.profileNotFoundTitle)}</h1>
          <p class="mt-4 leading-7 text-charcoal/75">${escapeHtml(ui.profileNotFoundText)}</p>
          <a href="/${lang}/professionals.html" class="mt-6 inline-flex text-sm font-semibold text-teal">${escapeHtml(ui.backToProfessionals)}</a>
        </div>
      </section>
    `;
    return;
  }

  updateProfileLanguageSwitcher(slug);

  const profiles = await loadProfessionals();
  const profile = profiles.find((item) => item.slug === slug);

  if (!profile) {
    container.innerHTML = `
      <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div class="rounded-3xl bg-white p-8 shadow-soft">
          <h1 class="font-display text-3xl font-bold">${escapeHtml(ui.profileNotFoundTitle)}</h1>
          <p class="mt-4 leading-7 text-charcoal/75">${escapeHtml(ui.profileNotFoundText)}</p>
          <a href="/${lang}/professionals.html" class="mt-6 inline-flex text-sm font-semibold text-teal">${escapeHtml(ui.backToProfessionals)}</a>
        </div>
      </section>
    `;
    return;
  }

  const roleTitle = getLocalizedField(profile, "role_title", lang, ui.profileFallback);
  document.title = `${profile.name} | Nexa`;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", `${profile.name} | ${roleTitle} | Nexa`);
  }

  container.innerHTML = buildProfileMain(profile, lang);
}

window.NexaDirectory = {
  NEXA_CATEGORY_ORDER,
  NEXA_CATEGORY_META,
  getCategoryMeta,
  loadProfessionals,
  renderFeaturedProfessionals,
  renderProfessionalsDirectory,
  renderCategoryDirectory,
  renderProfileTemplate,
  setupMobileMenu,
};
