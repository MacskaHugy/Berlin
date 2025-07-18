const wallCoords = [
  [52.5362, 13.3758],
  [52.5351, 13.3769],
  [52.5334, 13.3788],
  [52.5318, 13.3807],
  [52.5305, 13.3821],
  [52.5289, 13.3841],
  [52.5274, 13.3860],
  [52.5256, 13.3877],
  [52.5238, 13.3895],
  [52.5221, 13.3913],
  [52.5206, 13.3928],
  [52.5189, 13.3944],
  [52.5171, 13.3984],
  [52.5155, 13.4008],
  [52.5146, 13.4025],
  [52.5123, 13.4060],
  [52.5110, 13.4080],
  [52.5107, 13.4100],
  [52.5092, 13.4123],
  [52.5081, 13.4147],
  [52.5065, 13.4172],
  [52.5054, 13.4193]
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
    return;
  }

  status.textContent = "📡 Helymeghatározás folyamatban...";

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
