"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function AppShell({ lang, ui, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const footerLinks = [
    { href: `${ui.homePath}#how-it-works`, label: ui.footer.howItWorks },
    { href: ui.categoriesPath, label: ui.footer.categories },
    { href: ui.professionalsPath, label: ui.footer.professionals },
    { href: ui.applyPath, label: ui.footer.applyNow },
    { href: ui.guidelinesPath, label: ui.footer.guidelines },
    { href: ui.privacyPath, label: ui.footer.privacy },
    { href: ui.termsPath, label: ui.footer.terms },
  ];

  const navLinks = [
    { href: ui.categoriesPath, label: ui.nav.categories },
    { href: ui.professionalsPath, label: ui.nav.professionals },
    { href: `${ui.homePath}#how-it-works`, label: ui.nav.howItWorks },
  ];

  return (
    <div lang={ui.htmlLang}>
      <header className="sticky top-0 z-50 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <Link href={ui.homePath} className="inline-flex items-center" aria-label="Nexa home">
            <Image src="/Nexa2.png" alt="Nexa" width={113} height={40} className="h-10 w-auto" priority />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm font-medium md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="relative pb-1 transition-colors hover:text-teal">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={ui.applyPath}
              className="rounded-2xl bg-clay px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-clay/90"
            >
              {ui.nav.applyNow}
            </Link>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="inline-flex items-center rounded-2xl border border-charcoal/15 bg-white px-4 py-2 text-sm font-semibold text-charcoal shadow-soft"
              onClick={() => setIsOpen((value) => !value)}
            >
              {ui.nav.menu}
            </button>
          </div>
        </div>
        <div id="mobile-menu" className={`${isOpen ? "block" : "hidden"} border-t border-charcoal/10 bg-white md:hidden`}>
          <nav aria-label="Mobile primary" className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-sm font-medium lg:px-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-3 transition-colors hover:bg-mist hover:text-teal"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={ui.applyPath}
              className="mt-2 rounded-2xl bg-clay px-4 py-3 text-center font-semibold text-white shadow-soft"
              onClick={() => setIsOpen(false)}
            >
              {ui.nav.applyNow}
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-charcoal/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link href={ui.homePath} className="inline-flex items-center" aria-label="Nexa home">
            <Image src="/Nexa2.png" alt="Nexa" width={113} height={40} className="h-10 w-auto" />
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap gap-5 text-sm text-charcoal/75">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-teal">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
