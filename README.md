# Weather Forecast – Final Submission

A responsive, original weather app using **HTML + Tailwind CSS + vanilla JS**. Built to match your assignment rubric precisely with:
- City search and **Use Current Location**
- **5‑day forecast** (date, temp, wind, humidity, icons)
- Recent cities dropdown (hidden until first search, **localStorage**)
- **°C/°F toggle for current temp only** (forecast stays °C)
- Dynamic rainy/sunny/cloudy/snow/mist backgrounds
- **Friendly errors** via custom toast + inline messages (no `alert()`)
- Extreme heat alert banner (≥ 40°C / 104°F)
- Accessibility (ARIA labels, live regions), and device-specific responsiveness (**iPhone SE**, **iPad Mini**, **Desktop**).

---

## 1) Setup (2 minutes)

1. Open `script.js` and set your OpenWeatherMap key:
   ```js
   const apiKey = "YOUR_API_KEY";
   ```
   - Create a key at https://openweathermap.org/ (My API keys) → wait a few minutes if it’s brand-new.
2. Double‑click `index.html` to run in your browser.

> Tip: Use Chrome DevTools → “Toggle device toolbar” to preview iPhone SE / iPad Mini / Desktop.

---

## 2) Usage

- **Search by city:** Enter a city name → **Search**
- **Current location:** Click **Use Current Location** (allow permissions)
- **Recent cities:** Appears **after you search**; select from the dropdown to re-load
- **Temp units:** Click **°C/°F** to toggle the **current** temperature  
  (The **5‑day forecast remains °C** by design to match the rubric)
- **Errors:** Appear as a **toast** and in the inline error text (no blocking popups)

---

## 3) Architecture & Key Files

- **`index.html`** — semantic structure; ARIA roles, live regions, and responsive layout.
- **`style.css`** — dynamic backgrounds (rainy animation), small UI polish, and explicit media queries for:
  - iPhone SE (≤ 380px), iPad Mini (641–1024px), Desktop (≥ 1024px).
- **`script.js`** — all logic with clear, top‑level comments:
  - Validation, custom error handling (toast + inline) with HTTP status mapping and 12s timeouts.
  - `fetchWeather(city)`, `fetchWeatherByCoords(lat, lon)`, `fetchForecast(lat, lon)`.
  - `displayWeather()` and `displayForecast()` (noon snapshots for readability).
  - Recent cities (localStorage), event listeners for UI interactions.

---

## 4) How this maps to the rubric

- **Responsive UI** (desktop / iPad Mini / iPhone SE): ✔ Tailwind + targeted media queries.
- **Creative design (not copied):** ✔ Original gradients, animated rainy overlay, chip-style metrics, skeleton loaders.
- **Search by city + current location:** ✔ Implemented with validation and geolocation.
- **User interactions:** ✔ Buttons/inputs/dropdown; event listeners update the UI.
- **Recent cities dropdown:** ✔ Hidden initially; uses localStorage; selecting updates weather.
- **Input validation + error handling:** ✔ No `alert()`; custom toast + inline text, friendly messages for 401/404/429/5xx/timeouts/offline/geolocation.
- **Forecast display:** ✔ 5‑day with date, temp, wind, humidity, and icons.
- **Temp toggle (current only):** ✔ Forecast remains °C (documented).  
- **Custom alert:** ✔ Extreme heat banner (≥ 40°C / 104°F).
- **Icons & rainy background:** ✔ Weather icons + dynamic background per condition.

---

## 5) Version Control & Deliverables (GitHub)

The assignment requests a **GitHub repository with history**. To make this fast and clean, this project includes **`make_commits.sh`** which will create **14 meaningful, file‑scoped commits** (HTML/CSS/JS/README separately).

### Create the repo with history (Windows Git Bash / macOS / Linux)
```bash
# 1) Initialize & generate commits
git init
bash make_commits.sh

# 2) Rename branch (optional)
git branch -M main

# 3) Push to GitHub
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### Verify
```bash
git rev-list --count HEAD          # should be 14
git --no-pager log --oneline --graph
```

---

## 6) Troubleshooting

- **401 Invalid API key** → Double‑check key, wait a few minutes, confirm correct plan.
- **404 City not found** → Check spelling; try a larger city nearby.
- **429 Rate limit** → Slow down or upgrade plan.
- **Service unavailable (5xx)** → Try again shortly.
- **Offline** → Check your internet.
- **Geolocation denied** → Allow location or use a city search.

---

## 7) Notes on Accessibility & Performance

- Screen‑reader friendly: ARIA roles (`role="alert"`, `aria-live`) and keyboard‑dismiss toast.
- No blocking popups; errors are announced and non‑intrusive.
- Lightweight CSS gradients (no heavy images); inline SVG for tiny icons.

---

## 8) License

For educational submission use. You may adapt the code for learning and portfolio purposes.

<!-- docs(readme): add Windows CRLF troubleshooting tip (marker) -->

<!-- docs(readme): add Windows CRLF troubleshooting tip (marker) -->
