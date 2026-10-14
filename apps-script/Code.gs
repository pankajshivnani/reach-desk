/**
 * Reach Desk sender. Paste into the "Reach Desk Outbox" sheet: Extensions > Apps Script.
 * One script, shared by every inbox: each inbox account runs installSender() once and then
 * sends from itself on a 15-minute timer. Setup steps: docs/SETUP-SENDING.md
 * Needs the Gmail advanced service (Services + > Gmail API).
 */
var TABS = {out: 'Outbox', dne: 'DoNotEmail', set: 'Settings', inb: 'Inboxes', log: 'Log'};
var COLS = ['lead_id', 'date_added', 'channel', 'channel_url', 'country', 'host_name', 'email', 'email_source',
  'template_version', 'insight_type', 'insight_score', 'starred', 'subject', 'body', 'fu1_body', 'fu2_body',
  'status', 'inbox', 'sent_at', 'fu1_at', 'fu2_at', 'replied_at', 'thread_id', 'message_id', 'reply_snippet', 'notes'];
var DEFAULTS = [
  ['paused', 'FALSE', 'TRUE stops every inbox right away'],
  ['daily_cap', '4', 'max emails per inbox per day (follow-ups count)'],
  ['window_start', '9', 'first hour to send (sheet time zone: File > Settings)'],
  ['window_end', '17', 'stop sending at this hour'],
  ['weekdays_only', 'TRUE', 'no sending on Sat/Sun'],
  ['fu1_days', '3', 'business days after the first email'],
  ['fu2_days', '7', 'business days after the first email'],
  ['fu1_text', 'hey just checking if you saw this', 'used when a row has no fu1_body'],
  ['fu2_text', 'all good if not interested. can still send the loom if you want', 'used when a row has no fu2_body'],
  ['notify_email', '', 'your main email: you get a short note when someone replies'],
  ['send_without_name', 'FALSE', 'FALSE = hold leads that have no host name'],
  ['token', '', 'secret the Reach Desk page sends (setup() fills this)']];
var OPT_OUT = /\b(unsubscribe|not interested|no thanks|remove me|stop emailing|don'?t email|do not email|take me off)\b/i;

/* ---------- One-time setup (sheet owner) ---------- */
function setup() {
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone('America/New_York'); // sending hours follow US Eastern time (change in File > Settings)
  ensureTab(ss, TABS.out, COLS);
  ensureTab(ss, TABS.dne, ['email', 'reason', 'date']);
  ensureTab(ss, TABS.inb, ['inbox', 'cap', 'paused', 'added_at', 'last_run', 'last_error']);
  ensureTab(ss, TABS.log, ['time', 'inbox', 'lead_id', 'event', 'detail']);
  var set = ensureTab(ss, TABS.set, ['key', 'value', 'note']);
  var have = set.getDataRange().getValues().map(function (r) { return r[0]; });
  DEFAULTS.forEach(function (d) { if (have.indexOf(d[0]) < 0) set.appendRow(d); });
  var cfg = settings(ss);
  if (!cfg.token) setSetting(ss, 'token', Utilities.getUuid().replace(/-/g, ''));
  Logger.log('Setup done. Token: ' + settings(ss).token + '\nNext: Deploy > New deployment > Web app (see the guide).');
}
function ensureTab(ss, name, header) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(header); sh.setFrozenRows(1); sh.getRange(1, 1, 1, header.length).setFontWeight('bold'); }
  return sh;
}

/* ---------- Each inbox runs this once (logged in as that inbox) ---------- */
function installSender() {
  uninstallSender();
  ScriptApp.newTrigger('run').timeBased().everyMinutes(15).create();
  var me = Session.getEffectiveUser().getEmail().toLowerCase(), ss = SpreadsheetApp.getActive();
  var inb = table(ss, TABS.inb);
  if (!inb.rows.some(function (r) { return String(r[inb.i.inbox]).toLowerCase() === me; }))
    inb.sh.appendRow([me, '', 'FALSE', new Date(), '', '']);
  Gmail.Users.Labels.list('me'); // triggers the Gmail permission prompt now, not later
  log(ss, me, '', 'installed', 'sender every 15 min');
  Logger.log('Sender installed for ' + me + '. It sends inside the window set in Settings.');
}
function uninstallSender() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'run') ScriptApp.deleteTrigger(t); });
}
/* Optional: send one test email from this inbox to notify_email */
function testSend() {
  var ss = SpreadsheetApp.getActive(), cfg = settings(ss);
  if (!cfg.notify_email) throw new Error('Fill notify_email in the Settings tab first.');
  var r = sendRaw(cfg.notify_email, 'reach desk test', 'test from ' + Session.getEffectiveUser().getEmail(), null, null);
  Logger.log('Sent. Gmail thread ' + r.threadId);
}

