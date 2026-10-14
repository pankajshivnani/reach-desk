# Status

**Last updated:** 2026-10-14

## Where we are
`reach-desk.html` = v5 search + a **lead panel** for every lead. Steps 1–3 of the spec are built and tested with fake data; **not yet tested with a real API key.** `prospect-finder-v5.html` stays as the untouched original.

- **Find prospects** now pulls each kept channel's last 30 uploads in the same calls it already made (no extra units). Every row shows its **best insight** (sortable) and an **Open lead** button.
- **Lead panel** (slides in from the right; Prev / Next to work through the list; Esc closes):
  - Contacts found in descriptions.
  - **Insight cards**: top 3 scored, rest under "more (use these in the Loom)". Weak ones marked "don't send"; "skip this lead" if nothing is strong.
  - **Your inputs** (saved per channel): host first name, episode you watched, ticks for "clips look AI edited" / "best moments need proper edits", notes.
  - **Drafts** for the chosen insight: first emails #2 self-aware / #3 honest question / #4 gives first / #5 real compliment (needs the new "something you liked" field), each with its own 2 editable follow-ups; 3 DMs; reply-with-data; pitch; Loom notes.
  - Channel data: stats, top 5 vs latest 5 thumbnails, the video table (with a "vs nearby" column).
- "Look up any channel" box for channels found elsewhere (about 3 units).
- Opt-in "remember key"; quota counter; search cost warning.

Insights detected: idea-first vs guest-name titles, what the top 5 share, titles over 60 chars, episode numbers up front, views dropping, hidden gem, topic winners, rising now, evergreen, shorts gap / shorts winning, length sweet spot, no chapters, no trailer, views after a posting break.

## Sending (built 2026-10-13, not yet tried on real inboxes)
- `apps-script/Code.gs`: one script bound to the "Reach Desk Outbox" sheet. Each inbox runs `installSender()` once → sends from itself every 15 min inside the window, daily cap (default 4, follow-ups count), starred first, one email per company domain per day, follow-ups day 3 / day 7 in the same thread, stops on reply / bounce / opt-out, do-not-email list, pause switch, reply notifications to Pankaj's main email.
- Tested locally against a simulated Sheet + Gmail (21 checks pass: caps, window, no double sends, two inboxes never take the same lead, replies, opt-outs, out-of-office ignored, threading, weekends, pause).
- `reach-desk.html`: Outbox URL + token in Keys; per lead "Email to send to" + star; "Queue this email" on each email draft; "Queue picked to outbox" for ticked rows; Outbox status box (sends left today, queue, follow-ups due, replies, per-inbox status, days to clear the queue).
- Setup guide for Pankaj: `docs/SETUP-SENDING.md`.
- **Part A done (2026-10-13):** sheet "Reach Desk Outbox" made in the main account, script + Gmail service installed, `setup` run, notify_email set, web app deployed (version 2) and checked live (right token works, wrong token rejected; status is a POST so the token never sits in a URL).
- **Part B done (2026-10-13):** all 5 inboxes connected (business.shivnani, zizzytech, zizzytechnologies, pankajshivnani.ai, organicallly @gmail.com): sheet shared as Editor (no notify), `installSender` + `testSend` run in each, all listed in the Inboxes tab, timers running with no errors.

- **Deliverability (2026-10-14):** first real test landed in spam. Ran seed tests (`seedTest` + "Tests" tab + `seed_emails` setting) and switched the first email to a question with no stats; data goes in the reply. One follow-up only (`fu2_days` 0), `daily_cap` 2 while warming up. Later the same day: new first emails picked by Pankaj (#2/#3/#4/#5, each with 2 follow-ups, rotated across leads); `seedTest` round 2 + `seedFollowUps` to check follow-ups land too. See DECISIONS.

## Next steps
0. Pankaj: restrict the YouTube key (Google Cloud Console > APIs & Services > Credentials > API restrictions > YouTube Data API v3).
1. Pankaj: queue the first real leads (starred best ones), 2/inbox/day. Watch replies. After 15–20 sends with zero replies, stop and rethink. Optional: 2–3 friends' Gmail/Outlook as unbiased seed inboxes.
2. Pankaj tests insights on the 5 known channels (AI Island, SyndicateRoom, Venture Atlanta, Capital Allocators, Scaling Europe) and says which drafts he'd send.
3. Tune thresholds/templates from that feedback (especially guest-name detection).
4. Apollo CSV export/import for missing emails (free-plan friendly).
5. Dashboard: reply rate by insight type / template. Optional generic-vs-insight test.
6. Backup button (notes + saved channels to a file).

## Waiting on
- First real sends and replies.
