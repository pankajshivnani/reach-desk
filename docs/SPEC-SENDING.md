# Reach Desk — Sending spec (draft, 2026-10-13)

Status: **core built (2026-10-13)**: `apps-script/Code.gs` + queue/status in `reach-desk.html`. Setup: `docs/SETUP-SENDING.md`.

**Pankaj's answers:** 5 secondary Gmail inboxes (none is his main), 3–4 emails/day each (default 4). Apollo is probably the free plan, so emails are pasted by hand for now (CSV import later). Unanswered so far: target countries/timezone (set in the sheet), no-name rule (default: hold), generic-template test (not built).

**How the inboxes connect (as built):** one sheet, one script bound to it. Each inbox is an Editor on the sheet and runs `installSender()` once, which gives it its own 15-minute timer that runs *as that inbox*. Inboxes are not assigned up front: whichever inbox has room claims the next queued lead (claim, wait, re-check, so two inboxes never take the same lead). Selecting more than today's capacity is fine: the rest waits for the next days.

## Goal
Send a small, steady number of cold emails every weekday (about 20 sends/day total) from a few Gmail inboxes, with follow-ups and reply detection, **without paying for Instantly/Smartlead**. Pankaj spends his time only on the best leads and on replies.

## First principles
1. **Replies come from relevance, not volume.** At 20/day, every email has to earn its place. The tool already writes a lead-specific email automatically, so personalising costs nothing. Sending one generic message to everyone throws away the only edge we have.
2. **Pankaj's time is the scarce thing, not emails.** He should only (a) skim and approve, and (b) handle replies. Everything else runs by itself.
3. **Protect the inboxes.** A suspended Gmail costs more than a missed lead. Low volume, plain text, no links, no tracking pixels, spaced-out sends, and stop the moment someone replies.
4. **Runs while the laptop is off.** Sending can't depend on a browser tab being open, so the sending happens in Google's cloud (Apps Script), not in the page.
5. **One source of truth:** a Google Sheet. The tool writes to it, the senders read it, and Pankaj can see and edit everything in it.

## The pieces
| Piece | What it does | Cost |
|---|---|---|
| **Reach Desk page** (this repo, in the browser) | Find leads, insights, drafts, approve, push to the queue, show status | free |
| **Google Sheet** "Reach Desk Outbox" | Queue + tracking (one row per lead) | free |
| **Sender script**: one script bound to the sheet; each inbox installs its own timer | Every 15 min: send what's due from its own rows, send follow-ups in the same thread, detect replies and bounces, write the status back to the sheet | free |
| **Apollo** | Find the email + first name when the channel doesn't show one | Pankaj's existing plan |

Why Apps Script and not "connect Gmail to the page": a page can only send while it's open, and Google makes plain web pages go through a heavy app-approval process to send mail. A script inside each Gmail account sends as that account with one "Allow" click, keeps running on Google's servers, and is free.

## The flow
1. **Find**: Find prospects (as now). Every lead gets insights + drafts automatically.
2. **Triage (Pankaj, ~10 sec per lead)**: a list view sorted by best insight. Per lead: ✅ Approve / ⏭ Skip / ⭐ Hand-pick (a ⭐ lead gets his personal look: notes, watched episode, his own edits).
   - Bulk action: "approve all with a sendable insight scoring ≥ X". He still sees the list before it goes.
   - Leads with **no strong insight are skipped**, not sent a generic email (see experiment below).
3. **Contacts**:
   - The email and name found in channel/video descriptions are filled in automatically.
   - Missing ones → **Export for Apollo** (CSV: channel, website domain, LinkedIn). Pankaj enriches in Apollo → **Import** the CSV back (email, first name). The tool matches rows by channel.
   - Later, if his Apollo plan includes API access: an "Find in Apollo" button calls Apollo through a small Apps Script (keeps the Apollo key off the page and gets around browser blocks).
   - A lead with no email can't be queued. A lead with no first name gets "hey" (or is held back, his choice).
