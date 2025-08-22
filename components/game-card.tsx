"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  teamName: string;
  opponent: string;
  homeAway: "Home" | "Away";
  competition: string;
  datetimeLocal: string;
  venue?: string;
  storyline?: string;
  storylineLoading?: boolean;
  teamLogoUrl?: string;
  onClick?: () => void;
};

export function GameCard({
  teamName,
  opponent,
  homeAway,
  competition,
  datetimeLocal,
  venue,
  storyline,
  storylineLoading,
  teamLogoUrl,
  onClick,
}: Props) {
  const fallbackByTeam: Record<string, string | undefined> = useMemo(
    () => ({
      "Inter Miami":
        "https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/Inter_Miami_CF_logo.svg/64px-Inter_Miami_CF_logo.svg.png",
      "New York Yankees":
        "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png",
      "Barcelona":
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
      "FC Barcelona":
        "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
      "New York Knicks":
        "https://upload.wikimedia.org/wikipedia/en/2/25/New_York_Knicks_logo.svg",
    }),
    []
  );

  const [imgSrc, setImgSrc] = useState<string | undefined>(
    fallbackByTeam[teamName] || teamLogoUrl
  );
  const [triedFallback, setTriedFallback] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full overflow-hidden hover:shadow-md transition-shadow rounded-2xl border border-black/[.08] dark:border-white/[.12] focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
      aria-label={`${teamName} vs ${opponent} ${homeAway}`}
    >
      <div className="flex items-center gap-3 p-3">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={`${teamName} logo`}
            width={28}
            height={28}
            className="rounded-md object-contain bg-white dark:bg-white p-[2px]"
            unoptimized
            onError={() => {
              if (!triedFallback && fallbackByTeam[teamName]) {
                setImgSrc(fallbackByTeam[teamName]);
                setTriedFallback(true);
              } else {
                setImgSrc(undefined);
              }
            }}
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
        ) : storylineLoading ? (
          <div className="text-sm mt-2 border-l-2 border-black/[.08] dark:border-white/[.12] pl-3">
            Loading storyline…
          </div>
        ) : null}
      </div>
    </button>
  );
}


