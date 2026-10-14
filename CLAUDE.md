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
- **No Claude/OpenAI/any LLM API.** Only the YouTube Data API v3 (his own key). The tool runs locally in the browser; sending runs as Google Apps Script inside Pankaj's own Google accounts (`apps-script/`, see `docs/SETUP-SENDING.md`).
- **Never invent numbers.** Every insight must come from real channel data. If data is thin, say so.
- **Respect YouTube quota** (10,000 units/day): cache results; search costs 100 units, video/playlist/channel lookups cost 1.
- API keys never get committed. Keys are typed into the page and kept in the browser only.
- Build on `prospect-finder-v5.html` (his existing tool) — don't throw it away.
- Build in small working steps. After each step: tell him how to open and test it, then commit and push.

## Email style (for the draft templates)
- **First email = a short question, no stats** (decided 2026-10-14 after spam tests, see DECISIONS): "hey {name}, are you the one looking after the youtube side of {channel}?" + "noticed something in your last N episodes, happy to share if it's useful." ~30 words.
- subject: 2–4 lowercase words about them ("{channel} on youtube")
- all lowercase, raw, like typed on a phone. No links, no "i help", no services list, no call ask, no sales words ("scale", "leverage", "quick call", "hope this finds you well").
- sign off: "pankaj shivnani" / "zizzy" on the first email (real identity); "pankaj" in replies.
- **When they reply:** one fact with a number from their channel + one test to try, offer a loom.
- Pitch only after that.
- One follow-up only (day 3). Deliverability first: if in doubt, send less.

## End of session
Update `docs/STATUS.md` and `docs/DECISIONS.md`, then commit and push.
