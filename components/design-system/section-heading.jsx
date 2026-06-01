import React from "react";
import { cn } from "../../lib/cn";

export function SectionHeading({ eyebrow, title, body, className = "" }) {
  return React.createElement(
    "div",
    { className: cn("max-w-3xl", className) },
    eyebrow ? React.createElement("p", { className: "ds-eyebrow" }, eyebrow) : null,
    title ? React.createElement("h1", { className: "ds-heading-hero" }, title) : null,
    body ? React.createElement("p", { className: "mt-5 ds-body" }, body) : null,
  );
}
