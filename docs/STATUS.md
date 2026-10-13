# Status

**Last updated:** 2026-10-13

## Where we are
`reach-desk.html` = v5 search + a **lead panel** for every lead. Steps 1–3 of the spec are built and tested with fake data; **not yet tested with a real API key.** `prospect-finder-v5.html` stays as the untouched original.

- **Find prospects** now pulls each kept channel's last 30 uploads in the same calls it already made (no extra units). Every row shows its **best insight** (sortable) and an **Open lead** button.
- **Lead panel** (slides in from the right; Prev / Next to work through the list; Esc closes):
  - Contacts found in descriptions.
  - **Insight cards**: top 3 scored, rest under "more (use these in the Loom)". Weak ones marked "don't send"; "skip this lead" if nothing is strong.
  - **Your inputs** (saved per channel): host first name, episode you watched, ticks for "clips look AI edited" / "best moments need proper edits", notes.
  - **Drafts** for the chosen insight: up to 3 emails (no pitch), 3 DMs (podcast-dm style), reply pitch, day 3 / day 7 follow-ups, Loom notes. All editable, with copy buttons.
  - Channel data: stats, top 5 vs latest 5 thumbnails, the video table (with a "vs nearby" column).
- "Look up any channel" box for channels found elsewhere (about 3 units).
- Opt-in "remember key"; quota counter; search cost warning.

Insights detected: idea-first vs guest-name titles, what the top 5 share, titles over 60 chars, episode numbers up front, views dropping, hidden gem, topic winners, rising now, evergreen, shorts gap / shorts winning, length sweet spot, no chapters, no trailer, views after a posting break.

## Next steps
0. Pankaj: restrict the API key to YouTube Data API v3 only (Google Cloud Console > APIs & Services > Credentials).
1. Pankaj tests on the 5 known channels (AI Island, SyndicateRoom, Venture Atlanta, Capital Allocators, Scaling Europe): do the numbers match YouTube? Do the insights match what he saw? Which drafts would he actually send?
2. Tune thresholds/templates from that feedback (especially the guest-name detection).
3. Step 4: sheet push with tracking columns (insight used, sent date, follow-ups, replied, loom, call, paid).
4. Backup button: download/restore notes + saved channels as a file (everything currently lives in one browser only).

## Waiting on
- Pankaj's real-key test.
