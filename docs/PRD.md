# Sonar Sports Buddy Chat — Product Requirements Document (PRD)

## 1. Overview

Sonar Sports Buddy is a lightweight, citation-first sports chat companion. It helps fans—especially those who support FC Barcelona, Inter Miami CF, New York Yankees, and New York Knicks—get quick, credible answers about schedules, scores, injuries, odds, storylines, and where-to-watch. The app emphasizes clarity, trustworthy sourcing, and a friendly fan tone.

This PRD captures the v1 goals, scope, UX, technical architecture, metrics, and risks for the current product implemented in this repository.

## 2. Problem Statement

Sports information is fragmented across news, league sites, social, and data providers. Fans waste time context-switching and risk outdated or unreliable info. They need a fast, credible, single-entry chat that:

- Answers sports questions with up-to-date web results
- Clearly cites sources
- Adopts a friendly, fan-aligned tone

## 3. Objectives & Success Criteria

- Accuracy and recency: Answers should reflect current schedules, injuries, and news; include citations for time-sensitive claims.
- Speed: Perceived response time under ~3 seconds P50 (non-streaming v1), <6 seconds P90.
- Clarity: Responses follow a consistent format (Quick Take, Deeper Dive, Optional Next Steps).
- Trust: ≥80% of responses that contain time-sensitive claims include at least one reputable citation link.
- Usability: Users can ask a question and see a clear answer with source links in a single screen.

## 4. Target Users & Personas

- Everyday fan: Wants quick scores, next matches, injuries, and viewing info without digging.
- Informed fan: Appreciates brief probabilities and tactical context.
- Multi-team follower: Tracks favorite teams (Barça, Inter Miami, Yankees, Knicks) but asks occasional league-wide or opponent questions.

## 5. Key Use Cases

1. Greeting or generic opener (e.g., “hey”) → small dashboard of upcoming games for the four teams with one storyline each.
2. “Did Barça win?” → latest result, competition, clearly labeled Final, key scorers, brief context + source.
3. “Knicks injuries?” → current injury list with timestamps/sources and how it affects rotations.
4. “Yankees odds tonight” → estimated probabilities, likely starters, recent form/park factors + sources.
5. “What’s next for Inter Miami?” → next 1–3 fixtures with date/time in user’s local timezone, competition, home/away, and brief context.
6. “Where to watch?” → likely broadcasters/streams; note regional/blackout uncertainty when applicable.

## 6. Scope (v1)

Must have:
- Chat interface (single room) with user/assistant messages
- Calls to Perplexity `sonar-pro` with a specialized system prompt for Sonar Sports Buddy
- Forced instruction to use fresh web results each turn
- Citations returned and rendered as clickable links
- Greeting behavior: upcoming games dashboard for the four favorite teams
- Clear error handling for upstream or network failures
- Minimal, accessible UI (Dieter Rams–inspired: simple, readable, no ornament)

Should have:
- Markdown rendering for assistant content (tables, links)
- Automatic local timezone in outputs (default to America/Tegucigalpa if unknown)
- “Clear” button to reset conversation

Could (later):
- Streaming responses
- Persistent conversation history and sessions
- Team preferences editor
- Where-to-watch localization by region
- Integration with telemetry and analytics

Non-goals (v1):
- Account system and authentication
- Payments or subscriptions
- Full-blown editorial content management
- Advanced personalization beyond the fixed favorite teams in the system prompt

## 7. Content & Tone Requirements

- Assume sports context by default unless user explicitly asks otherwise.
- Friendly, knowledgeable fan who shares the same teams; never smug.
- Reply shape:
  - Quick Take: 1–3 sentences with the headline answer.
  - Deeper Dive: short bullets or brief paragraph with context, key stats, injuries, implications.
  - Optional Next Steps: a gentle follow-up (e.g., “Want projected lineup?”).
- Use minimal, relevant emojis only (⚽️🏀⚾️). Avoid overuse.
- When uncertain: state uncertainty and explain why. Never fabricate stats, lineups, or quotes.
- For time-sensitive items (news/injuries/odds): include citations, and call out disagreements.

## 8. User Experience (UX) Requirements

- Single-page chat UI with:
  - Header: title and a “Clear” action
  - Scrollable message list with sticky input area
  - Distinct tags for User vs AI messages
  - Markdown rendering for assistant
  - Hyperlinked numeric citations like [1] → [1](url)
- Design language: clean, high-contrast, focused on content; no extraneous elements.
- Accessibility: keyboard submit, focus styles, labels/roles where needed.
- Dark mode via system preference (already supported via CSS variables).

