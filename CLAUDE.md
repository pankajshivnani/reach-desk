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
Picked by Pankaj on 2026-10-14 (see DECISIONS). Say who he is and why he's writing, one real thing noticed, a direct offer, an easy out. Short, lowercase, typed-on-a-phone. Never sounds automated.
- **#2 self-aware:** "hey {name}, i know you probably get a lot of these so i'll keep it short. / i'm pankaj, we help tech and finance companies grow on youtube. was going through {channel} and noticed {fact}. / if that's worth fixing, lmk. if not, all good"
- **#3 honest question:** "hey {name}, honest question. is youtube something you're actively trying to grow for {channel}, or more of a side thing? / asking cause i noticed a couple of things on the channel that could move views a fair bit. we do organic youtube growth for tech and finance companies."
- **#4 gives first:** "i'm pankaj. not trying to sell you anything in this one." + fact + test + "if it works and you want more of this, it's what we do :)"
- **#5 real compliment:** only when Pankaj typed something he genuinely liked; + "which is why it bugged me a bit that {fact}."
- Each has its own 2 follow-ups (day 3, day 7, same thread), different angle each time, never "bump".
- Sign off "pankaj". Subject = channel name or similar, lowercase. No links, no call ask, no sales words, no long dashes, no polished lists of three.
- Never invent: compliments and "watched the X ep" only from what Pankaj typed; facts only from channel data.
- Positioning: "tech and finance companies" (not only podcasts).
- Bulk queueing rotates templates (#2 and #3 twice as often) and records `template_version` so reply rates can be compared.

## End of session
Update `docs/STATUS.md` and `docs/DECISIONS.md`, then commit and push.
