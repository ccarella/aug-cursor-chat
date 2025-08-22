"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage as Bubble } from "@/components/chat-message";
import { GameCard } from "@/components/game-card";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  // Allow programmatic sends (e.g., clicking a game card)
  async function sendText(text: string, displayText?: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    const nextMessages: ChatMessage[] = [
      ...messages,
      // Show a friendlier message if provided; otherwise show the raw text
      { role: "user", content: (displayText || trimmed) },
    ];
    setMessages(nextMessages);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      const rawCitations =
        data?.citations ??
        data?.choices?.[0]?.message?.citations ??
        data?.choices?.[0]?.message?.metadata?.citations ??
        [];
      const citations: string[] = Array.isArray(rawCitations)
        ? rawCitations
            .map((item: unknown) => {
              if (typeof item === "string") return item;
              if (item && typeof item === "object") {
                const maybe = item as { url?: unknown };
                return typeof maybe.url === "string" ? maybe.url : null;
              }
              return null;
            })
            .filter((u: string | null): u is string => Boolean(u))
        : [];

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content, citations },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    await sendText(input);
  }

  function toMarkdownWithCitationLinks(content: string, citations?: string[]) {
    if (!citations || citations.length === 0) return content;
    // Replace bare numeric references like [1] with markdown links [1](url),
    // but avoid touching already-linked patterns like [1](http...) using a negative lookahead for '('.
    return content.replace(/\[(\d+)\](?!\()/g, (match, p1) => {
      const ordinal = parseInt(p1, 10);
      const url = citations[ordinal - 1];
      // Escape brackets in the link label so the rendered text shows [n]
      return url ? `[\\[${ordinal}\\]](${url})` : match;
    });
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr]">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur px-6 py-2 md:py-1">
        <div className="max-w-3xl mx-auto flex items-center gap-3 border-b">
          <h1 className="m-0 text-sm font-semibold tracking-[-0.01em]">
            Ask Replay!
          </h1>
          <div className="ml-auto">
            <button
              aria-label="Clear chat"
              className="h-8 px-3 text-xs rounded-md transition-colors disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setMessages([])}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full flex flex-col pb-24">
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {messages.length === 0 ? (
            <>
              <div className="text-sm opacity-70 mb-2">Upcoming games</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GameCard
                  teamName="FC Barcelona"
                  opponent="Getafe"
                  homeAway="Home"
                  competition="LaLiga"
                  datetimeLocal="Sat, Aug 23 • 2:00 PM"
                  storyline="Yamal back from knock; midfield rotation watch"
                  teamLogoUrl="https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"
                  onClick={() =>
                    sendText(
                      `Tell me more about this game and Yamal back from knock; midfield rotation watch`,
                      `Tell me more about the FC Barcelona game`
                    )
                  }
                />
                <GameCard
                  teamName="Inter Miami"
                  opponent="Atlanta United"
                  homeAway="Away"
                  competition="MLS"
                  datetimeLocal="Sun, Aug 24 • 6:30 PM"
                  storyline="Messi minutes? Tata vs. ATL narrative heats up"
                  teamLogoUrl="https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/Inter_Miami_CF_logo.svg/64px-Inter_Miami_CF_logo.svg.png"
                  onClick={() =>
                    sendText(
                      `Tell me more about this game and Messi minutes? Tata vs. ATL narrative heats up`,
                      `Tell me more about the Inter Miami game`
                    )
                  }
                />
                <GameCard
                  teamName="New York Yankees"
                  opponent="Red Sox"
                  homeAway="Home"
                  competition="MLB"
                  datetimeLocal="Fri, Aug 22 • 7:05 PM EDT"
                  storyline="Cole vs. Sale — rubber match vibes"
                  teamLogoUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/NewYorkYankees_caplogo.svg/64px-NewYorkYankees_caplogo.svg.png"
                  onClick={() =>
                    sendText(
                      `Tell me more about this game and Cole vs. Sale — rubber match vibes`,
                      `Tell me more about the New York Yankees game`
                    )
                  }
                />
                <GameCard
                  teamName="New York Knicks"
                  opponent="Celtics"
                  homeAway="Away"
                  competition="NBA (Preseason)"
                  datetimeLocal="Oct 2 • 7:30 PM"
                  storyline="New-look bench unit preview"
                  teamLogoUrl="https://upload.wikimedia.org/wikipedia/en/2/25/New_York_Knicks_logo.svg"
                  onClick={() =>
                    sendText(
                      `Tell me more about this game and New-look bench unit preview`,
                      `Tell me more about the New York Knicks game`
                    )
                  }
                />
              </div>
            </>
          ) : (
            <>
              {messages.map((m, idx) => (
                <Bubble key={idx} role={m.role} content={m.content} citations={m.citations} />
              ))}
              {isLoading && (
                <div className="w-full flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 shadow-sm bg-black/[.04] dark:bg-white/[.06] rounded-bl-sm">
                    <div className="typing" aria-label="Assistant is typing" aria-live="polite" role="status">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <form
        onSubmit={sendMessage}
        className="fixed bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur shadow-md border-t border-black/[.08] dark:border-white/[.145]"
      >
        <div className="max-w-3xl mx-auto w-full px-6 py-4 flex gap-2">
          <input
            className="flex-1 h-11 px-3 rounded-md bg-black/[.04] dark:bg-white/[.06] outline-none focus:ring-2 ring-black/10 dark:ring-white/20"
            placeholder="Ask anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="h-11 px-4 rounded-md bg-foreground text-background disabled:opacity-50"
            disabled={isLoading || input.trim().length === 0}
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