## 9. Product Flow

1) User types a message and submits
2) Frontend posts `messages` array to `/api/chat`
3) Server (Edge runtime) calls Perplexity Chat Completions with:
   - `model: "sonar-pro"`
   - `messages`: [Sonar Sports Buddy system prompt, web-results preamble, user convo]
   - `return_citations: true`
   - `stream: false` (v1)
4) Server returns upstream JSON to client
5) Client extracts `content` and `citations` (from top-level or message metadata)
6) Client renders assistant message; replaces bare numeric refs with links
7) Errors are surfaced inline as assistant messages prefixed with “Error: …”

## 10. Functional Requirements

- FR1: User can send messages and receive AI responses.
- FR2: AI responses include citation links when time-sensitive info is present.
- FR3: On greetings/generic openers, AI replies with upcoming games dashboard for the four favorite teams.
- FR4: All date/times are explicit and in the user’s local timezone; default `America/Tegucigalpa (UTC−06:00)` if not specified.
- FR5: “Clear” control resets the in-memory conversation.
- FR6: Network or upstream errors are gracefully handled and visible to the user.

## 11. Technical Architecture (current)

- Framework: Next.js 15 (App Router), React 19
- Runtime: Edge for the chat API route
- Client: `app/page.tsx` renders chat UI and calls `/api/chat`
- Server: `app/api/chat/route.ts` constructs messages and calls Perplexity
- Styling: Tailwind v4 via `@tailwindcss/postcss` and CSS variables in `app/globals.css`
- Markdown: `react-markdown` with `remark-gfm`
- Deployment target: Vercel (recommended)
- Configuration:
  - Env: `PERPLEXITY_API_KEY` must be set (Vercel Project → Settings → Environment Variables)
  - `next.config.ts` uses defaults; edge runtime defined in route file

## 12. Performance, Reliability, Security

- Performance: Non-streaming responses; aim for sub-3s median when upstream is healthy.
- Reliability: Handle upstream 4xx/5xx; expose status and detail in error messages (sanitized).
- Security: Do not log API keys; keep `PERPLEXITY_API_KEY` server-side only; use Edge runtime.
- Privacy: No persistence of user messages in v1; conversation state is in-memory on the client.

## 13. Analytics & Metrics (v1 min)

- Latency: Request duration client→server→upstream→client (P50/P90)
- Error rate: % of requests with visible error messages
- Citation coverage: % of responses containing at least one citation when a claim is time-sensitive
- Link engagement: CTR on citation links (future)
- Retention proxy: average messages per session (client-only in v1)

## 14. Risks & Mitigations

- Upstream variance/outages → show clear errors; consider retries/backoff later.
- Hallucinations or outdated info → enforce web-results preamble; require citations; transparently state uncertainty.
- Regional broadcast ambiguity → explicitly note when coverage varies or blackouts may apply.
- Timezone confusion → always print explicit date, weekday, time, and timezone.

## 15. Rollout Plan

- Local dev: `npm run dev`, set `PERPLEXITY_API_KEY` in local env.
- Staging: Deploy to Vercel preview; set project env vars.
- Production: Promote once QA passes; monitor latency/error rate.

## 16. QA Verification (Manual)

Scenarios to test:
- Greeting-only input ("hey") → upcoming games dashboard with one storyline per team
- Time-sensitive query (injury/odds) → response with citations and timestamps
- Score query ("did Barça win?") → clearly labeled Final, competition, scorers + source
- Next fixtures ("what’s next for Inter Miami?") → 1–3 fixtures, dates with timezone
- Where-to-watch prompt → likely broadcasters with uncertainty note if applicable
- Clear button resets conversation; input disabled while sending; errors surfaced

Acceptance criteria:
- Consistent reply shape; links open in new tab; numeric references become links
- No unhandled errors in console; network failures show assistant error message

## 17. Future Work (Post-v1)

- Response streaming for faster perceived latency
- Conversation persistence and user accounts
- Editable team preferences and additional leagues/teams
- Rich components for standings, odds, and lineups
- Observability (logging, tracing, analytics)
- Rate limiting
- "No spoilers" mode

## 18. References

- System prompt and behavior: `app/api/chat/route.ts`
- Frontend chat UI: `app/page.tsx`
- Styling and fonts: `app/globals.css`, `app/layout.tsx`
- Deployment: Vercel recommended; set `PERPLEXITY_API_KEY`


