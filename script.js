// Weather App – Improved + Hourly (Next 24h)
const apiKey = "0f83a9ec7e1f9feb111cb0ab39d3d6c9";
let unit = "metric";

// DOM
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const toggleUnitBtn = document.getElementById("toggleUnit");
const alertBanner = document.getElementById("alert");
const errorDiv = document.getElementById("error");
const weatherResult = document.getElementById("weatherResult");
const forecastDiv = document.getElementById("forecast");
const hourlyDiv = document.getElementById("hourly");
const skeletonGrid = document.getElementById("skeleton");
const recentCitiesDropdown = document.getElementById("recentCities");
const hourly24Btn = document.getElementById("hourly24Btn");
const hourly48Btn = document.getElementById("hourly48Btn");

// Toast
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");
const toastClose = document.getElementById("toastClose");
let toastTimer;
function showToast(message, timeout = 4500) {
  toastMsg.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, timeout);
}
function hideToast() { toast.classList.add("hidden"); toast.classList.remove("show"); toastMsg.textContent = ""; }
toastClose.addEventListener("click", hideToast);

// Background mapping (base)
const CONDITION_TO_BG = {
  Clear: "bg-sunny",
  Clouds: "bg-cloudy",
  Rain: "bg-raindrops", // raindrops for rainy
  Drizzle: "bg-raindrops",
  Thunderstorm: "bg-raindrops",
  Snow: "bg-sunset-snow", // sunset with snowfall overlay
  Mist: "bg-mist", Smoke: "bg-mist", Haze: "bg-mist", Dust: "bg-mist", Fog: "bg-mist",
  Sand: "bg-mist", Ash: "bg-mist", Squall: "bg-raindrops", Tornado: "bg-raindrops"
};
function setBackground(conditionMain, tempC, iconCode) {
  const body = document.body;
  body.classList.remove("bg-default","bg-sunny","bg-cloudy","bg-rainy","bg-raindrops","bg-snow","bg-sunrise","bg-sunset-snow","bg-mist");

  // Night hint via icon code ending with 'n'
  const isNight = typeof iconCode === "string" && /n$/.test(iconCode);

  // Temperature-based sunrise for hot weather
  const isHotC = typeof tempC === "number" && tempC >= 32; // ~90°F
  if (isHotC && (conditionMain === "Clear" || conditionMain === "Clouds")) {
    body.classList.add("bg-sunrise");
    return;
  }

  // For snow, prefer sunset-snow background regardless of day/night
  if (conditionMain === "Snow") {
    body.classList.add("bg-sunset-snow");
    return;
  }

  // Default to mapping; if night and clear, keep default mapping (could extend later)
  body.classList.add(CONDITION_TO_BG[conditionMain] || "bg-default");

}

// Icons for metrics (inline SVGs)
const ICONS = {
  temp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3a2 2 0 0 0-4 0v11.76a4 4 0 1 0 4 0"/></svg>`,
  wind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7a2 2 0 1 0-3.4-2"/><path d="M3 12h11a3 3 0 1 1-3 3"/><path d="M5 17h7a2 2 0 1 1-2 2"/></svg>`,
  hum:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7l5.66 5.66a8 8 0 1 1-11.31 0L12 2.7z"/></svg>`
};

// Error helpers
function errorMessageFromStatus(s) {
  switch (s) { case 401: return "Invalid API key or not yet activated.";
    case 404: return "City not found. Please check the spelling.";
    case 429: return "Rate limit exceeded. Please try again shortly.";
    case 500: case 502: case 503: case 504: return "Service unavailable. Please try again.";
    default: return "We couldn't fetch the weather. Please try again."; }
}
function isOffline(){ return typeof navigator!=="undefined" && navigator && navigator.onLine===false; }
function showError(t){ errorDiv.textContent=t; showToast(t); }
function clearError(){ errorDiv.textContent=""; }

// Fetch with timeout
function fetchWithTimeout(url, options={}, timeout=12000){
  return new Promise((resolve,reject)=>{
    const controller=new AbortController(); const id=setTimeout(()=>controller.abort(), timeout);
    fetch(url,{...options, signal: controller.signal}).then(r=>{clearTimeout(id); resolve(r)}).catch(e=>{clearTimeout(id); reject(e)});
  });
}

