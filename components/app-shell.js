"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./design-system/button";

export function AppShell({ lang, ui, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const footerLinks = [
    { href: ui.aboutPath, label: ui.footer.about },
    { href: `${ui.homePath}#how-it-works`, label: ui.footer.howItWorks },
    { href: ui.categoriesPath, label: ui.footer.categories },
    { href: ui.professionalsPath, label: ui.footer.professionals },
    { href: ui.applyPath, label: ui.footer.applyNow },
    { href: ui.guidelinesPath, label: ui.footer.guidelines },
    { href: ui.privacyPath, label: ui.footer.privacy },
    { href: ui.termsPath, label: ui.footer.terms },
  ];

  const navLinks = [
    { href: ui.aboutPath, label: ui.nav.about },
    { href: ui.categoriesPath, label: ui.nav.categories },
    { href: ui.professionalsPath, label: ui.nav.professionals },
    { href: `${ui.homePath}#how-it-works`, label: ui.nav.howItWorks },
  ];

  return (
    <div lang={ui.htmlLang}>
      <header className="bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-10 lg:px-8">
          <Link href={ui.homePath} className="inline-flex items-center" aria-label="Nexa home">
            <Image src="/Nexa2.png" alt="Nexa" width={113} height={40} className="h-10 w-auto" priority />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm font-medium md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="relative pb-1 transition-colors hover:text-nexa_orange">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Button href={ui.applyPath} variant="primary">
              {ui.nav.applyNow}
            </Button>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsOpen((value) => !value)}
            >
              {ui.nav.menu}
            </Button>
          </div>
        </div>
        <div id="mobile-menu" className={`${isOpen ? "block" : "hidden"} border-t border-charcoal/10 bg-white md:hidden`}>
          <nav aria-label="Mobile primary" className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-sm font-medium lg:px-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-3 transition-colors hover:bg-nexa_nude hover:text-nexa_orange"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href={ui.applyPath} className="mt-2" fullWidth onClick={() => setIsOpen(false)}>
              {ui.nav.applyNow}
            </Button>
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
              <Link key={link.href} href={link.href} className="hover:text-nexa_orange">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