/* ---------- Inbox placement test ----------
 * Run as one inbox: sends each wording in the "Tests" tab to a different address in
 * Settings > seed_emails (rotated per inbox, so no seed gets two emails from the same inbox),
 * a minute or so apart. Then check where each landed (Primary / Promotions / Spam).
 * Don't reply to them or click "Not spam" until the result is written down. */
var SEED_VARIANTS = [
  ['variant', 'subject', 'body'],
  ['A-tip-lower', 'titles getting cut off', 'hey sam\n\n11 of your last 12 titles run past 60 characters, so phones cut off the end. worth testing a few under 50.\n\npankaj'],
  ['B-tip-proper', 'Your episode titles', 'Hey Sam,\n\n11 of your last 12 titles on Hatchpad run past 60 characters, so phones cut off the end. Might be worth testing a few under 50.\n\nPankaj Shivnani\nZizzy'],
  ['C-ask-lower', 'hatchpad on youtube', 'hey sam, are you the one looking after the youtube side of hatchpad?\n\nnoticed something in your last 12 episodes, happy to share if it\'s useful.\n\npankaj shivnani\nzizzy'],
  ['D-ask-proper', 'Hatchpad on YouTube', 'Hi Sam,\n\nAre you the person who looks after Hatchpad\'s YouTube channel? I noticed something in your last 12 episodes and I\'m happy to share it if it\'s useful.\n\nPankaj Shivnani\nZizzy']
];
function seedTest() {
  var ss = SpreadsheetApp.getActive(), me = Session.getEffectiveUser().getEmail().toLowerCase();
  var tests = ss.getSheetByName('Tests');
  if (!tests) { tests = ss.insertSheet('Tests'); SEED_VARIANTS.forEach(function (r) { tests.appendRow(r); }); tests.setFrozenRows(1); }
  if (!('seed_emails' in settings(ss))) ss.getSheetByName(TABS.set).appendRow(['seed_emails', '', 'test inboxes you own, comma separated (seedTest)']);
  var seeds = String(settings(ss).seed_emails || '').split(/[,\s]+/).filter(function (s) { return s.indexOf('@') > 0; });
  if (!seeds.length) throw new Error('Put your test addresses in Settings > seed_emails first.');
  var rows = tests.getDataRange().getValues().slice(1).filter(function (r) { return r[0] && r[2]; });
  var inb = table(ss, TABS.inb), offset = 0;
  inb.rows.forEach(function (r, k) { if (String(r[inb.i.inbox]).toLowerCase() === me) offset = k; });
  var n = Math.min(rows.length, seeds.length);
  for (var k = 0; k < n; k++) {
    var to = seeds[(k + offset) % seeds.length];
    if (to.toLowerCase() === me) continue;
    if (k) Utilities.sleep(40000 + Math.floor(Math.random() * 40000));
    sendRaw(to, rows[k][1], rows[k][2], null, null);
    log(ss, me, '', 'seed-test', rows[k][0] + ' -> ' + to);
    Logger.log(rows[k][0] + ' -> ' + to);
  }
}

/* ---------- The timer ---------- */
function run() {
  var lock = LockService.getUserLock();
  if (!lock.tryLock(5000)) return;
  var ss = SpreadsheetApp.getActive(), me = Session.getEffectiveUser().getEmail().toLowerCase();
  try {
    var cfg = settings(ss), tz = ss.getSpreadsheetTimeZone(), now = new Date(), out = table(ss, TABS.out);
    checkThreads(ss, out, me, cfg);
    var inb = inboxRow(ss, me);
    if (inb) inb.set('last_run', now);
    if (!inb || truthy(inb.get('paused')) || truthy(cfg.paused)) return;
    if (!inWindow(cfg, tz, now)) return;
    var cap = Number(inb.get('cap') || cfg.daily_cap) || 4;
    var sent = sendsOn(out, me, tz, now);
    if (sent.count >= cap) return;
    // Spread sends across the window, with some randomness
    var gapMin = Math.max(20, (Number(cfg.window_end) - Number(cfg.window_start)) * 60 / cap * 0.6);
    if (sent.last && now - sent.last < gapMin * 60000) return;
    if (Math.random() < 0.35) return;
    if (!sendFollowUp(ss, out, me, cfg, tz, now)) sendNew(ss, out, me, cfg, tz, now);
    inb.set('last_error', '');
  } catch (e) {
    log(ss, me, '', 'error', String(e));
    var r = inboxRow(ss, me); if (r) r.set('last_error', String(e).slice(0, 300));
  } finally { lock.releaseLock(); }
}

