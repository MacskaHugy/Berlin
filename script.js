const wallCoords = [
  [52.5491, 13.3370], // Nordwest Ecke Reinickendorf
  [52.5483, 13.3392],
  [52.5470, 13.3430],
  [52.5458, 13.3475],
  [52.5442, 13.3518],
  [52.5430, 13.3555],
  [52.5417, 13.3597],
  [52.5405, 13.3635],
  [52.5392, 13.3675],
  [52.5375, 13.3722], // Nähe Mauerpark
  [52.5358, 13.3759],
  [52.5342, 13.3793],
  [52.5328, 13.3830],
  [52.5315, 13.3863],
  [52.5300, 13.3905],
  [52.5288, 13.3942],
  [52.5275, 13.3978],
  [52.5260, 13.4017],
  [52.5247, 13.4055],
  [52.5230, 13.4090], // Nähe Wedding
  [52.5215, 13.4125],
  [52.5200, 13.4160],
  [52.5185, 13.4195],
  [52.5170, 13.4230],
  [52.5155, 13.4263],
  [52.5140, 13.4298],
  [52.5125, 13.4330],
  [52.5110, 13.4365],
  [52.5095, 13.4397],
  [52.5080, 13.4430], // Nähe Gesundbrunnen
  [52.5065, 13.4463],
  [52.5050, 13.4495],
  [52.5035, 13.4527],
  [52.5020, 13.4558],
  [52.5005, 13.4588],
  [52.4990, 13.4619],
  [52.4975, 13.4648],
  [52.4960, 13.4678], // Nähe Prenzlauer Berg
  [52.4945, 13.4707],
  [52.4930, 13.4735],
  [52.4915, 13.4762],
  [52.4900, 13.4790],
  [52.4885, 13.4817],
  [52.4870, 13.4843],
  [52.4855, 13.4870],
  [52.4840, 13.4895],
  [52.4825, 13.4920],
  [52.4810, 13.4945], // Nähe Kreuzberg
  [52.4795, 13.4969],
  [52.4780, 13.4992],
  [52.4765, 13.5015],
  [52.4750, 13.5037]
];

const BERLIN_CENTER = [52.5200, 13.4050];
const BERLIN_RADIUS = 20000;

let map, marker, wallLine, berlinCircle;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function determineSide(lat, lon) {
  let minDist = Infinity;
  let closest = null;

  for (const [wallLat, wallLon] of wallCoords) {
    const dist = haversine(lat, lon, wallLat, wallLon);
    if (dist < minDist) {
      minDist = dist;
      closest = { wallLat, wallLon };
    }
  }

  const distanceToBerlinCenter = haversine(lat, lon, BERLIN_CENTER[0], BERLIN_CENTER[1]);
  if (distanceToBerlinCenter > BERLIN_RADIUS) {
    return { side: "Nem-Berlin", distance: minDist };
  }

  const side = lon < closest.wallLon ? "Nyugat-Berlin" : "Kelet-Berlin";
  return { side, distance: minDist };
}

function getMarkerColor(side) {
  switch (side) {
    case "Kelet-Berlin": return "red";
    case "Nyugat-Berlin": return "blue";
    default: return "gray";
  }
}

function getLocation() {
  const status = document.getElementById("status");

  if (!navigator.geolocation) {
    status.textContent = "A böngésződ nem támogatja a geolokációt.";
    status.style.color = "orange";
    return;
  }

  status.textContent = "📡 Helymeghatározás folyamatban...";
  status.style.color = "white";

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const { side, distance } = determineSide(lat, lon);
    const color = getMarkerColor(side);

    status.style.color = color;
    status.textContent = side === "Nem-Berlin"
      ? `📍 Nem-Berlin (${distance.toFixed(1)} m a fal legközelebbi pontjától)`
      : `📍 ${side} (${distance.toFixed(1)} m a fal legközelebbi pontjától)`;

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
      marker.setStyle({ color, fillColor: color });
    } else {
      marker = L.circleMarker([lat, lon], {
        radius: 10,
        color: color,
        fillColor: color,
        fillOpacity: 0.9
      }).addTo(map);
    }
  }, error => {
    status.style.color = "orange";
    status.textContent = `❌ Hiba a helymeghatározás során: ${error.message}`;
  });
}
