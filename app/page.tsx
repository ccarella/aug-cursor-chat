"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
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
      setMessages((prev) => [...prev, { role: "assistant", content }]);
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

  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr,auto]">
      <header className="px-6 py-4 border-b border-black/[.08] dark:border-white/[.145]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-medium tracking-[-0.02em]">Chat</h1>
          <button
            className="text-xs underline opacity-70 hover:opacity-100"
            onClick={() => setMessages([])}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full flex flex-col">
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="opacity-60 text-sm">
              Start chatting. History resets on reload.
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className="whitespace-pre-wrap">
                <span className="font-mono text-xs px-2 py-1 rounded bg-black/[.05] dark:bg-white/[.06] mr-2">
                  {m.role === "user" ? "You" : "AI"}
                </span>
                {m.content}
              </div>
            ))
          )}
        </div>
      </main>

      <form
        onSubmit={sendMessage}
        className="max-w-3xl mx-auto w-full px-6 py-4 border-t border-black/[.08] dark:border-white/[.145]"
      >
        <div className="flex gap-2">
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
