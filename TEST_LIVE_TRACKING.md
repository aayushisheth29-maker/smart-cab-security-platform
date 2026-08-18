# 🧪 SmartCab Live Tracking — End-to-End Test Guide

This is a complete, step-by-step test you can do in your browser right now to verify that the live tracking flow actually works for your family.

**Time needed:** ~5 minutes
**What you need:** Your phone (for GPS) + a second tab (for the tracker)

---

## Phase 1: Wake up the backend (so it's ready)

The Python backend on Render sleeps after 15 min of inactivity. The first request takes ~30s to wake it up.

1. Open this link in a new tab — this wakes up the backend:
   **https://smart-cab-security-platform-1.onrender.com/api/health**
2. You should see JSON like:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "share_links_count": 0,
     "trips_count": 3,
     "drivers_count": 5
   }
   ```
3. ✅ If you see this, the backend is awake. Move to Phase 2.

---

## Phase 2: Open the app (Vercel)

1. Open: **https://smart-cab-security-platform.vercel.app**
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) so it picks up the latest build with the new auth system
3. The navbar should show "Log in" and "Sign up" buttons on the top right

---

## Phase 3: Test the new auth system (2 minutes)

1. Click **"Sign up"**
2. Fill in:
   - Full Name: `Aayushi Test`
   - Email: `aayushi.test@smartcab.in`
   - Phone: `9876543210`
   - Password: `demo1234` (6+ chars)
3. Click **"Register & Continue"**
4. ✅ You should see an alert: "Welcome to SmartCab, Aayushi Test! 🎉"
5. ✅ The navbar should now show your name + a red "Log out" button
6. **Refresh the page** — you should STILL be logged in (localStorage)
7. Click **"Log out"** — navbar goes back to "Log in / Sign up"
8. Click **"Log in"** → enter the same email + password → ✅ Welcome back alert

If anything here fails, **screenshot it and tell me**, and I'll fix it.

---

## Phase 4: Book a real ride with GPS (3 minutes)

1. Click "Log out" if you're logged in (so we test as a guest — same as your family would)
2. Make sure you're on the **"Ride"** tab
3. Click the **pickup input** → type `Gota, Ahmedabad` (or click "Use my current location" if you want real GPS)
4. Click the **dropoff input** → type `Chandlodia, Ahmedabad`
5. The map should show two dots + a line between them
6. ✅ The price cards below should show REAL prices (around ₹50-80 for 3km, not ₹232)
7. Click **"Confirm Ride"** → "Looking for driver..." animation
8. After a few seconds, you should see a "Driver found!" screen with:
   - Driver name (e.g. "Suresh K.")
   - Car plate (e.g. "GJ 01 GH 3456")
   - Car model
   - "Live Guard" button (red, with camera icon)

---

## Phase 5: Test Live Guard (the big one!)

1. Click the **"Live Guard"** button
2. ✅ Camera should turn on and you should see yourself
3. ✅ Add at least 1 emergency contact (your mom's number, your own number, whatever)
4. Click **"Share Live Location"** (the big green button)
5. ✅ A share sheet should appear with options: WhatsApp / SMS / Email / Telegram / More
6. Pick **"WhatsApp"** (or any option)
7. ✅ A link should be copied to clipboard — looks like:
   `https://smart-cab-security-platform.vercel.app/track/RIDE_xxx_yyy`
8. **Copy this link** (it's already in your clipboard)

---

## Phase 6: Open the link in a new tab (THE MOMENT OF TRUTH)

1. **Open a new browser tab**
2. **Paste the link** in the address bar
3. Press Enter
4. ✅ You should see the TrackRide page with:
   - **Your name** as the rider (e.g. "Aayushi Test")
   - **The driver's name + plate** (e.g. "Suresh K. / GJ 01 GH 3456")
   - **The pickup** (Gota, Ahmedabad)
   - **The dropoff** (Chandlodia, Ahmedabad)
   - **A map** showing the car at Gota
   - **A live timer** counting up
5. If the camera was on, you should also see a small video player showing the most recent chunk

**This is what your family will see when you share a SmartCab link with them.**

---

## Phase 7: Test the GPS ping (location updates)

1. Go back to the **rider tab** (the one with the booking)
2. The car should slowly move along the route on the map
3. **Refresh the tracker tab** (or wait 5s — it auto-refreshes)
4. ✅ The car's position should have updated

---

## ✅ What success looks like

If all 7 phases pass, here's what just happened:
- 🟢 Aayushi booked a ride
- 🟢 Aayushi started Live Guard
- 🟢 Aayushi shared the link
- 🟢 Family opened the link in a different browser/tab
- 🟢 Family saw REAL data (real name, real driver, real map, real GPS)
- 🟢 As the car moved, the tracker's map updated automatically

**That's the entire live tracking feature working end-to-end.** 🎉

---

## 🐛 If something breaks

Tell me which phase failed and what you saw (a screenshot is best). Common issues:

| Phase | Symptom | Likely cause |
|---|---|---|
| 1 | `connection refused` or timeout | Render sleeping, wait 30s and try again |
| 2 | Old UI, no "Log in" button | Vercel still deploying, wait 1-2 min |
| 3 | "Sign up" button does nothing | Frontend not deployed yet, hard refresh |
| 4 | Prices still show ₹232 | Frontend not deployed yet, hard refresh |
| 5 | Camera blocked | Browser permission issue, allow camera |
| 5 | No share sheet | Old frontend, hard refresh |
| 6 | "Waiting for rider" forever | Share link not saved to backend, check browser console |
| 6 | "—" everywhere | Same as above, link not found |
| 7 | Map not updating | Ping endpoint not being called, check network tab |

---

## 🚀 Alternative: 1-command backend test (no browser)

If you just want to verify the backend works without clicking through the UI, copy-paste this into your terminal:

```bash
curl -s https://smart-cab-security-platform-1.onrender.com/api/health | python3 -m json.tool
```

Should return the JSON from Phase 1.

To run the full 9-step automated test, save the script at `/tmp/test_live_tracking.sh` and run:
```bash
bash /tmp/test_live_tracking.sh
```
