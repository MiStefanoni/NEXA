export const DESIGN_TOKENS = {
  colors: [
    { name: "ivory", value: "#F7F6F4", role: "Page background / soft neutral surface" },
    { name: "charcoal", value: "#2B2B2B", role: "Primary text / dark border" },
    { name: "nexa_purple", value: "#843088", role: "Primary brand action" },
    { name: "nexa_orange", value: "#E47E4A", role: "Warm accent / highlight" },
    { name: "nexa_nude", value: "#F9E1CF", role: "Subtle accent surface" },
  ],
  semanticColors: [
    { name: "surface.default", value: "#FFFFFF", role: "Primary card and panel background" },
    { name: "surface.canvas", value: "#F7F6F4", role: "App/page canvas" },
    { name: "surface.subtle", value: "#F9E1CF", role: "Soft highlight surface" },
    { name: "text.default", value: "#2B2B2B", role: "Primary readable text" },
    { name: "text.subtle", value: "rgba(43, 43, 43, 0.75)", role: "Supporting text" },
    { name: "accent.primary", value: "#843088", role: "Primary CTA / brand emphasis" },
    { name: "accent.warm", value: "#E47E4A", role: "Warm badges / eyebrow labels / active accents" },
    { name: "border.default", value: "rgba(43, 43, 43, 0.15)", role: "Default border" },
    { name: "feedback.error", value: "#B42318", role: "Error text and destructive feedback" },
  ],
  typography: [
    { name: "display", font: "DM Sans", usage: "Hero, section, card titles" },
    { name: "body", font: "Inter", usage: "Body copy, labels, controls" },
    { name: "eyebrow", font: "Inter", usage: "Uppercase section intro labels" },
  ],
  layout: [
    { name: "container", value: "max-w-7xl / px-6 lg:px-8", role: "Primary content width" },
    { name: "cardRadius", value: "1.5rem", role: "Default card radius" },
    { name: "softShadow", value: "0 16px 40px rgba(43, 43, 43, 0.08)", role: "Primary elevation" },
  ],
};

export const DESIGN_SYSTEM_GUIDELINES = [
  "Use `nexa_purple` for primary actions and `nexa_orange` for active accents, links, and emphasis details.",
  "Prefer white cards on ivory canvas; use `nexa_nude` for soft-emphasis surfaces rather than large areas of accent color.",
  "Keep headings in DM Sans and body/form text in Inter.",
  "Default interactive shapes are rounded-2xl; default cards are rounded-3xl or rounded-[2rem] for hero panels.",
  "Do not introduce one-off color values when an existing token or semantic role already fits.",
];
