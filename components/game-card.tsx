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
  const fallbackByTeam: Record<string, string | undefined> = useMemo(
    () => ({
      "Inter Miami":
        "https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/Inter_Miami_CF_logo.svg/64px-Inter_Miami_CF_logo.svg.png",
      "New York Yankees":
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/NewYorkYankees_caplogo.svg/64px-NewYorkYankees_caplogo.svg.png",
    }),
    []
  );

  const [imgSrc, setImgSrc] = useState<string | undefined>(teamLogoUrl);
  const [triedFallback, setTriedFallback] = useState(false);
  return (
    <div className="overflow-hidden hover:shadow-md transition-shadow rounded-2xl border border-black/[.08] dark:border-white/[.12]">
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
        ) : null}
      </div>
    </div>
  );
}