// Recent cities
function getRecentCities(){ try{return JSON.parse(localStorage.getItem("recentCities")||"[]")}catch{return[]} }
function setRecentCities(a){ localStorage.setItem("recentCities", JSON.stringify(a.slice(-7))); }
function saveRecentCity(c){ const l=getRecentCities(); if(!l.includes(c)){ l.push(c); setRecentCities(l); updateRecentCitiesDropdown(); } }
function updateRecentCitiesDropdown(){
  const l=getRecentCities(); if(l.length===0){ recentCitiesDropdown.classList.add("hidden"); return; }
  recentCitiesDropdown.innerHTML=""; l.slice().reverse().forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=c; recentCitiesDropdown.appendChild(o); });
  recentCitiesDropdown.classList.remove("hidden");
}
recentCitiesDropdown.addEventListener("change", e=>{ if(e.target.value) fetchWeather(e.target.value); });

// Validation
function validateCityInput(city){
  if(!city || !city.trim()) return "Please enter a city name.";
  if(city.trim().length<2) return "City name is too short.";
  if(!/^[a-zA-Z\s\-'.]+$/.test(city.trim())) return "Use letters and spaces only for city name.";
  return null;
}

// API calls
function fetchWeather(city){
  if(isOffline()){ showError("You appear to be offline. Check your internet connection."); return; }
  const v=validateCityInput(city); if(v){ showError(v); return; }
  hideToast(); clearError(); startSkeleton();
  const url=`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${unit}&appid=${apiKey}`;
  fetchWithTimeout(url).then(res=>{ if(!res.ok) throw new Error(errorMessageFromStatus(res.status)); return res.json(); })
    .then(d=>{ displayWeather(d); saveRecentCity(d.name); return fetchForecast(d.coord.lat, d.coord.lon); })
    .catch(err=>showError(err.message||"Unknown error occurred."))
    .finally(()=>stopSkeleton());
}
function fetchWeatherByCoords(lat,lon){
  if(isOffline()){ showError("You appear to be offline. Check your internet connection."); return; }
  hideToast(); clearError(); startSkeleton();
  const url=`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
  fetchWithTimeout(url).then(res=>res.json()).then(d=>{
    if(d.cod && Number(d.cod)!==200) throw new Error(errorMessageFromStatus(Number(d.cod)));
    displayWeather(d); return fetchForecast(lat,lon);
  }).catch(err=>showError(err.message||"Unable to fetch weather for your location."))
    .finally(()=>stopSkeleton());
}
function fetchForecast(lat,lon){
  // Forecast & hourly both from 5-day/3h endpoint (metric). Forecast stays °C as per rubric.
  const url=`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  return fetchWithTimeout(url).then(res=>res.json()).then(d=>{
    if(d.cod && Number(d.cod)!==200) throw new Error(errorMessageFromStatus(Number(d.cod)));
    window.lastForecastData = d; // Store data for hourly toggle
    displayHourly(d);   // Enhanced: hourly timeline (24h or 48h)
    displayForecast(d); // existing: 5-day cards
  }).catch(err=>showError(err.message||"Unable to fetch forecast."));
}

// UI helpers
function showAlert(m){ alertBanner.textContent=m; alertBanner.classList.remove("hidden"); }
function hideAlert(){ alertBanner.classList.add("hidden"); alertBanner.textContent=""; }
function startSkeleton(){ skeletonGrid.classList.remove("hidden"); forecastDiv.innerHTML=""; hourlyDiv.innerHTML=""; }
function stopSkeleton(){ skeletonGrid.classList.add("hidden"); }

// Render current
function displayWeather(data){
  const temp=Math.round(data.main.temp);
  const condition=data.weather?.[0]?.main||"Clear";
  const description=data.weather?.[0]?.description||"";
  const iconCode=data.weather?.[0]?.icon;
  const iconUrl=iconCode?`https://openweathermap.org/img/wn/${iconCode}@2x.png`:"";

  // Use Celsius baseline for visuals regardless of toggle
  const tempC = unit === "metric" ? temp : Math.round((temp - 32) * 5/9);
  setBackground(condition, tempC, iconCode);

  if((unit==="metric"&&temp>=40)||(unit==="imperial"&&temp>=104)){
    showAlert("Weather Alert: Extreme heat in your selected location. Stay hydrated and avoid peak sun!");
  } else { hideAlert(); }

  weatherResult.innerHTML = `
    <div class="space-y-2">
      <h2 class="text-xl md:text-2xl font-extrabold text-slate-100">${data.name}</h2>
      ${iconUrl?`<img class="weather-icon" src="${iconUrl}" alt="Weather icon">`:""}
      <p class="text-4xl font-black tracking-tight text-white">${temp}° ${unit==="metric"?"C":"F"}</p>
      <p class="capitalize text-slate-300">${description}</p>

      <!-- Metrics with icons -->
      <div class="metrics-row">
        <span class="chip metric"><span>${ICONS.temp}</span><span>Feels like: <strong>${Math.round(data.main.feels_like)}°${unit==="metric"?"C":"F"}</strong></span></span>
        <span class="chip metric"><span>${ICONS.hum}</span><span>Humidity: <strong>${data.main.humidity}%</strong></span></span>
        <span class="chip metric"><span>${ICONS.wind}</span><span>Wind: <strong>${Math.round(data.wind.speed)} ${unit==="metric"?"m/s":"mph"}</strong></span></span>
      </div>
    </div>
  `;
}

// Enhanced Hourly (24h or 48h in 3h steps)
let hourlyView = 24; // Default to 24h view

function displayHourly(data){
  if(!data || !Array.isArray(data.list)) { hourlyDiv.innerHTML=""; return; }
  const hours = data.list.slice(0, hourlyView === 24 ? 8 : 16); // 24h (8 steps) or 48h (16 steps)
  
  // Add temperature trend indicator
  const temps = hours.map(item => Math.round(item.main.temp));
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  
  const now = new Date();
  
  hourlyDiv.innerHTML = hours.map((item, index) => {
    const dt = new Date(item.dt * 1000);
    const timeLabel = dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const dayLabel = dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    
    // Check if this is the current hour (within 1.5 hours)
    const isCurrentHour = Math.abs(dt - now) < 90 * 60 * 1000; // 90 minutes
    const t = Math.round(item.main.temp);        // °C (forecast is metric)
    const feelsLike = Math.round(item.main.feels_like);
    const w = Math.round(item.wind.speed);       // m/s
    const h = item.main.humidity;                // %
    const pressure = Math.round(item.main.pressure); // hPa
    const visibility = Math.round(item.visibility / 1000); // km
    const icon = item.weather?.[0]?.icon;
    const description = item.weather?.[0]?.description || "";
    const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}.png` : "";
    
    // Temperature trend indicator
    const isMaxTemp = t === maxTemp;
    const isMinTemp = t === minTemp;
    const trendClass = isMaxTemp ? 'max-temp' : isMinTemp ? 'min-temp' : '';
    
    // Wind direction
    const windDeg = item.wind.deg || 0;
    const windDirection = getWindDirection(windDeg);
    
    return `
      <div class="hour-card ${trendClass} ${isCurrentHour ? 'current-hour' : ''}">
        <div class="time">${timeLabel}${isCurrentHour ? ' (Now)' : ''}</div>
        <div class="sub">${dayLabel}</div>
        ${iconUrl ? `<img class="weather-icon" src="${iconUrl}" alt="${description}">` : ""}
        <div class="temp-main">
          <span class="temp-value">${t}°C</span>
          ${isMaxTemp ? '<span class="trend-indicator max">H</span>' : ''}
          ${isMinTemp ? '<span class="trend-indicator min">L</span>' : ''}
        </div>
        <div class="sub">Feels like ${feelsLike}°C</div>
        <div class="hourly-metrics">
          <div class="metric"><span>${ICONS.wind}</span><span>${w} m/s ${windDirection}</span></div>
          <div class="metric"><span>${ICONS.hum}</span><span>${h}%</span></div>
          <div class="metric"><span>📊</span><span>${pressure} hPa</span></div>
          <div class="metric"><span>👁️</span><span>${visibility} km</span></div>
        </div>
      </div>
    `;
  }).join("");
}

// Helper function for wind direction
function getWindDirection(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// 5-day forecast (unchanged behavior: always °C)
function displayForecast(data){
  const byDay={};
  data.list.forEach(item=>{ const [date,time]=item.dt_txt.split(" "); if(!byDay[date]||time==="12:00:00") byDay[date]=item; });
  const days=Object.values(byDay).slice(0,5);
  forecastDiv.innerHTML = days.map(item=>{
    const date=new Date(item.dt*1000);
    const dayLabel=date.toLocaleDateString(undefined,{weekday:"short"});
    const dateLabel=date.toLocaleDateString(undefined,{month:"short", day:"numeric"});
    const temp=Math.round(item.main.temp);
    const wind=Math.round(item.wind.speed);
    const hum=item.main.humidity;
    const icon=item.weather?.[0]?.icon;
    const iconUrl=icon?`https://openweathermap.org/img/wn/${icon}.png`:"";
    return `
      <div class="card text-center">
        <p class="font-semibold text-slate-100">${dayLabel} • <span class="text-slate-400">${dateLabel}</span></p>
        ${iconUrl?`<img class=\"weather-icon\" src=\"${iconUrl}\" alt=\"Weather icon\">`:""}
        <div class="mt-1 space-y-1 text-sm text-slate-300">
          <p class="metric"><span>${ICONS.temp}</span><span><strong>${temp}°C</strong> temp</span></p>
          <p class="metric"><span>${ICONS.wind}</span><span><strong>${wind} m/s</strong> wind</span></p>
          <p class="metric"><span>${ICONS.hum}</span><span><strong>${hum}%</strong> humidity</span></p>
        </div>
      </div>
    `;
  }).join("");
}

// Events
toggleUnitBtn.addEventListener("click", ()=>{
  unit = unit==="metric" ? "imperial" : "metric";
  if(cityInput.value) fetchWeather(cityInput.value);
  toggleUnitBtn.setAttribute("aria-pressed", unit==="imperial" ? "true" : "false");
});
searchBtn.addEventListener("click", ()=>fetchWeather(cityInput.value));
currentLocationBtn.addEventListener("click", ()=>{
  if(!navigator.geolocation){ showError("Geolocation is not supported by your browser."); return; }
  navigator.geolocation.getCurrentPosition(
    ({coords})=>fetchWeatherByCoords(coords.latitude, coords.longitude),
    (err)=>{ if(err && err.code===1) showError("Permission denied. Please allow location access or search by city.");
             else if(err && err.code===2) showError("Position unavailable. Try again later.");
             else showError("Unable to get your location. Please try again."); }
  );
});

// PWA Install functionality
let deferredPrompt;
let installButton;

// Create install button
function createInstallButton() {
  if (installButton) return;
  
  installButton = document.createElement('button');
  installButton.id = 'installBtn';
  installButton.className = 'btn inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
  installButton.innerHTML = '📱 Install App';
  installButton.style.display = 'none';
  
  // Insert after the unit toggle button
  const header = document.querySelector('header');
  header.appendChild(installButton);
  
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install prompt outcome: ${outcome}`);
      deferredPrompt = null;
      installButton.style.display = 'none';
    }
  });
}

