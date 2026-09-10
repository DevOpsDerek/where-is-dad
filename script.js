const DATA_URL = "data/location.json";
const REFRESH_MS = 60 * 1000; // re-check for a new position every minute

const statusEl = document.getElementById("status");
let map;
let marker;

function initMap(lat, lon) {
  map = L.map("map", { zoomControl: true }).setView([lat, lon], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);
  marker = L.marker([lat, lon]).addTo(map);
}

function timeAgo(isoString) {
  if (!isoString) return "never";
  const then = new Date(isoString).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

async function refresh() {
  try {
    const res = await fetch(`${DATA_URL}?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const loc = await res.json();
    const { lat, lon, timestamp, message } = loc;

    if (!map) {
      initMap(lat, lon);
    } else {
      marker.setLatLng([lat, lon]);
    }

    const popupText = `${message || "Thinking of you!"}<br><small>${timeAgo(timestamp)}</small>`;
    marker.bindPopup(popupText).openPopup();

    statusEl.textContent = timestamp
      ? `Last check-in: ${timeAgo(timestamp)}`
      : "No check-in yet — waiting for the first update.";
  } catch (err) {
    if (!map) initMap(51.5074, -0.1278);
    statusEl.textContent = "Couldn't load location data. Retrying…";
    console.error(err);
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
