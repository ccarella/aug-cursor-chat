import { NextResponse } from "next/server";

export const runtime = "edge";

type StorylineRequest = {
  items: Array<{
    teamName: string;
    opponent: string;
    competition?: string | null;
    datetimeUTC?: string | null;
    homeAway?: "Home" | "Away";
  }>;
};

function getApiKey(): string {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    throw new Error("Missing PERPLEXITY_API_KEY environment variable");
  }
  return key;
}

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey();
    const body = (await request.json().catch(() => ({}))) as StorylineRequest;
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json(
        { error: "Body must include items: { teamName, opponent }[]" },
        { status: 400 }
      );
    }

    const prompt = `Return ONE concise, single-sentence storyline for each of the following upcoming games. Keep it factual and current, avoid emojis, and do not include sources or extra commentary. Output as a compact JSON object that maps the team name to its one-sentence storyline. Only return the JSON, nothing else.

Teams and fixtures:\n${items
      .map((g) => `- ${g.teamName} vs ${g.opponent}${g.competition ? ` (${g.competition})` : ""}${g.datetimeUTC ? ` on ${g.datetimeUTC}` : ""}`)
      .join("\n")}`;

    const upstreamResponse = await fetch(
      "https://api.perplexity.ai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that returns exactly and only the JSON requested.",
            },
            { role: "user", content: prompt },
          ],
          stream: false,
          // No citations; we just want a one-sentence hook per team
          return_citations: false,
        }),
      }
    );

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      return NextResponse.json(
        {
          error: "Perplexity upstream error",
          status: upstreamResponse.status,
          detail: errText,
        },
        { status: 502 }
      );
    }

    const data = await upstreamResponse.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";

    // Try to parse returned JSON. If it fails, return raw string to help debugging.
    try {
      const json = JSON.parse(content);
      return NextResponse.json({ storylines: json }, { status: 200 });
    } catch {
      return NextResponse.json({ storylines: null, raw: content }, { status: 200 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


