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
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-hr:my-3 prose-blockquote:my-2 prose-pre:my-2">
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
                h1: (props) => <h2 {...props} className="mt-3 mb-2 text-lg font-semibold" />,
                h2: (props) => <h3 {...props} className="mt-3 mb-2 text-base font-semibold" />,
                h3: (props) => <h4 {...props} className="mt-3 mb-2 text-sm font-semibold" />,
                p: (props) => <p {...props} className="my-2 leading-relaxed" />,
                ul: (props) => <ul {...props} className="my-2 list-disc pl-5" />,
                ol: (props) => <ol {...props} className="my-2 list-decimal pl-5" />,
                li: (props) => <li {...props} className="my-1" />,
                code: (props) => <code {...props} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10" />,
                pre: (props) => (
                  <pre {...props} className="my-2 p-3 rounded bg-black/10 dark:bg-white/10 overflow-x-auto" />
                ),
                blockquote: (props) => (
                  <blockquote {...props} className="my-2 pl-3 border-l-2 border-black/10 dark:border-white/20" />
                ),
                hr: () => <hr className="my-3 border-black/10 dark:border-white/15" />,
              }}
            >
              {toMarkdownWithCitationLinks(content, citations)}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
        )}
      </div>
    </div>
  );
}


