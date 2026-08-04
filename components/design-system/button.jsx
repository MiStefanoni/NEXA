import React from "react";
import Link from "next/link";
import { cn } from "../../lib/cn";

const VARIANTS = {
  primary: "bg-nexa_purple text-white hover:bg-nexa_purple/90",
  secondary: "border border-charcoal/15 bg-white text-charcoal hover:border-nexa_orange hover:text-nexa_orange",
  ghost: "bg-transparent text-charcoal hover:bg-nexa_nude hover:text-nexa_orange",
  destructive: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  chip: "border border-charcoal/15 bg-white text-charcoal hover:border-nexa_orange hover:text-nexa_orange",
  chipActive: "border-nexa_orange bg-nexa_nude text-nexa_orange",
};

const SIZES = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-sm",
};

function baseClass({ fullWidth = false }) {
  return cn(
    "inline-flex items-center justify-center rounded-2xl font-semibold shadow-soft transition-colors disabled:opacity-60",
    fullWidth && "w-full",
  );
}

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  href,
  fullWidth = false,
  ...props
}) {
  const classes = cn(baseClass({ fullWidth }), VARIANTS[variant], SIZES[size], className);

  if (href) {
    return React.createElement(Link, { href, className: classes, ...props }, children);
  }

  return React.createElement("button", { className: classes, ...props }, children);
}
