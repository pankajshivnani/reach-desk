# Status

**Last updated:** 2026-10-13

## Where we are
- `prospect-finder-v5.html` committed untouched as the original.
- `reach-desk.html` = v5 + **step 1: per-channel analysis** (built, tested with fake data; not yet tested with a real API key).
  - "Analyse a channel" box: paste a link, @handle or channel ID. Also an "Analyse" button on every search result row.
  - Pulls channel info + last 30 uploads (~3 units). Saved in the browser for 24h; "Saved" chips reopen for free; "Refresh" re-pulls.
  - Shows: subs, long vs shorts (≤3 min), median views, days since last upload, avg gap, chapters on 20min+ videos, trailer yes/no, contacts (emails, LinkedIn, X, Instagram, sites), top 5 vs latest 5 thumbnails, full video table (sortable).
  - Warns when fewer than 10 videos.
  - Quota counter under the Keys box (counts calls from this browser only).

## Next steps
1. Pankaj tests step 1 with his real key on the 5 known channels (AI Island, SyndicateRoom, Venture Atlanta, Capital Allocators, Scaling Europe). Check the numbers match YouTube.
2. Build step 2: insight detection + scoring + cards (adjust views for video age).
3. Build step 3: notes box, template drafts, reply pitch, Loom notes.
4. Build step 4: sheet push with tracking columns.
5. Compare tool insights with what Pankaj saw by hand on the 5 channels.

## Waiting on
- Pankaj's real-key test of step 1.
