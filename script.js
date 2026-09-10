const DATA_URL = "data/location.json";
const REFRESH_MS = 60 * 1000; // re-check for a new position every minute

// Elliott's home base — Greengairs, Airdrie, North Lanarkshire, Scotland
const ELLIOTT_LOCATION = {
  lat: 55.9137,
  lon: -3.9416,
  name: "Elliott 🧒",
};

const statusEl = document.getElementById("status");
let map;
let marker;
let elliottMarker;
let distanceLine;

function initMap(lat, lon) {
  map = L.map("map", { zoomControl: true }).setView([lat, lon], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  marker = L.marker([lat, lon]).addTo(map);

  const elliottIcon = L.divIcon({
    html: "🧒",
    className: "emoji-marker",
    iconSize: [32, 32],
  });
  elliottMarker = L.marker([ELLIOTT_LOCATION.lat, ELLIOTT_LOCATION.lon], {
    icon: elliottIcon,
  })
    .addTo(map)
    .bindPopup("Elliott is here — Greengairs, Airdrie 🏡");

  distanceLine = L.polyline(
    [
      [lat, lon],
      [ELLIOTT_LOCATION.lat, ELLIOTT_LOCATION.lon],
    ],
    { color: "#e0245e", weight: 2, dashArray: "6, 8" }
  ).addTo(map);

  const bounds = L.latLngBounds([
    [lat, lon],
    [ELLIOTT_LOCATION.lat, ELLIOTT_LOCATION.lon],
  ]);
  map.fitBounds(bounds, { padding: [40, 40] });
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

// Haversine great-circle distance in kilometres
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km) {
  const miles = km * 0.621371;
  return `${km.toLocaleString(undefined, { maximumFractionDigits: 0 })} km (${miles.toLocaleString(
    undefined,
    { maximumFractionDigits: 0 }
  )} mi)`;
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
      distanceLine.setLatLngs([
        [lat, lon],
        [ELLIOTT_LOCATION.lat, ELLIOTT_LOCATION.lon],
      ]);
    }

    const popupText = `${message || "Thinking of you!"}<br><small>${timeAgo(timestamp)}</small>`;
    marker.bindPopup(popupText).openPopup();

    const km = distanceKm(lat, lon, ELLIOTT_LOCATION.lat, ELLIOTT_LOCATION.lon);
    const distanceText = formatDistance(km);

    statusEl.innerHTML = timestamp
      ? `Last check-in: ${timeAgo(timestamp)} &middot; ${distanceText} from Elliott`
      : `No check-in yet — waiting for the first update. &middot; ${distanceText} from Elliott`;
  } catch (err) {
    if (!map) initMap(51.5074, -0.1278);
    statusEl.textContent = "Couldn't load location data. Retrying…";
    console.error(err);
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
