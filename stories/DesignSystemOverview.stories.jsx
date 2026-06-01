import React from "react";
import { Badge } from "../components/design-system/badge";
import { Button } from "../components/design-system/button";
import { Card, SubtleCard } from "../components/design-system/card";
import { FieldLabel, Input, Select, Textarea } from "../components/design-system/field";
import { DESIGN_SYSTEM_GUIDELINES, DESIGN_TOKENS } from "../lib/design-system";

export default {
  title: "Design System/Overview",
};

function Swatch({ token }) {
  return React.createElement(
    "div",
    { className: "rounded-3xl border border-charcoal/10 bg-white p-5 shadow-soft" },
    React.createElement("div", {
      className: "h-16 rounded-2xl border border-charcoal/10",
      style: { backgroundColor: token.value },
    }),
    React.createElement("p", { className: "mt-4 font-semibold text-charcoal" }, token.name),
    React.createElement("p", { className: "mt-1 text-sm text-charcoal/70" }, token.value),
    React.createElement("p", { className: "mt-2 text-sm text-charcoal/65" }, token.role),
  );
}

export function Foundations() {
  return React.createElement(
    "div",
    { className: "w-[1100px] space-y-10" },
    React.createElement(
      "section",
      { className: "space-y-4" },
      React.createElement("p", { className: "ds-eyebrow" }, "Nexa Design System"),
      React.createElement("h1", { className: "ds-heading-hero" }, "Foundations and composition rules"),
      React.createElement(
        "p",
        { className: "ds-body max-w-3xl" },
        "V1 formalizes the existing Nexa visual language instead of replacing it. Public pages and admin surfaces should share the same foundational components and tokens.",
      ),
    ),
    React.createElement(
      "section",
      { className: "grid gap-4 md:grid-cols-3 xl:grid-cols-5" },
      ...DESIGN_TOKENS.colors.map((token) => React.createElement(Swatch, { key: token.name, token })),
    ),
    React.createElement(
      "section",
      { className: "grid gap-6 lg:grid-cols-2" },
      React.createElement(
        Card,
        null,
        React.createElement("h2", { className: "ds-heading-section" }, "Type and actions"),
        React.createElement("p", { className: "mt-4 ds-body" }, "Display text uses DM Sans; body, labels, and controls use Inter."),
        React.createElement(
          "div",
          { className: "mt-6 flex flex-wrap gap-3" },
          React.createElement(Button, { variant: "primary" }, "Primary action"),
          React.createElement(Button, { variant: "secondary" }, "Secondary action"),
          React.createElement(Button, { variant: "destructive" }, "Destructive action"),
          React.createElement(Button, { variant: "chipActive", size: "sm", className: "rounded-full" }, "Active filter"),
        ),
      ),
      React.createElement(
        SubtleCard,
        null,
        React.createElement("h2", { className: "ds-heading-section" }, "Rules"),
        React.createElement(
          "ul",
          { className: "mt-4 space-y-3 text-sm leading-7 text-charcoal/75" },
          ...DESIGN_SYSTEM_GUIDELINES.map((item) => React.createElement("li", { key: item }, item)),
        ),
      ),
    ),
    React.createElement(
      "section",
      { className: "grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" },
      React.createElement(
        Card,
        null,
        React.createElement("h2", { className: "ds-heading-section" }, "Field composition"),
        React.createElement(
          "div",
          { className: "mt-6 grid gap-5" },
          React.createElement(
            "div",
            null,
            React.createElement(FieldLabel, { htmlFor: "example-name" }, "Nome"),
            React.createElement(Input, { id: "example-name", placeholder: "Seu nome completo" }),
          ),
          React.createElement(
            "div",
            null,
            React.createElement(FieldLabel, { htmlFor: "example-category" }, "Categoria"),
            React.createElement(
              Select,
              { id: "example-category", defaultValue: "" },
              React.createElement("option", { value: "" }, "Selecione"),
              React.createElement("option", { value: "consulting" }, "Consultoria"),
            ),
          ),
          React.createElement(
            "div",
            null,
            React.createElement(FieldLabel, { htmlFor: "example-description" }, "Descrição"),
            React.createElement(Textarea, { id: "example-description", rows: 4, placeholder: "Conte sobre seu trabalho..." }),
          ),
        ),
      ),
      React.createElement(
        Card,
        null,
        React.createElement("h2", { className: "ds-heading-section" }, "Badge language"),
        React.createElement(
          "div",
          { className: "mt-6 flex flex-wrap gap-3" },
          React.createElement(Badge, { variant: "warm" }, "Remoto"),
          React.createElement(Badge, { variant: "neutral" }, "Serviço"),
          React.createElement(Badge, { variant: "verified", size: "md" }, "Verificada"),
          React.createElement(Badge, { variant: "founder", size: "md" }, "Profissional Fundadora"),
        ),
      ),
    ),
  );
}
