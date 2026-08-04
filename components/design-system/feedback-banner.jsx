import React from "react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  default: "border border-charcoal/10 bg-white text-charcoal/75 shadow-soft",
  success: "border border-nexa_purple/15 bg-nexa_nude text-charcoal/75",
  error: "border border-red-200 bg-red-50 text-red-700",
};

export function FeedbackBanner({ children, variant = "default", className = "" }) {
  return React.createElement("p", { className: cn("rounded-2xl px-4 py-3 text-sm", VARIANTS[variant], className) }, children);
}