/* Replies, bounces and opt-outs on every thread this inbox owns */
function checkThreads(ss, out, me, cfg) {
  var live = {sent: 1, fu1: 1, fu2: 1, done: 1};
  out.rows.forEach(function (row, k) {
    if (String(row[out.i.inbox]).toLowerCase() !== me || !live[row[out.i.status]] || !row[out.i.thread_id]) return;
    var th;
    try { th = Gmail.Users.Threads.get('me', row[out.i.thread_id], {format: 'metadata', metadataHeaders: ['From', 'Subject', 'Auto-Submitted']}); }
    catch (e) { return; }
    (th.messages || []).some(function (m) {
      var h = headers(m), from = (h.from || '').toLowerCase();
      if (from.indexOf(me) >= 0) return false;
      if (/mailer-daemon|postmaster/.test(from)) {
        out.set(k, 'status', 'bounced'); addDne(ss, row[out.i.email], 'bounced'); log(ss, me, row[out.i.lead_id], 'bounced', '');
        return true;
      }
      if ((h['auto-submitted'] && h['auto-submitted'] !== 'no') || /^(automatic reply|auto.?reply|out of (the )?office)/i.test(h.subject || '')) return false;
      var optOut = OPT_OUT.test(m.snippet || '');
      out.set(k, 'status', optOut ? 'opted-out' : 'replied');
      out.set(k, 'replied_at', new Date(Number(m.internalDate)));
      out.set(k, 'reply_snippet', (m.snippet || '').slice(0, 200));
      if (optOut) addDne(ss, row[out.i.email], 'asked to stop');
      label(row[out.i.thread_id], optOut ? 'reach-desk/opted-out' : 'reach-desk/replied');
      log(ss, me, row[out.i.lead_id], optOut ? 'opted-out' : 'replied', m.snippet || '');
      if (cfg.notify_email) GmailApp.sendEmail(cfg.notify_email,
        'reach desk: ' + (row[out.i.host_name] || row[out.i.email]) + ' (' + row[out.i.channel] + ') ' + (optOut ? 'opted out' : 'replied'),
        'inbox: ' + me + '\nfrom: ' + h.from + '\n\n' + (m.snippet || '') + '\n\nanswer it from ' + me + '.');
      return true;
    });
  });
}

function sendFollowUp(ss, out, me, cfg, tz, now) {
  for (var k = 0; k < out.rows.length; k++) {
    var row = out.rows[k], st = row[out.i.status];
    if (String(row[out.i.inbox]).toLowerCase() !== me || !row[out.i.sent_at]) continue;
    var days = bizDays(row[out.i.sent_at], now, tz);
    var step = st === 'sent' && days >= Number(cfg.fu1_days) ? 'fu1' : st === 'fu1' && days >= Number(cfg.fu2_days) ? 'fu2' : null;
    if (st === 'fu2' && days >= Number(cfg.fu2_days) + 5) { out.set(k, 'status', 'done'); continue; }
    if (!step) continue;
    if (inDne(ss, row[out.i.email])) { out.set(k, 'status', 'skipped-dne'); continue; }
    var body = row[out.i[step + '_body']] || cfg[step + '_text'];
    sendRaw(row[out.i.email], 're: ' + row[out.i.subject], body, row[out.i.thread_id], row[out.i.message_id]);
    out.set(k, 'status', step); out.set(k, step + '_at', now);
    log(ss, me, row[out.i.lead_id], step, '');
    return true;
  }
  return false;
}

