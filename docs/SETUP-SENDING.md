# Setting up automatic sending (about 20 minutes, once)

You'll make one Google Sheet that holds the queue. Each of your 5 inboxes then clicks one button so it sends from itself. After that it runs by itself on Google's servers, even with your laptop off.

**Which account owns the sheet?** Your main Gmail is fine. The sheet itself never sends anything; only the 5 inboxes send.

## A. Make the sheet (logged into your main account)
1. Open **sheets.new**. Name it **Reach Desk Outbox**.
2. (Nothing to do here: `setup` sets the sheet to **US Eastern time**, so 9–17 means 9am–5pm New York, which is 6:30pm–2:30am India time. Change it in File → Settings if you ever need to.)
3. **Extensions → Apps Script**. A code editor opens.
4. Delete everything in it. Open `apps-script/Code.gs` from this repo, copy all of it, and paste it in. Click the project name at the top and call it **Reach Desk sender**. Press **Ctrl+S**.
5. On the left, next to **Services**, click **+** → choose **Gmail API** → **Add**.
6. At the top, in the function dropdown, choose **setup** → **Run**.
   - Google asks for permission. You'll see "Google hasn't verified this app". That's normal for your own script: click **Advanced → Go to Reach Desk sender (unsafe) → Allow**.
7. Back in the sheet you now have tabs: Outbox, DoNotEmail, Inboxes, Log, Settings. In **Settings**:
   - `notify_email`: your main email (you get a short note whenever someone replies).
   - `daily_cap`: 4 (or 3 if you prefer). Follow-ups count toward it.
   - Copy the `token` value. You'll need it in step 9.
8. In Apps Script: **Deploy → New deployment** → gear icon → **Web app**.
   - Execute as: **Me**. Who has access: **Anyone**. → **Deploy** → copy the **Web app URL**.
   - "Anyone" only means the page can reach it; nothing gets in without the token.
   - If you open that URL in a browser tab you'll see `{"ok":false,"error":"use POST"}`. That's normal: only Reach Desk talks to it, with the token tucked inside the request (never in the address).
9. Open `reach-desk.html`. In **Keys**, paste the **Outbox web app URL** and the **Outbox token**, tick **Remember**, then click **Refresh status** in the Outbox box.

## B. Connect each inbox (repeat for all 5)
1. In the sheet: **Share** → add the inbox's address as **Editor** (untick "Notify" if you like).
2. Log into that inbox. Easiest: a separate Chrome profile per inbox, or an incognito window.
3. Open the sheet → **Extensions → Apps Script**.
4. Function dropdown → **installSender** → **Run** → allow the permissions (same "Advanced → Go to… → Allow" steps). The warning names your main email as "developer" and may call the app "Untitled project": both are fine.
   - After the permission pop-up, check the log says "Sender installed for …". If it says "Setup done" instead, the editor ran the wrong function: pick **installSender** again and **Run**.
   - Tip: if all inboxes are signed into one Chrome, open the script as a given inbox by adding `?authuser=that.inbox@gmail.com` to the script's address.
5. Optional: choose **testSend** → **Run**. It sends one test email from this inbox to your `notify_email`.
6. The **Inboxes** tab now shows this address. In Reach Desk, **Refresh status** lists it too.

## C. Daily use
1. Find prospects → open the leads worth it → check the email (paste one from Apollo if none was found) and the host's first name. Click a **Name ideas** chip if one is right (from the email or from "hosted by …" in their descriptions).
2. Either click **Queue this email** on the version you like inside a lead, or tick several leads in the table and click **Queue picked to outbox** (uses each lead's best insight, first version).
3. Done. The inboxes send weekdays inside your hours (default 9:00–17:00), starred leads first, a few hours apart. Follow-ups go out on day 3 and day 7 as replies in the same thread.
4. When someone replies you get a note at your main email. Answer from that inbox using the reply pitch in Reach Desk.

## D. Controls (all in the sheet)
- **Stop everything:** Settings → `paused` = TRUE.
- **Stop one inbox / change its limit:** Inboxes tab → `paused` = TRUE, or put a number in `cap`.
- **Change hours / follow-up timing / follow-up text:** Settings tab.
- **Never email someone:** add their address to DoNotEmail. Bounces and "not interested" replies are added automatically.
- **Leads with no first name** wait in the queue unless `send_without_name` = TRUE.
- **What happened:** the Log tab lists every send, reply, bounce and error.

## E. When the code changes
When I update `apps-script/Code.gs`: open Apps Script (in the main account), paste the new code, save. Then **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. The inboxes pick it up automatically, so you don't need to redo step B.
