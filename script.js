const wallCoords = [
  [52.516, 13.375],
  [52.518, 13.385],
  [52.520, 13.395],
  [52.518, 13.405],
  [52.515, 13.410],
  [52.512, 13.415],
  [52.510, 13.420]
];

let map, marker, wallLine, berlinCircle;

const BERLIN_CENTER = [52.52, 13.405];
const BERLIN_RADIUS = 15000;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function determineSide(lat, lon) {
  let minDist = Infinity;
  let closest = null;

  for (const [wLat, wLon] of wallCoords) {
    const dist = haversine(lat, lon, wLat, wLon);
    if (dist < minDist) {
      minDist = dist;
      closest = { wLat, wLon };
    }
  }

  const distToBerlin = haversine(lat, lon, BERLIN_CENTER[0], BERLIN_CENTER[1]);
  if (distToBerlin > BERLIN_RADIUS) {
    return { side: "Nem-Berlin", distance: minDist };
  }

  const side = lon < closest.wLon ? "Nyugat-Berlin" : "Kelet-Berlin";
  return { side, distance: minDist };
}

function getMarkerColor(side) {
  if (side === "Nyugat-Berlin") return "blue";
  if (side === "Kelet-Berlin") return "red";
  return "gray";
}

function getLocation() {
  const status = document.getElementById("status");

  if (!navigator.geolocation) {
    status.textContent = "A böngésződ nem támogatja a geolokációt.";
    return;
  }

  status.textContent = "📡 Helymeghatározás folyamatban...";

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const { side, distance } = determineSide(lat, lon);
    const color = getMarkerColor(side);
    status.style.color = color;

    if (side === "Nem-Berlin") {
      status.textContent = `📍 Nem-Berlin (${distance.toFixed(1)} m a fal közelétől)`;
    } else {
      status.textContent = `📍 ${side} (${distance.toFixed(1)} m a falhoz legközelebbi ponttól)`;
    }

    if (!map) {
      map = L.map('map').setView([lat, lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      wallLine = L.polyline(wallCoords, {
        color: 'orange',
        weight: 4,
        dashArray: '6,6'
      }).addTo(map);

      berlinCircle = L.circle(BERLIN_CENTER, {
        radius: BERLIN_RADIUS,
        color: 'green',
        fillColor: 'green',
        fillOpacity: 0.07
      }).addTo(map);
    }

    if (marker) {
      marker.setLatLng([lat, lon]);
      marker.setStyle({ color: color, fillColor: color });
    } else {
      marker = L.circleMarker([lat, lon], {
        radius: 10,
        color: color,
        fillColor: color,
        fillOpacity: 0.9
      }).addTo(map);
    }

  }, error => {
    status.style.color = 'orange';
    status.textContent = `❌ Helymeghatározási hiba: ${error.message}`;
  });
}