function sendNew(ss, out, me, cfg, tz, now) {
  var today = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), domainsToday = {}, contacted = {};
  out.rows.forEach(function (r) {
    var e = String(r[out.i.email]).toLowerCase();
    if (r[out.i.status] !== 'queued' && r[out.i.status] !== 'claiming') contacted[e] = 1;
    if (r[out.i.sent_at] && Utilities.formatDate(new Date(r[out.i.sent_at]), tz, 'yyyy-MM-dd') === today) domainsToday[e.split('@')[1]] = 1;
  });
  var cands = [];
  out.rows.forEach(function (r, k) {
    var st = r[out.i.status], ib = String(r[out.i.inbox]).toLowerCase();
    if (!(st === 'queued' && !ib) && !(st === 'claiming' && ib === me)) return;
    cands.push(k);
  });
  cands.sort(function (a, b) { // starred first, then oldest
    var sa = truthy(out.rows[a][out.i.starred]) ? 0 : 1, sb = truthy(out.rows[b][out.i.starred]) ? 0 : 1;
    return sa - sb || new Date(out.rows[a][out.i.date_added]) - new Date(out.rows[b][out.i.date_added]);
  });
  for (var n = 0; n < cands.length; n++) {
    var k = cands[n], row = out.rows[k], email = String(row[out.i.email]).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { out.set(k, 'status', 'bad-email'); continue; }
    if (inDne(ss, email)) { out.set(k, 'status', 'skipped-dne'); continue; }
    if (contacted[email]) { out.set(k, 'status', 'duplicate'); continue; }
    if (!row[out.i.host_name] && !truthy(cfg.send_without_name)) continue;
    if (domainsToday[email.split('@')[1]] && !/gmail|yahoo|hotmail|outlook|icloud|proton/.test(email)) continue;
    // Claim the row, then re-read: if another inbox grabbed it at the same moment, back off
    out.set(k, 'inbox', me); out.set(k, 'status', 'claiming'); SpreadsheetApp.flush();
    Utilities.sleep(2000 + Math.floor(Math.random() * 2000));
    if (String(out.sh.getRange(k + 2, out.i.inbox + 1).getValue()).toLowerCase() !== me) return false;
    var res = sendRaw(email, row[out.i.subject], row[out.i.body], null, null);
    out.set(k, 'status', 'sent'); out.set(k, 'sent_at', now); out.set(k, 'thread_id', res.threadId);
    out.set(k, 'message_id', messageId(res.id));
    log(ss, me, row[out.i.lead_id], 'sent', email);
    return true;
  }
  return false;
}

/* ---------- Web app: the Reach Desk page talks to this ---------- */
function doPost(e) {
  var ss = SpreadsheetApp.getActive(), cfg = settings(ss), body;
  try { body = JSON.parse(e.postData.contents); } catch (x) { return json({ok: false, error: 'bad request'}); }
  if (!cfg.token || body.token !== cfg.token) return json({ok: false, error: 'wrong token'});
  if (body.action === 'status') return status(ss, cfg);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var out = table(ss, TABS.out), have = {}, added = 0, skipped = [];
    out.rows.forEach(function (r) { have[String(r[out.i.email]).toLowerCase()] = 1; have['id:' + r[out.i.lead_id]] = 1; });
    (body.rows || []).forEach(function (r) {
      var email = String(r.email || '').trim().toLowerCase();
      if (!email) return skipped.push({lead_id: r.lead_id, reason: 'no email'});
      if (inDne(ss, email)) return skipped.push({lead_id: r.lead_id, reason: 'on do-not-email list'});
      if (have[email] || have['id:' + r.lead_id]) return skipped.push({lead_id: r.lead_id, reason: 'already in outbox'});
      r.email = email; r.date_added = new Date(); r.status = 'queued'; r.inbox = '';
      out.sh.appendRow(COLS.map(function (c) { return r[c] == null ? '' : r[c]; }));
      have[email] = 1; have['id:' + r.lead_id] = 1; added++;
    });
    return json({ok: true, added: added, skipped: skipped});
  } finally { lock.releaseLock(); }
}

/* Status is a POST too, so the token never sits in a URL */
function doGet() { return json({ok: false, error: 'use POST'}); }
function status(ss, cfg) {
  var tz = ss.getSpreadsheetTimeZone(), now = new Date(), out = table(ss, TABS.out), inb = table(ss, TABS.inb);
  var counts = {}, leads = {}, fuDue = 0;
  out.rows.forEach(function (r) {
    var st = r[out.i.status]; counts[st] = (counts[st] || 0) + 1;
    leads[r[out.i.lead_id]] = {status: st, inbox: r[out.i.inbox], sent_at: r[out.i.sent_at], replied_at: r[out.i.replied_at]};
    if (r[out.i.sent_at]) { var d = bizDays(r[out.i.sent_at], now, tz);
      if ((st === 'sent' && d >= Number(cfg.fu1_days)) || (st === 'fu1' && d >= Number(cfg.fu2_days))) fuDue++; }
  });
  var inboxes = inb.rows.map(function (r) {
    var em = String(r[inb.i.inbox]).toLowerCase(), cap = Number(r[inb.i.cap] || cfg.daily_cap) || 4;
    return {inbox: em, cap: cap, paused: truthy(r[inb.i.paused]), sentToday: sendsOn(out, em, tz, now).count,
      lastRun: r[inb.i.last_run], lastError: r[inb.i.last_error]};
  });
  return json({ok: true, paused: truthy(cfg.paused), sendWithoutName: truthy(cfg.send_without_name), inboxes: inboxes,
    counts: counts, followupsDue: fuDue, leads: leads, timeZone: tz});
}

