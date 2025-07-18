const wallCoords = [
  [52.516, 13.375],
  [52.520, 13.395],
  [52.515, 13.410],
  [52.510, 13.420]
];

let map, marker;

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

  if (minDist > 10000) {
    return { side: "Nem-Berlin", distance: minDist };
  }

  const side = lon < closest.wallLon ? "Nyugat-Berlin" : "Kelet-Berlin";
  return { side, distance: minDist };
}

function getMarkerColor(side) {
  switch (side) {
    case "Nyugat-Berlin": return "blue";
    case "Kelet-Berlin": return "red";
    default: return "gray";
  }
}

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
    const { side, distance } = determineSide(lat, lon);

    let color = getMarkerColor(side);
    status.style.color = color;

    if (side === "Nem-Berlin") {
      status.textContent = `📍 Jelenlegi hely: Nem-Berlin (${distance.toFixed(1)} m-re a fal közelétől).`;
    } else {
      status.textContent = `📍 Jelenlegi hely: ${side}, ${distance.toFixed(1)} m-re a falhoz legközelebbi ponttól.`;
    }

    if (!map) {
      map = L.map('map').setView([lat, lon], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }

    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.circleMarker([lat, lon], {
        radius: 10,
        color: color,
        fillColor: color,
        fillOpacity: 0.9
      }).addTo(map);
    }

    // Szín frissítése, ha már volt marker
    if (marker.setStyle) {
      marker.setStyle({
        color: color,
        fillColor: color
      });
    }

  }, (error) => {
    status.textContent = `Hiba a helymeghatározás során: ${error.message}`;
    status.style.color = 'orange';
  });
}
