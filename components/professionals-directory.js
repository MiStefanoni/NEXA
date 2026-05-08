"use client";

import { useMemo, useState } from "react";
import { CATEGORY_ORDER, getCategoryMeta, getLangConfig, getLocationMode, matchesDirectorySearch } from "../lib/nexa-data";
import { ProfessionalCard } from "./cards";

export function ProfessionalsDirectory({ profiles, lang }) {
  const ui = getLangConfig(lang);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const sections = useMemo(
    () =>
      CATEGORY_ORDER.map((slug) => ({
        slug,
        meta: getCategoryMeta(slug, lang),
        profiles: profiles.filter((profile) => {
          if (profile.category_slug !== slug) return false;
          const matchesAvailability = filter === "all" || getLocationMode(profile) === filter;
          return matchesAvailability && matchesDirectorySearch(profile, query.trim().toLowerCase(), lang);
        }),
      })).filter((section) => section.profiles.length),
    [filter, lang, profiles, query],
  );

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/55">{ui.availability}</p>
          <div className="flex flex-wrap gap-3 text-sm font-semibold" aria-label={ui.availability}>
            {[
              { id: "all", label: ui.all },
              { id: "remote", label: ui.remote },
              { id: "local", label: ui.local },
            ].map((option) => {
              const isActive = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setFilter(option.id)}
                  className={`rounded-full border px-4 py-2 shadow-soft transition-colors ${
                    isActive
                      ? "border-teal bg-mist text-teal"
                      : "border-charcoal/15 bg-white hover:border-teal hover:text-teal"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="w-full lg:max-w-md">
          <label htmlFor="directory-search" className="sr-only">
            {ui.professionalsPage.searchPlaceholder}
          </label>
          <input
            id="directory-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui.professionalsPage.searchPlaceholder}
            className="w-full rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-sm shadow-soft outline-none placeholder:text-charcoal/40 focus:border-teal"
          />
        </div>
      </div>
      <div className="mt-14 space-y-14">
        {sections.length ? (
          sections.map((section) => (
            <section key={section.slug} id={section.slug}>
              <div className="mb-6 max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">{section.meta.title}</p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {section.profiles.map((profile) => (
                  <ProfessionalCard key={profile.slug} profile={profile} lang={lang} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-3xl bg-white p-8 text-base text-charcoal/75 shadow-soft">{ui.directoryEmpty}</div>
        )}
      </div>
    </>
  );
}
