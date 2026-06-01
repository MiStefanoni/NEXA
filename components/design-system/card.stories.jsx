import React from "react";
import { Badge } from "./badge";
import { Card, PanelCard, SubtleCard } from "./card";

export default {
  title: "Design System/Card",
};

export function Variants() {
  return React.createElement(
    "div",
    { className: "grid w-[980px] gap-6 lg:grid-cols-3" },
    React.createElement(
      Card,
      null,
      React.createElement("h2", { className: "ds-heading-section" }, "Default Card"),
      React.createElement("p", { className: "mt-4 ds-body" }, "Primary content surface for public and admin sections."),
    ),
    React.createElement(
      PanelCard,
      null,
      React.createElement("h2", { className: "ds-heading-section" }, "Panel Card"),
      React.createElement("p", { className: "mt-4 ds-body" }, "Larger hero or framing panel with the same system language."),
    ),
    React.createElement(
      SubtleCard,
      null,
      React.createElement("h2", { className: "ds-heading-section" }, "Subtle Card"),
      React.createElement(
        "div",
        { className: "mt-4 flex gap-3" },
        React.createElement(Badge, { variant: "warm" }, "Warm badge"),
        React.createElement(Badge, { variant: "neutral" }, "Neutral tag"),
      ),
    ),
  );
}