// PWA install event listeners
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  createInstallButton();
  installButton.style.display = 'block';
});

window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  installButton.style.display = 'none';
  showToast('App installed successfully!');
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('App update available! Refresh to get the latest version.');
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

// Handle online/offline status
window.addEventListener('online', () => {
  showToast('Connection restored!');
  clearError();
});

window.addEventListener('offline', () => {
  showToast('You are now offline. Some features may be limited.');
});

// Hourly view toggle
hourly24Btn.addEventListener('click', () => {
  hourlyView = 24;
  hourly24Btn.classList.add('active');
  hourly48Btn.classList.remove('active');
  // Refresh hourly display if we have data
  if (window.lastForecastData) {
    displayHourly(window.lastForecastData);
  }
});

hourly48Btn.addEventListener('click', () => {
  hourlyView = 48;
  hourly48Btn.classList.add('active');
  hourly24Btn.classList.remove('active');
  // Refresh hourly display if we have data
  if (window.lastForecastData) {
    displayHourly(window.lastForecastData);
  }
});

// Handle app shortcuts
if (window.location.search.includes('action=location')) {
  // If opened from "Current Location" shortcut, trigger location search
  setTimeout(() => {
    currentLocationBtn.click();
  }, 100);
}

// Init
updateRecentCitiesDropdown();

// feat(js): 5-day forecast renderer with date/temp/wind/humidity (marker)

// feat(js): recent cities dropdown with localStorage (marker)

// feat(js): °C/°F toggle for current temperature only (marker)

// feat(js): dynamic backgrounds + extreme-heat alert banner (marker)

// feat(js): validation + custom toast errors (no alert()) (marker)

// feat(js): fetch timeout + HTTP status-to-message mapping (marker)
