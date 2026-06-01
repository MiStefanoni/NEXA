"use client";

import React from "react";
import { cn } from "../../lib/cn";

export function FieldLabel({ htmlFor, children, className = "" }) {
  return React.createElement("label", { htmlFor, className: cn("mb-2 block text-sm font-medium", className) }, children);
}

export function Input({ className = "", ...props }) {
  return React.createElement("input", {
    className: cn(
      "w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none placeholder:text-charcoal/35 focus:border-teal read-only:cursor-not-allowed read-only:opacity-80",
      className,
    ),
    ...props,
  });
}

export function Textarea({ className = "", ...props }) {
  return React.createElement("textarea", {
    className: cn(
      "w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none placeholder:text-charcoal/35 focus:border-teal",
      className,
    ),
    ...props,
  });
}

export function Select({ className = "", children, ...props }) {
  return React.createElement(
    "select",
    {
      className: cn("w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-teal", className),
      ...props,
    },
    children,
  );
}

export function Checkbox({ className = "", ...props }) {
  return React.createElement("input", {
    type: "checkbox",
    className: cn("h-4 w-4 rounded border-charcoal/20 text-teal focus:ring-teal", className),
    ...props,
  });
}

export function FieldMessage({ children, variant = "default", className = "" }) {
  const variantClass = variant === "error" ? "text-red-700" : "text-charcoal/65";
  return React.createElement("p", { className: cn("mt-2 text-sm", variantClass, className) }, children);
}