4. **Queue**: "Send to outbox" writes one row per approved lead to the sheet: email, name, subject, body, follow-up 1, follow-up 2, the insight used, and the template version. The tool assigns an inbox (round-robin, respecting each inbox's daily cap).
5. **Send (automatic)**: each sender script, every 15 minutes, on weekdays only, inside the sending window:
   - sends at most 1 email per run and never more than its daily cap. Random gaps of at least ~30 min between sends.
   - writes the sent time, Gmail thread ID and status `sent` to the sheet.
6. **Follow up (automatic)**: day 3 and day 7 (business days), as a **reply in the same thread** ("re: …"), only if nobody has replied.
   - day 3: "hey just checking if you saw this"
   - day 7: "all good if not interested. can still send the loom if you want"
7. **Stop rules (automatic)**: on each run the script checks every thread it owns:
   - any reply from them → status `replied`, all follow-ups cancelled, Pankaj gets a ping (a Gmail label "reach-desk/replied" + a sheet highlight).
   - a bounce (mailer-daemon) → status `bounced`, email marked bad.
   - a reply containing "not interested / unsubscribe / remove / stop" → status `opted-out`, added to the **do-not-email list**, which is checked before every send.
8. **Reply (Pankaj)**: he answers from Gmail himself using the reply pitch from the tool, then updates loom/call/paid in the sheet. The tool shows a small dashboard (sent / replied / bounced per inbox, per template, per insight type) by reading the sheet.

## Sending rules
- **Daily cap per inbox**: start at **2/day for the first 2 weeks**, then 3, then max **5**. Follow-ups count toward the cap.
- **Window**: weekdays, 9:00–17:00 in the recipient's timezone where we know the country, otherwise Pankaj's chosen default.
- **One email per recipient domain per day** (don't hit 3 people at one firm on the same morning).
- **Plain text only.** No links, no images, no open tracking, no attachments. Matches the email style anyway.
- **Never email the same address twice** in a new sequence. Global do-not-email list.
- **Kill switch**: a "PAUSE ALL" cell in the sheet that every script checks first.
- **Auto-pause an inbox** if 2+ bounces in a day or any Google warning email arrives.

## Volume math (be honest about this)
Each lead gets up to 3 emails (first + 2 follow-ups). In steady state, daily sends ≈ 3 × new leads per day (fewer once replies stop sequences).

| Inboxes × cap | Sends/day | New leads/day (approx) | New leads/week |
|---|---|---|---|
| 2 × 5 | 10 | ~4 | ~20 |
| 4 × 5 | 20 | ~7 | ~35 |
| 5 × 5 | 25 | ~8–9 | ~40–45 |

## Experiment: insight email vs generic
Pankaj wants to test whether a generic message does as well. Run it as a controlled test, not as the default:
- Each queued row records `template_version` (e.g. `insight-v1`, `generic-v1`).
- At most 20% of sends go to the generic arm; generic only goes to leads that *had* a sendable insight (so the comparison is fair).
- Judge on **reply rate after 50+ sends per arm**. The dashboard shows it.

## Sheet columns ("Outbox" tab)
`lead_id, date_added, channel, channel_url, country, host_name, email, email_source (description/apollo/manual), inbox, template_version, insight_type, insight_score, subject, body, fu1_body, fu2_body, status (queued/sent/fu1/fu2/replied/bounced/opted-out/done/paused), scheduled_for, sent_at, fu1_at, fu2_at, replied_at, thread_id, loom_sent, call, paid, notes`
Plus a `Do not email` tab (email, reason, date) and a `Settings` tab (pause all, per-inbox caps, window, timezone).

## Risks and guardrails
- **Gmail account suspension.** Google's Gmail rules forbid sending unsolicited bulk/commercial email from Gmail. Low-volume, one-to-one, personalised notes are much lower risk, but not zero.
  - **Do not use your main personal Gmail** (the one tied to everything else).
  - Creating many fresh Gmail accounts *just* to spread cold email is also against Google's terms and is what gets accounts flagged. 2 or 3 real secondary accounts is sensible; 5 brand-new ones is not.
  - Upgrade path when this works: a cheap separate domain (~$10/year) + Google Workspace inboxes (~$7/inbox/month). Same scripts, much safer, and your own name on a business address.
- **Legal (not legal advice):**
  - US: CAN-SPAM wants a real sender and a way to opt out. A plain line like "if this isn't relevant just say so and i won't email again" in follow-up 2 covers the opt-out, and the do-not-email list enforces it.
  - UK/EU: emailing a company address about a relevant business topic is generally treated as legitimate interest; personal addresses and sole traders are stricter. Keep records (the sheet does) and honour opt-outs immediately.
- **Wrong person / wrong name**: the name comes from Apollo or Pankaj; the tool never guesses a name.
- **Script quotas**: consumer Gmail via Apps Script allows ~100 recipients/day, far above our caps.

## What Pankaj does vs what's automatic
| Pankaj (≈15–20 min/day) | Automatic |
|---|---|
| Run a search, skim the list, approve/skip | Insights, scoring, drafts |
| Hand-pick 1–3 ⭐ leads and add a personal line | Contact extraction from descriptions |
| Apollo export/import for missing emails (until API) | Inbox assignment, scheduling, sending |
| Answer replies, send Looms | Follow-ups in thread, reply/bounce/opt-out detection, stop rules |
| | Dashboard: reply rate by template and insight |

## Build order (each a small working step)
- **4a. Sheet + one sender script** (the core): the script file in the repo, a setup guide, a test sending to Pankaj's own address. 1 inbox, cap 2.
- **4b. Queue from the tool**: approve/skip, "Send to outbox", inbox assignment, do-not-email check.
- **4c. Follow-ups + stop rules** in the script: threads, replies, bounces, opt-outs, kill switch.
- **4d. Apollo CSV export/import.**
- **4e. Dashboard** in the tool (reads the sheet).
- **4f. More inboxes** (same script copied into each), ramp schedule.
- Later: Apollo API via script, template experiment reports, backup button.

## Open questions for Pankaj
1. Which inboxes? (How many, and are any of them your main personal Gmail?)
2. Use the existing Google Sheet/webhook, or a fresh "Reach Desk Outbox" sheet? (Fresh recommended.)
3. Does your Apollo plan include API access, or is CSV export/import fine for now?
4. Default timezone/window, and which countries you mainly target (US / UK / India / UAE)?
5. A lead with an email but no first name: send with "hey", or hold it until you add the name?
6. OK with the generic-template test capped at 20%, or skip it?
