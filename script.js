// Falvonal pontosabb, 200m max ponttávolságú koordináták
const wallCoords = [
  [52.5584, 13.3203],
  [52.5520, 13.3270],
  [52.5445, 13.3360],
  [52.5385, 13.3450],
  [52.5330, 13.3555],
  [52.5260, 13.3680],
  [52.5215, 13.3785],
  [52.5180, 13.3900],
  [52.5150, 13.4000],
  [52.5110, 13.4100],
  [52.5080, 13.4180],
  [52.5050, 13.4260],
  [52.4990, 13.4340],
  [52.4935, 13.4410],
  [52.4880, 13.4480],
  [52.4820, 13.4565],
  [52.4765, 13.4650],
  [52.4705, 13.4740],
  [52.4660, 13.4830],
  [52.4610, 13.4910],
  [52.4550, 13.5005],
  [52.4490, 13.5080],
  [52.4435, 13.5160],
  [52.4380, 13.5240],
  [52.4325, 13.5310],
  [52.4280, 13.5370],
  [52.4240, 13.5440],
  [52.4200, 13.5500],
  [52.4165, 13.5575],
  [52.4140, 13.5640],
  [52.4100, 13.5705],
  [52.4050, 13.5770],
  [52.4000, 13.5830],
  [52.3955, 13.5895],
  [52.3910, 13.5960],
  [52.3865, 13.6020],
];

// A többi kód változatlan (interpoláció, térkép stb.) - lásd előző teljes scriptet!

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

function interpolatePoints(lat1, lon1, lat2, lon2, maxDist = 200) {
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

function densifyWallCoords(coords) {
  let denseCoords = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];
    const interpolated = interpolatePoints(lat1, lon1, lat2, lon2, 200);
    denseCoords = denseCoords.concat(interpolated.slice(0, -1));
  }
  denseCoords.push(coords[coords.length - 1]);
  return denseCoords;
}

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

  const maxDistanceBerlin = 3000; // 3 km távolságon kívül Nem-Berlin

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
      status.textContent = `Nem-Berlin. Távolság a falhoz: ${distance.toFixed(1)} m.`;
    } else {
      status.textContent = `📍 Jelenlegi hely: ${side}, ${distance.toFixed(1)} méterre a falhoz legközelebbi ponttól.`;
    }

    if (!map) {
      map = L.map('map').setView([lat, lon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // Falvonal megjelenítése
      L.polyline(detailedWallCoords, {color: 'red', weight: 4, opacity: 0.7}).addTo(map);
    } else {
      map.setView([lat, lon], 13);
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
