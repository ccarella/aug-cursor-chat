import { NextResponse } from "next/server";

export const runtime = "edge";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
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

    const body = await request.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages
      : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Request body must include messages: ChatMessage[]" },
        { status: 400 }
      );
    }

    // Force a system instruction to ensure web results are used each turn.
    const systemPreamble: ChatMessage = {
      role: "system",
      content:
        "You are a helpful assistant that ALWAYS uses fresh web results in reasoning and cites sources. If web data is unavailable, state that explicitly.",
    };

    const upstreamResponse = await fetch(
      "https://api.perplexity.ai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar-pro",
          // Prepend our system message to guarantee search-centric behavior
          messages: [systemPreamble, ...messages],
          // Non-streaming for simple verification via curl; we'll add streaming in UI step
          stream: false,
          // Encourage citations so users see sources from web search
          return_citations: true,
        }),
      }
    );

    if (!upstreamResponse.ok) {
      const errText = await upstreamResponse.text();
      return NextResponse.json(
        {
          error: "Upstream error",
          status: upstreamResponse.status,
          detail: errText,
        },
        { status: 502 }
      );
    }

    const data = await upstreamResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


