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

// Background mapping
const CONDITION_TO_BG = {
  Clear: "bg-sunny", Clouds: "bg-cloudy", Rain: "bg-rainy", Drizzle: "bg-rainy", Thunderstorm: "bg-rainy",
  Snow: "bg-snow", Mist: "bg-mist", Smoke: "bg-mist", Haze: "bg-mist", Dust: "bg-mist", Fog: "bg-mist",
  Sand: "bg-mist", Ash: "bg-mist", Squall: "bg-rainy", Tornado: "bg-rainy"
};
function setBackground(conditionMain) {
  const body = document.body;
  body.classList.remove("bg-default","bg-sunny","bg-cloudy","bg-rainy","bg-snow","bg-mist");
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
    displayHourly(d);   // NEW: hourly timeline (next 24h)
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

  setBackground(condition);

  if((unit==="metric"&&temp>=40)||(unit==="imperial"&&temp>=104)){
    showAlert("Weather Alert: Extreme heat in your selected location. Stay hydrated and avoid peak sun!");
  } else { hideAlert(); }

  weatherResult.innerHTML = `
    <div class="space-y-2">
      <h2 class="text-xl md:text-2xl font-extrabold text-slate-900">${data.name}</h2>
      ${iconUrl?`<img class="weather-icon" src="${iconUrl}" alt="Weather icon">`:""}
      <p class="text-4xl font-black tracking-tight text-slate-900">${temp}° ${unit==="metric"?"C":"F"}</p>
      <p class="capitalize text-slate-600">${description}</p>

      <!-- Metrics with icons -->
      <div class="metrics-row">
        <span class="chip metric"><span>${ICONS.temp}</span><span>Feels like: <strong>${Math.round(data.main.feels_like)}°${unit==="metric"?"C":"F"}</strong></span></span>
        <span class="chip metric"><span>${ICONS.hum}</span><span>Humidity: <strong>${data.main.humidity}%</strong></span></span>
        <span class="chip metric"><span>${ICONS.wind}</span><span>Wind: <strong>${Math.round(data.wind.speed)} ${unit==="metric"?"m/s":"mph"}</strong></span></span>
      </div>
    </div>
  `;
}

// NEW: Hourly (next 24h in 3h steps)
function displayHourly(data){
  if(!data || !Array.isArray(data.list)) { hourlyDiv.innerHTML=""; return; }
  const hours = data.list.slice(0, 8); // next 24h (3h * 8)
  hourlyDiv.innerHTML = hours.map(item => {
    const dt = new Date(item.dt * 1000);
    const timeLabel = dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const dayLabel = dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const t = Math.round(item.main.temp);        // °C (forecast is metric)
    const w = Math.round(item.wind.speed);       // m/s
    const h = item.main.humidity;                // %
    const icon = item.weather?.[0]?.icon;
    const iconUrl = icon ? `https://openweathermap.org/img/wn/${icon}.png` : "";
    return `
      <div class="hour-card">
        <div class="time">${timeLabel}</div>
        <div class="sub">${dayLabel}</div>
        ${iconUrl ? `<img class="weather-icon" src="${iconUrl}" alt="Weather icon">` : ""}
        <div class="sub metric"><span>${ICONS.temp}</span><strong>${t}°C</strong></div>
        <div class="sub metric"><span>${ICONS.wind}</span><strong>${w} m/s</strong></div>
        <div class="sub metric"><span>${ICONS.hum}</span><strong>${h}%</strong></div>
      </div>
    `;
  }).join("");
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
        <p class="font-semibold text-slate-900">${dayLabel} • <span class="text-slate-500">${dateLabel}</span></p>
        ${iconUrl?`<img class="weather-icon" src="${iconUrl}" alt="Weather icon">`:""}
        <div class="mt-1 space-y-1 text-sm text-slate-700">
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

// Init
updateRecentCitiesDropdown();

// feat(js): 5-day forecast renderer with date/temp/wind/humidity (marker)

// feat(js): recent cities dropdown with localStorage (marker)
