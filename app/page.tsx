"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage as Bubble } from "@/components/chat-message";
import { GameCard } from "@/components/game-card";
import { SettingsMenu } from "@/components/settings-menu";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

type GameItem = {
  teamName: string;
  opponent: string;
  homeAway: "Home" | "Away";
  competition: string;
  datetimeUTC: string | null;
  venue?: string | null;
  teamLogoUrl?: string | null;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [games, setGames] = useState<GameItem[]>([]);
  const [model, setModel] = useState("sonar-pro");

  // Load persisted model preference from localStorage
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("model") : null;
    if (stored) setModel(stored);
  }, []);

  // Persist model preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("model", model);
    }
  }, [model]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  // Load dynamic games on first render when no chat yet
  useEffect(() => {
    let cancelled = false;
    async function loadGames() {
      try {
        const res = await fetch("/api/games", { cache: "no-store" });
        const data = await res.json();
        const itemsRaw: GameItem[] = Array.isArray(data?.items) ? (data.items as GameItem[]) : [];
        // Ensure Inter Miami always appears with a placeholder when no next event is returned
        let list: GameItem[] = itemsRaw;
        const hasInterMiami = list.some((g) => {
          const name = (g?.teamName || (g as unknown as { team?: string })?.team || "").toString().trim().toLowerCase();
          return name === "inter miami" || name === "inter miami cf";
        });
        if (!hasInterMiami) {
          list = [
            ...list,
            {
              teamName: "Inter Miami",
              opponent: "TBD",
              homeAway: "Home",
              competition: "MLS",
              datetimeUTC: null,
              venue: null,
              teamLogoUrl: null,
            },
          ];
        }
        if (cancelled) return;
        setGames(list);
      } catch {
        // swallow; UI will just show without games
      }
    }
    if (messages.length === 0) {
      loadGames();
    }
    return () => {
      cancelled = true;
    };
  }, [messages.length]);

  // Allow programmatic sends (e.g., clicking a game card)
  async function sendText(text: string, displayText?: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    const nextMessages: ChatMessage[] = [
      ...messages,
      // Show a friendlier message if provided; otherwise show the raw text
      { role: "user", content: displayText || trimmed },
    ];
    // Add placeholder assistant message for streaming updates
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, model }),
      });
      if (!res.body) {
        throw new Error("No response body");
      }
      const reader = res.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      // Parse the server-sent event stream and update the last message
      // in state as new tokens arrive.
      let assistant = "";
      let buffer = "";
      const citations: string[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            if (json.type === "text-delta" && typeof json.delta === "string") {
              assistant += json.delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: assistant,
                };
                return updated;
              });
            } else if (json.type === "source-url" && typeof json.url === "string") {
              citations.push(json.url);
            }
          } catch {
            /* ignore */
          }
        }
      }
      if (citations.length > 0) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            citations,
          };
          return updated;
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Error: ${message}`,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    await sendText(input);
  }

  

  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr]">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur px-6 py-2 md:py-1">
        <div className="max-w-3xl mx-auto flex items-center gap-3 border-b">
          <h1 className="m-0 text-sm font-semibold tracking-[-0.01em]">
            Ask Replay!
          </h1>
          <div className="ml-auto flex items-center gap-1">
            <button
              aria-label="Clear chat"
              className="h-8 px-3 text-xs rounded-md transition-colors disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setMessages([])}
              disabled={isLoading}
            >
              Clear
            </button>
            <SettingsMenu value={model} onChange={setModel} />
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
                {games.map((g, idx) => {
                  const localDate = (() => {
                    if (!g.datetimeUTC) return "TBD";
                    try {
                      const d = new Date(g.datetimeUTC);
                      const opts: Intl.DateTimeFormatOptions = {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      };
                      return new Intl.DateTimeFormat(undefined, opts).format(d);
                    } catch {
                      return "TBD";
                    }
                  })();

                  const teamDisplay = g.teamName;
                  return (
                    <GameCard
                      key={`${teamDisplay}-${idx}`}
                      teamName={teamDisplay}
                      opponent={g.opponent}
                      homeAway={g.homeAway}
                      competition={g.competition}
                      datetimeLocal={localDate}
                      venue={g.venue || undefined}
                      teamLogoUrl={g.teamLogoUrl || undefined}
                      onClick={() =>
                        sendText(
                          `Tell me more about this ${teamDisplay} vs ${g.opponent} game`,
                          `Tell me more about the ${teamDisplay} game`
                        )
                      }
                    />
                  );
                })}
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