/* ---------- Helpers ---------- */
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function truthy(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }
function table(ss, name) {
  var sh = ss.getSheetByName(name); if (!sh) throw new Error('Missing tab "' + name + '". Run setup() first.');
  var v = sh.getDataRange().getValues(), head = v.shift(), i = {};
  head.forEach(function (h, n) { i[h] = n; });
  return {sh: sh, rows: v, i: i, set: function (k, col, val) { sh.getRange(k + 2, i[col] + 1).setValue(val); v[k][i[col]] = val; }};
}
function settings(ss) {
  var o = {}; table(ss, TABS.set).rows.forEach(function (r) { if (r[0]) o[r[0]] = r[1]; }); return o;
}
function setSetting(ss, key, val) {
  var t = table(ss, TABS.set);
  t.rows.forEach(function (r, k) { if (r[0] === key) t.set(k, 'value', val); });
}
function inboxRow(ss, me) {
  var t = table(ss, TABS.inb);
  for (var k = 0; k < t.rows.length; k++) if (String(t.rows[k][t.i.inbox]).toLowerCase() === me)
    return {get: (function (k) { return function (c) { return t.rows[k][t.i[c]]; }; })(k),
            set: (function (k) { return function (c, v) { t.set(k, c, v); }; })(k)};
  return null;
}
function inDne(ss, email) {
  email = String(email).toLowerCase();
  return table(ss, TABS.dne).rows.some(function (r) { return String(r[0]).toLowerCase() === email; });
}
function addDne(ss, email, reason) { if (!inDne(ss, email)) ss.getSheetByName(TABS.dne).appendRow([String(email).toLowerCase(), reason, new Date()]); }
function log(ss, inbox, lead, ev, detail) { ss.getSheetByName(TABS.log).appendRow([new Date(), inbox, lead, ev, String(detail || '').slice(0, 300)]); }
function inWindow(cfg, tz, now) {
  var dow = Number(Utilities.formatDate(now, tz, 'u')), hr = Number(Utilities.formatDate(now, tz, 'H'));
  if (truthy(cfg.weekdays_only) && dow > 5) return false;
  return hr >= Number(cfg.window_start) && hr < Number(cfg.window_end);
}
function sendsOn(out, me, tz, now) {
  var day = Utilities.formatDate(now, tz, 'yyyy-MM-dd'), count = 0, last = null;
  out.rows.forEach(function (r) {
    if (String(r[out.i.inbox]).toLowerCase() !== me) return;
    ['sent_at', 'fu1_at', 'fu2_at'].forEach(function (c) {
      if (!r[out.i[c]]) return; var d = new Date(r[out.i[c]]);
      if (Utilities.formatDate(d, tz, 'yyyy-MM-dd') === day) count++;
      if (!last || d > last) last = d;
    });
  });
  return {count: count, last: last};
}
function bizDays(from, to, tz) {
  var d = new Date(from), n = 0;
  var end = Utilities.formatDate(to, tz, 'yyyy-MM-dd');
  while (true) {
    d = new Date(d.getTime() + 86400000);
    if (Utilities.formatDate(d, tz, 'yyyy-MM-dd') > end) return n;
    if (Number(Utilities.formatDate(d, tz, 'u')) <= 5) n++;
  }
}
function headers(m) {
  var o = {}; ((m.payload || {}).headers || []).forEach(function (h) { o[h.name.toLowerCase()] = h.value; }); return o;
}
function messageId(id) {
  var m = Gmail.Users.Messages.get('me', id, {format: 'metadata', metadataHeaders: ['Message-ID']});
  return headers(m)['message-id'] || '';
}
function label(threadId, name) {
  try { var l = GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name); GmailApp.getThreadById(threadId).addLabel(l); } catch (e) {}
}
/* Plain-text email through the Gmail API so follow-ups land in the same thread */
function sendRaw(to, subject, body, threadId, inReplyTo) {
  var subj = /^[\x20-\x7e]*$/.test(subject) ? subject : '=?UTF-8?B?' + Utilities.base64Encode(subject, Utilities.Charset.UTF_8) + '?=';
  var h = ['To: ' + to, 'Subject: ' + subj, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64'];
  if (inReplyTo) { h.push('In-Reply-To: ' + inReplyTo); h.push('References: ' + inReplyTo); }
  var raw = h.join('\r\n') + '\r\n\r\n' + Utilities.base64Encode(String(body), Utilities.Charset.UTF_8);
  var msg = {raw: Utilities.base64EncodeWebSafe(raw, Utilities.Charset.UTF_8)};
  if (threadId) msg.threadId = threadId;
  return Gmail.Users.Messages.send(msg, 'me');
}
