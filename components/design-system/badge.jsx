import React from "react";
import { cn } from "../../lib/cn";

const VARIANTS = {
  warm: "bg-mist text-teal",
  neutral: "border border-charcoal/15 bg-ivory text-charcoal/75",
  founder: "border border-[#843088] bg-[#e6d6e7] text-[#843088]",
  verified: "bg-mist text-teal",
  destructive: "border border-red-200 bg-red-50 text-red-700",
};

const SIZES = {
  sm: "px-3 py-1 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({ children, variant = "neutral", size = "sm", className = "" }) {
  return React.createElement(
    "span",
    { className: cn("inline-flex items-center rounded-full font-semibold", VARIANTS[variant], SIZES[size], className) },
    children,
  );
}
