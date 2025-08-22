"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toMarkdownWithCitationLinks } from "@/lib/citations";

type Role = "user" | "assistant" | "error";

type Props = {
  role: Role;
  content: string;
  citations?: string[];
};

export function ChatMessage({ role, content, citations }: Props) {
  const isUser = role === "user";
  const isError = role === "error";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm " +
          (isError
            ? "border border-red-500/50 bg-red-500/10"
            : isUser
            ? "bg-foreground text-background rounded-br-sm"
            : "bg-black/[.04] dark:bg-white/[.06] rounded-bl-sm")
        }
      >
        {role === "assistant" ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: (anchorProps) => (
                <a
                  {...anchorProps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 visited:text-purple-600 hover:opacity-80"
                />
              ),
            }}
          >
            {toMarkdownWithCitationLinks(content, citations)}
          </ReactMarkdown>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
        )}
      </div>
    </div>
  );
}


