# Reach Desk

Local tool for Zizzy (Pankaj's agency) to find YouTube channels/podcasts, analyze them, surface sharp data-backed insights, and draft very short outreach emails.

## Read first, every session
1. `docs/STATUS.md` — where we are, what's next
2. `docs/SPEC.md` — what we're building
3. `docs/DECISIONS.md` — what's already decided (don't re-decide)

## Who you're working with
- Pankaj is a non-coder. Explain simply, few words, no jargon (if a term is needed, explain it in one line).
- Give exact Terminal commands when he needs to run something, and say where to paste them.
- Push back directly if something is a bad idea.

## Hard rules
- **No Claude/OpenAI/any LLM API.** Only the YouTube Data API v3 (his own key). Everything runs locally in the browser.
- **Never invent numbers.** Every insight must come from real channel data. If data is thin, say so.
- **Respect YouTube quota** (10,000 units/day): cache results; search costs 100 units, video/playlist/channel lookups cost 1.
- API keys never get committed. Keys are typed into the page and kept in the browser only.
- Build on `prospect-finder-v5.html` (his existing tool) — don't throw it away.
- Build in small working steps. After each step: tell him how to open and test it, then commit and push.

## Email style (for the draft templates)
- subject: 2–4 lowercase words about them ("your top 5 videos")
- "hey {name}", then one fact with a number from their channel + one test to try. ~40 words.
- all lowercase, raw, like typed on a phone. No links, no "i help", no services list, no call ask, no sales words ("scale", "leverage", "quick call", "hope this finds you well").
- sign off: "pankaj"
- Pitch only goes in the REPLY (after they answer).

## End of session
Update `docs/STATUS.md` and `docs/DECISIONS.md`, then commit and push.
