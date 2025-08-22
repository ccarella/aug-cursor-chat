"use client";

import Image from "next/image";

type Props = {
  teamName: string;
  opponent: string;
  homeAway: "Home" | "Away";
  competition: string;
  datetimeLocal: string;
  venue?: string;
  storyline?: string;
  teamLogoUrl?: string;
};

export function GameCard({
  teamName,
  opponent,
  homeAway,
  competition,
  datetimeLocal,
  venue,
  storyline,
  teamLogoUrl,
}: Props) {
  return (
    <div className="overflow-hidden hover:shadow-md transition-shadow rounded-2xl border border-black/[.08] dark:border-white/[.12]">
      <div className="flex items-center gap-3 p-3">
        {teamLogoUrl ? (
          <Image
            src={teamLogoUrl}
            alt={`${teamName} logo`}
            width={28}
            height={28}
            className="rounded-md object-contain bg-white dark:bg-white p-[2px]"
          />
        ) : (
          <div className="size-7 rounded-md bg-black/[.06] dark:bg-white/[.08]" />
        )}
        <div className="flex flex-col">
          <div className="text-base font-medium leading-tight">{teamName}</div>
          <div className="text-xs opacity-70">{competition}</div>
        </div>
        <div className="ml-auto text-xs px-2 py-1 rounded bg-black/[.06] dark:bg-white/[.08]">
          {homeAway}
        </div>
      </div>
      <div className="p-3 space-y-1">
        <div className="text-sm font-medium">vs {opponent}</div>
        <div className="text-sm opacity-70">
          {datetimeLocal}
          {venue ? ` • ${venue}` : ""}
        </div>
        {storyline ? (
          <div className="text-sm mt-2 border-l-2 border-black/[.08] dark:border-white/[.12] pl-3">
            {storyline}
          </div>
        ) : null}
      </div>
    </div>
  );
}


