"use client";

import { useMemo, useState } from "react";
import { getLangConfig, matchesAvailabilityFilter } from "../lib/nexa-data";
import { ProfessionalCard } from "./cards";
import { Button } from "./design-system/button";

export function FeaturedProfiles({ profiles, lang, limit = 3 }) {
  const ui = getLangConfig(lang);
  const [filter, setFilter] = useState("all");

  const selected = useMemo(() => {
    const matches = (profile) => matchesAvailabilityFilter(profile, filter);
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
              <Button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(option.id)}
                variant={isActive ? "chipActive" : "chip"}
                size="sm"
                className="rounded-full shadow-soft"
              >
                {option.label}
              </Button>
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
