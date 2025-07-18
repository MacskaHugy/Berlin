// Eredeti falvonal pontjai (kb. Berlin falának nyomvonala, 20 pont)
const wallCoords = [
  [52.5555, 13.3330],
  [52.5450, 13.3450],
  [52.5350, 13.3700],
  [52.5250, 13.3950],
  [52.5150, 13.4100],
  [52.5050, 13.4250],
  [52.4950, 13.4400],
  [52.4850, 13.4600],
  [52.4750, 13.4800],
  [52.4650, 13.4950],
  [52.4550, 13.5100],
  [52.4450, 13.5250],
  [52.4350, 13.5400],
  [52.4250, 13.5550],
  [52.4150, 13.5700],
  [52.4050, 13.5850],
  [52.3950, 13.6000],
  [52.3850, 13.6150],
  [52.3750, 13.6300],
  [52.3650, 13.6450],
];

// Haversine formula a távolság számításához méterben
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Két pont között interpolál, max 100 m távolság
function interpolatePoints(lat1, lon1, lat2, lon2, maxDist = 100) {
  const dist = haversine(lat1, lon1, lat2, lon2);
  const numPoints = Math.ceil(dist / maxDist);
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const lat = lat1 + (lat2 - lat1) * (i / numPoints);
    const lon = lon1 + (lon2 - lon1) * (i / numPoints);
    points.push([lat, lon]);
  }
  return points;
}

// Az egész falvonalat sűríti max 100 m pontközre
function densifyWallCoords(coords) {
  let denseCoords = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];
    const interpolated = interpolatePoints(lat1, lon1, lat2, lon2, 100);
    denseCoords = denseCoords.concat(interpolated.slice(0, -1));
  }
  denseCoords.push(coords[coords.length - 1]);
  return denseCoords;
}

// Megnézi, hogy egy pont melyik oldalon van a falvonalhoz képest (a legközelebbi falpont hosszúsági koordinátája alapján)
function determineSide(lat, lon, wallCoords) {
  let minDist = Infinity;
  let closest = null;

  for (const [wallLat, wallLon] of wallCoords) {
    const dist = haversine(lat, lon, wallLat, wallLon);
    if (dist < minDist) {
      minDist = dist;
      closest = { wallLat, wallLon };
    }
  }

  // Ha túl messze van (pl. több km), akkor nem Berlin
  const maxDistanceBerlin = 3000; // 3 km

  if (minDist > maxDistanceBerlin) {
    return { side: "Nem-Berlin", distance: minDist };
  }

  const side = lon < closest.wallLon ? "Nyugat-Berlin" : "Kelet-Berlin";
  return { side, distance: minDist };
}

let map, marker;
const detailedWallCoords = densifyWallCoords(wallCoords);

function getLocation() {
  const status = document.getElementById("status");

  if (!navigator.geolocation) {
    status.textContent = "A böngésződ nem támogatja a geolokációt.";
    return;
  }

  status.textContent = "Helymeghatározás folyamatban...";

  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const { side, distance } = determineSide(lat, lon, detailedWallCoords);

    if (side === "Nem-Berlin") {
      status.textContent = `Nem-Berlin. Távolság a falhoz: ${distance.toFixed(0)} m.`;
    } else {
      status.textContent = `📍 Jelenlegi hely: ${side}, kb. ${distance.toFixed(0)} méterre a falhoz legközelebbi ponttól.`;
    }

    if (!map) {
      map = L.map('map').setView([lat, lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Falvonal megjelenítése a térképen
      L.polyline(detailedWallCoords, {color: 'red', weight: 4, opacity: 0.7}).addTo(map);
    } else {
      map.setView([lat, lon], 14);
    }

    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.marker([lat, lon]).addTo(map);
    }

  }, (error) => {
    status.textContent = `Hiba a helymeghatározás során: ${error.message}`;
  });
}
