"use client";

import { useMemo, useState } from "react";
import { getLangConfig, getLocationMode } from "../lib/nexa-data";
import { ProfessionalCard } from "./cards";

export function FeaturedProfiles({ profiles, lang, limit = 3 }) {
  const ui = getLangConfig(lang);
  const [filter, setFilter] = useState("all");

  const selected = useMemo(() => {
    const matches = (profile) => filter === "all" || getLocationMode(profile) === filter;
    const featured = profiles.filter((profile) => profile.featured && matches(profile)).slice(0, limit);
    const fallback = profiles.filter(matches).slice(0, limit);
    return featured.length ? featured : fallback;
  }, [filter, limit, profiles]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
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
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {selected.length ? (
          selected.map((profile) => <ProfessionalCard key={profile.slug} profile={profile} lang={lang} />)
        ) : (
          <div className="rounded-3xl bg-white p-8 text-base text-charcoal/75 shadow-soft lg:col-span-3">
            {ui.featuredEmpty}
          </div>
        )}
      </div>
    </>
  );
}
