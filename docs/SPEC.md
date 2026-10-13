# Reach Desk — Spec

## Goal
Turn 10 leads/day from ~3 hours of manual work into ~15 minutes, while making every email feel like it came from a sharp human who actually looked — not a marketing blast.

Pankaj's only manual job per lead: glance at the thumbnails, pick the best insight, add a voice-note line about what he saw (edits, vibe, a moment). The tool does the rest.

## Flow
1. **Find** — existing v5 search (YouTube API) → channel list
2. **Analyze** — per channel, pull last ~30 uploads + stats
3. **Insight cards** — detect, score, show top 3
4. **My notes** — his observation box
5. **Draft** — template email + reply pitch + Loom notes
6. **Track** — push to Google Sheet (webhook from v5)

## 1. Data to pull per channel
Channel: title, subscribers, country, description, links, trailer (`brandingSettings.channel.unsubscribedTrailer`), uploads playlist.
Each of last ~30 videos: title, publish date, duration, views, likes, comments, description, thumbnail URL. Mark shorts (≤ 3 min).

## 2. Insight types to detect
**Packaging**
1. Winners vs rest — what top 5 by views share that others don't: number in title, question, idea-first vs guest-name-first, episode number at start, length.
2. Guest-name-first / "Ep 42 with X" titles vs idea-led titles (likely the most common podcast insight).
3. Titles over ~60 chars (cut off on mobile).
4. Episode numbers wasting the first words.
5. Drift — older title style performed better than the current one.
6. Thumbnails: show top 5 vs latest 5 side by side for Pankaj to eyeball (no auto-judging).

**Hidden signals**
7. Hidden gem — high (likes+comments)/views but low views → "people loved it, packaging failed, repackage it".
8. Reach dropping — recent views/subs vs older.
9. Topic or guest winners — keywords that consistently pull views.
10. Rising now — video in its first days pulling well above the channel's normal pace.
11. Evergreen — old video still far above median.

**Format**
12. Shorts gap (no shorts in N days) or shorts outperforming long.
13. Length sweet spot (e.g. 20-min beats 90-min).
14. No chapters (no timestamps in descriptions of long videos).
15. No channel trailer.

**Consistency**
16. Posting gap + views before vs after it.

**Contacts**
17. Emails and LinkedIn/X/Instagram links found in channel + video descriptions.

## 3. Scoring
Each insight scored on:
- **Surprise** — would they probably not know this?
- **Proof** — backed by a number from their own channel
- **Easy fix** — can they act on it quickly
- **Goal fit** — ties to more views from the right audience

Show top 3 as plain-English cards with the numbers. Flag weak insights (fewer than 10 videos, gap under 2x) as **"don't send"**. If nothing is strong, say "skip this lead".

## 4. My notes
Free text box per channel. Saved locally.

## 5. Drafts (templates, no AI)
- 2–3 template variants per insight type, filled with real numbers, rotated so emails don't look identical.
- Format: see CLAUDE.md "Email style". Example:

  > subject: your top 5 videos
  >
  > hey {name}
  >
  > your 5 most viewed videos all lead with the idea in the title. the last 10 lead with the guest's name and average about a fifth of the views. worth testing.
  >
  > pankaj

- **Reply pitch** (for when they answer): "i do this for channels, a/b testing titles and thumbnails, clips, edits. found a few more things like this on yours, happy to share a loom."
- **Loom notes**: every insight not used in the email, as talking points.
- Copy buttons for subject and body.

## 6. Tracking
Push to Google Sheet: date, channel, host, email/links, insight used, sent date, follow up 1 (day 3), follow up 2 (day 7), replied, loom sent, call, paid.

## Later (not now)
- Name finder helpers (search links for host name)
- Follow-up drafts that add a new insight each time
