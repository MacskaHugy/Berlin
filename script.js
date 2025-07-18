const wallCoords = [
  [52.5354, 13.3751],  // North West start
  [52.5350, 13.3767],
  [52.5346, 13.3782],
  [52.5339, 13.3810],
  [52.5333, 13.3833],
  [52.5326, 13.3859],
  [52.5321, 13.3881],
  [52.5314, 13.3905],
  [52.5306, 13.3931],
  [52.5300, 13.3949],
  [52.5292, 13.3971],
  [52.5287, 13.3987],
  [52.5281, 13.4006],
  [52.5273, 13.4030],
  [52.5267, 13.4053],
  [52.5261, 13.4069],
  [52.5254, 13.4089],
  [52.5249, 13.4109],
  [52.5240, 13.4141],
  [52.5233, 13.4162],
  [52.5228, 13.4183],
  [52.5222, 13.4207],
  [52.5218, 13.4227],
  [52.5213, 13.4250],
  [52.5208, 13.4268],
  [52.5202, 13.4286],
  [52.5195, 13.4308],
  [52.5190, 13.4324],
  [52.5184, 13.4344],
  [52.5179, 13.4360],
  [52.5173, 13.4380],
  [52.5168, 13.4395],
  [52.5162, 13.4412],
  [52.5157, 13.4428],
  [52.5150, 13.4447],
  [52.5144, 13.4465],
  [52.5138, 13.4485],
  [52.5132, 13.4503],
  [52.5126, 13.4523],
  [52.5120, 13.4541]
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
