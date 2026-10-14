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
- **Pankaj's own voice** (decided 2026-10-14, from the podcast emails he actually sent; see DECISIONS): "hey {name}, watched the {guest} ep. {something he genuinely liked}. feel a lot more juice can be taken out of these episodes." + one fact with a number from their channel + what to do (a/b testing titles and thumbnails; trailer / chapter cuts only if the data shows they're missing; proper edits on the banger moments only if he ticked it) + "can share a loom if you want :)" + "cheers, / pankaj".
- all lowercase, raw, like typed on a phone. No links, no services list, no call ask, no sales words ("scale", "leverage", "quick call", "hope this finds you well"). No "i help" in the first email.
- Never invent: "watched the X ep" only when he picked the episode; the compliment only when he typed it.
- Subject: 1–3 lowercase words (channel name, "your episodes").
- Versions in the tool: classic (default), data first, short, question (safest: no stats, data goes in the reply).
- One follow-up only (day 3), his words: "hey {name}, just following up on the last mail. hope i'm not troubling :)".
- Pitch only after they reply. Deliverability first: if in doubt, send less.

## End of session
Update `docs/STATUS.md` and `docs/DECISIONS.md`, then commit and push.
