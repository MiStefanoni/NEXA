const NEXA_CATEGORY_ORDER = [
  "creative-digital",
  "business-professional",
  "education-coaching",
  "wellness-care",
  "marketing-communication",
  "events-lifestyle",
  "home-skilled-trade-services",
];

const NEXA_CATEGORY_META = {
  "creative-digital": {
    title: "Creative & Digital",
    description:
      "Designers, developers, photographers, writers, and digital creators with polished professional profiles.",
    note: "Creative work with strategy behind it.",
    categoryPage: "category-creative-digital.html",
  },
  "business-professional": {
    title: "Business & Professional",
    description:
      "Consultants, legal professionals, accountants, operations specialists, and executive service providers.",
    note: "Professional support for decisions that matter.",
    categoryPage: "category-business-professional.html",
  },
  "education-coaching": {
    title: "Education & Coaching",
    description:
      "Tutors, trainers, mentors, and coaches offering structured learning and personal development services.",
    note: "Guidance designed for measurable progress.",
    categoryPage: "category-education-coaching.html",
  },
  "wellness-care": {
    title: "Wellness & Care",
    description:
      "Practitioners and service providers focused on wellbeing, support, care, and holistic client experiences.",
    note: "Care-led services with professionalism and trust.",
    categoryPage: "category-wellness-care.html",
  },
  "marketing-communication": {
    title: "Marketing & Communication",
    description:
      "Brand strategists, publicists, copywriters, and communication specialists helping businesses grow clearly.",
    note: "Clearer messaging, stronger visibility.",
    categoryPage: "category-marketing-communication.html",
  },
  "events-lifestyle": {
    title: "Events & Lifestyle",
    description:
      "Planners, stylists, hosts, and experience-focused professionals supporting memorable personal and business moments.",
    note: "Experience-led work with a polished finish.",
    categoryPage: "category-events-lifestyle.html",
  },
  "home-skilled-trade-services": {
    title: "Home & Skilled Trade Services",
    description:
      "Trusted professionals offering hands-on services, technical expertise, and in-home support with credibility and clear service descriptions.",
    note: "Hands-on expertise with credibility built in.",
    categoryPage: "category-home-skilled-trade-services.html",
  },
};

const DIRECTORY_SCRIPT_URL = new URL(document.currentScript?.src || "./scripts/directory.js", window.location.href);

const getRootPath = (relativePath) => new URL(`../${relativePath}`, DIRECTORY_SCRIPT_URL).pathname;

const normalizeBoolean = (value) => String(value).toLowerCase() === "true";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeProfile = (profile) => {
  const serviceTags = [1, 2, 3]
    .map((index) => profile[`service_${index}_title`])
    .filter(Boolean)
    .map((title) => title.replace(/\s+(Engagement|Advisory|Support)$/i, "").trim());

  return {
    ...profile,
    verified: normalizeBoolean(profile.verified),
    featured: normalizeBoolean(profile.featured),
    serviceTags,
  };
};

async function loadProfessionals() {
  const response = await fetch(getRootPath("data/professionals.json"));
  if (!response.ok) {
    throw new Error(`Failed to load professionals.json: HTTP ${response.status}`);
  }
  const profiles = await response.json();
  return profiles.map(normalizeProfile);
}

function getProfileUrl(slug) {
  return getRootPath(`profile-${slug}.html`);
}

function getBadgeLabel(profile) {
  if ((profile.remote_or_local || "").toLowerCase() === "remote") {
    return "Remote";
  }
  return (profile.location || "").split(",")[0] || profile.remote_or_local || "Local";
}

function renderProfessionalCard(profile) {
  return `
    <article class="rounded-3xl bg-white p-8 shadow-soft">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h3 class="font-display text-2xl font-bold">${escapeHtml(profile.name)}</h3>
          <p class="mt-2 text-sm font-medium text-teal">${escapeHtml(profile.category)}</p>
        </div>
        <span class="rounded-full bg-mist px-3 py-1 text-xs font-semibold ${getBadgeLabel(profile) === "Remote" ? "text-teal" : "text-charcoal"}">${escapeHtml(getBadgeLabel(profile))}</span>
      </div>
      <p class="mt-5 text-sm font-semibold text-clay">${escapeHtml(profile.role_title)}</p>
      <p class="mt-4 leading-7 text-charcoal/75">${escapeHtml(profile.short_bio)}</p>
      <div class="mt-5 flex flex-wrap gap-2 text-xs font-medium text-charcoal/75">
        ${profile.serviceTags
          .slice(0, 3)
          .map(
            (tag) => `<span class="rounded-full bg-mist px-3 py-2">${escapeHtml(tag)}</span>`
          )
          .join("")}
      </div>
      <a href="${getProfileUrl(profile.slug)}" class="mt-6 inline-block text-sm font-semibold text-teal">View profile</a>
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

async function renderFeaturedProfessionals(containerId, limit = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const profiles = await loadProfessionals();
  const featured = profiles.filter((profile) => profile.featured).slice(0, limit);
  const fallback = profiles.slice(0, limit);
  const selected = featured.length ? featured : fallback;
  container.innerHTML = selected.map(renderProfessionalCard).join("");
}

async function renderProfessionalsDirectory(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const profiles = await loadProfessionals();
  const sections = NEXA_CATEGORY_ORDER.map((slug) => {
    const meta = NEXA_CATEGORY_META[slug];
    const categoryProfiles = profiles.filter((profile) => profile.category_slug === slug);
    if (!categoryProfiles.length) {
      return "";
    }
    return `
      <section id="${escapeHtml(slug)}" class="mt-14 first:mt-0">
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(meta.title)}</p>
            <h2 class="mt-2 font-display text-3xl font-bold">${escapeHtml(meta.description)}</h2>
          </div>
          <a href="${escapeHtml(getRootPath(meta.categoryPage))}" class="text-sm font-semibold text-teal">View category page</a>
        </div>
        <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          ${categoryProfiles.map(renderProfessionalCard).join("")}
        </div>
      </section>
    `;
  }).join("");

  container.innerHTML = sections;
}

async function renderCategoryDirectory(containerId, categorySlug) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const profiles = await loadProfessionals();
  const categoryProfiles = profiles.filter((profile) => profile.category_slug === categorySlug);
  container.innerHTML = categoryProfiles.map(renderProfessionalCard).join("");
}

window.NexaDirectory = {
  loadProfessionals,
  normalizeBoolean,
  renderFeaturedProfessionals,
  renderProfessionalsDirectory,
  renderCategoryDirectory,
  setupMobileMenu,
  NEXA_CATEGORY_META,
};
