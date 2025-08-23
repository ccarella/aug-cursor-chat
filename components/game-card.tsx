"use client";

import Image from "next/image";
import { useState } from "react";

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

const fallbackCandidatesByTeam: Record<string, string[]> = {
  // Candidates are ordered by preference
  "Inter Miami": [
    // TODO: Add official logo to /public/logos/inter-miami.png and use "/logos/inter-miami.png"
    // Temporary placeholder until official logo is added
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23FF69B4'/%3E%3Ctext x='32' y='32' text-anchor='middle' dominant-baseline='central' fill='black' font-family='Arial' font-size='12' font-weight='bold'%3EIM%3C/text%3E%3C/svg%3E",
  ],
  "New York Yankees": [
    "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png",
  ],
  "Barcelona": [
    "https://a.espncdn.com/i/teamlogos/soccer/500/83.png",
    "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  ],
  "FC Barcelona": [
    "https://a.espncdn.com/i/teamlogos/soccer/500/83.png",
    "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  ],
  "New York Knicks": [
    "https://a.espncdn.com/i/teamlogos/nba/500/nyk.png",
  ],
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
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    teamLogoUrl || fallbackCandidatesByTeam[teamName]?.[0]
  );
  const [triedFallback, setTriedFallback] = useState(false);
  const handleError = () => {
    const candidates = fallbackCandidatesByTeam[teamName] || [];
    const nextIndex = triedFallback ? fallbackIndex + 1 : 0;
    if (nextIndex < candidates.length) {
      setImgSrc(candidates[nextIndex]);
      setFallbackIndex(nextIndex);
      setTriedFallback(true);
    } else {
      setImgSrc(undefined);
    }
  };
  const isDataUrl = imgSrc?.startsWith("data:");
  const commonImageProps = {
    width: 28,
    height: 28,
    className: "rounded-md object-contain bg-white dark:bg-white p-[2px]",
    onError: handleError,
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full overflow-hidden hover:shadow-md transition-shadow rounded-2xl border border-black/[.08] dark:border-white/[.12] focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20"
      aria-label={`${teamName} vs ${opponent} ${homeAway}`}
    >
      <div className="flex items-center gap-3 p-3">
        {imgSrc ? (
          isDataUrl ? (
            <img src={imgSrc} alt={`${teamName} logo`} {...commonImageProps} />
          ) : (
            <Image src={imgSrc} alt={`${teamName} logo`} {...commonImageProps} />
          )
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


