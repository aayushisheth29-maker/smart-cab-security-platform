# 🔒 Private Owner Portal — second Vercel project

Your **rider app** (used by passengers) and your **Owner Portal** (only for you) are two
different websites, exactly like Uber's rider app vs. `partners.uber.com`.

| Site | URL | Who sees it |
|---|---|---|
| Rider app | `https://smart-cab-security-platform.vercel.app` | Everyone |
| **Owner Portal** | **`https://owner.smart-security-cab.com`** | Only you (private) |

Same backend (`smart-cab-security-platform-1.onrender.com`), same admin key — just a
separate door that rides can't see. The owner portal build **hides the rider app
entirely**: no navbar, no booking, no rider help button — only the owner dashboard.

---

## Step 1 — Allow the new domain on Render (CORS) ⚠️ do this FIRST

The backend only accepts calls from allowed websites. Add the owner domain to Render:

1. Render dashboard → your backend service → **Settings → Environment**
2. Set `SMARTCAB_CORS_ORIGINS` to **both** origins (comma separated):
   ```
   https://smart-cab-security-platform.vercel.app,https://owner.smart-security-cab.com
   ```
3. **Save** → Render automatically redeploys the backend with the new list.
   (If the owner site loads the dashboard but shows "network error / CORS", this is why.)

> Tip: keep `SMARTCAB_ADMIN_KEY` set here too — it is the **bootstrap / recovery** key
> (see Step 4). `admin12345` is your current value.

## Step 2 — Create the second Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New… → Project**
2. Import **the same GitHub repo** (`aayushisheth29-maker/smart-cab-security-platform`)
3. **Root Directory → `frontend`** (this is important — the portal reuses the frontend code)
4. Framework preset: **Vite** (auto-detected)
5. **Environment Variables** (add both, type **Config** — public, not Secret):
   | Name | Value |
   |---|---|
   | `VITE_OWNER_MODE` | `true` |
   | `VITE_API_URL` | `https://smart-cab-security-platform-1.onrender.com` |
6. Click **Deploy** — you'll get `https://<project>-<name>.vercel.app`. Open it:
   you should see ONLY the Owner Portal lock screen (no rider homepage).

## Step 3 — Add your domain `owner.smart-security-cab.com`

1. In the new project → **Settings → Domains → Add**
2. Type `owner.smart-security-cab.com` → Vercel shows a **CNAME record**:
   ```
   owner.smart-security-cab.com  →  cname.vercel-dns.com
   ```
3. At your domain registrar (GoDaddy / Namecheap / etc.) add that **CNAME** record
   (if your registrar only supports A records: `76.76.21.21`).
4. DNS can take a few minutes to a few hours. Vercel auto-issues the SSL certificate.
5. Done — **`https://owner.smart-security-cab.com`** is your private Owner Portal.
   Bookmark it. Never share it.

---

## Step 4 — Change / recover your admin access key

You can change the key **yourself, instantly, from the Owner Portal** — no Render redeploy:

- Owner Portal → **OWNER SECURITY** card → type a **new key (min 10 characters)** → **Change access key**.
- Old key stops working immediately. New key is stored **hashed** in the backend data dir
  (`/opt/render/project/data/admin_credentials.json`) and survives restarts.
- Session key auto-updates, so you stay logged in.

**If you lose the key:**
1. Render dashboard → backend → **Shell** (or use the backend's "reset" while logged in —
   the Owner Portal has a **Reset to Render env key** button).
2. Delete the credentials file:
   ```bash
   rm /opt/render/project/data/admin_credentials.json
   ```
3. The backend falls back to `SMARTCAB_ADMIN_KEY` from the environment (`admin12345`).
4. Restart the service (or it picks it up on next restart).

---

## Quick notes

- Owner portal = `VITE_OWNER_MODE=true` build of the same code. Rider app is completely
  unaffected — no orphaned admin links, and the backend rejects anything without the key.
- Always open the port on **https** (Vercel handles TLS).
- You, as owner, can revoke access at any time by changing the key.
