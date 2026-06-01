import React from "react";
import { cn } from "../../lib/cn";

export function Card({ children, className = "" }) {
  return React.createElement("section", { className: cn("ds-card", className) }, children);
}

export function PanelCard({ children, className = "" }) {
  return React.createElement("section", { className: cn("ds-panel", className) }, children);
}

export function SubtleCard({ children, className = "" }) {
  return React.createElement("section", { className: cn("rounded-3xl bg-ivory p-6", className) }, children);
}
