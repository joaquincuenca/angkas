import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// 🧭 Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
});

// 🖱️ Detect user clicks on map
function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

// 🌐 Map helper buttons
function MapButtons({ reset }) {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-50">
      <button
        onClick={reset}
        className="bg-indigo-700 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-800 transition"
      >
        Reset
      </button>
    </div>
  );
}

function App() {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🚕 Fare settings
  const baseFare = 50;
  const baseKm = 4;
  const extraRate = 15;

  // 🧮 OpenRouteService API
  async function getAccurateDistance(start, end) {
    const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZhMGNmMzAyYWZkNDRhMTNhMjlhOWVjZGM5NDAwNDFiIiwiaCI6Im11cm11cjY0In0=";
    const url = "https://api.openrouteservice.org/v2/directions/driving-car";
    const body = { coordinates: [[start.lng, start.lat], [end.lng, end.lat]] };

    try {
      setLoading(true);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      const distanceInKm = data.routes[0].summary.distance / 1000;
      setDistance(distanceInKm);
    } catch (error) {
      console.error(error);
      alert("Failed to get distance. Check API key.");
    } finally {
      setLoading(false);
    }
  }

  const handleSelect = (latlng) => {
    if (!pickup) {
      setPickup(latlng);
    } else if (!destination) {
      setDestination(latlng);
      getAccurateDistance(pickup, latlng);
    } else {
      setPickup(latlng);
      setDestination(null);
      setDistance(null);
    }
  };

  // 🚀 Computed fare
  let computedFare = 0;
  if (distance) {
    computedFare = distance <= baseKm ? baseFare : baseFare + (distance - baseKm) * extraRate;
  }

  const resetMap = () => {
    setPickup(null);
    setDestination(null);
    setDistance(null);
  };

  return (
    <div className="h-screen flex flex-col relative bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center p-4 bg-gray-800 shadow-lg">
        Pekeng Siklista
      </h1>

      {/* Map */}
      <MapContainer
        center={[14.1122, 122.9553]}
        zoom={13}
        className="flex-1 z-0"
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationSelector onSelect={handleSelect} />

        {pickup && (
          <Marker position={pickup} icon={markerIcon}>
            <Popup>Pickup Point</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={destination} icon={markerIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Reset Button */}
      <MapButtons reset={resetMap} />

      {/* Show receipt only if both pins are set */}
      {pickup && destination && distance && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 shadow-xl rounded-xl p-6 w-80 border border-gray-700 z-50">
          <h2 className="text-xl font-bold text-center mb-2 text-white">Ride Receipt</h2>
          <hr className="mb-2 border-gray-600" />
          <p className="text-gray-300 text-sm">
            <span className="font-semibold">Pickup:</span> {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
          </p>
          <p className="text-gray-300 text-sm">
            <span className="font-semibold">Destination:</span> {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
          </p>
          <p className="text-gray-200 mt-2">
            <span className="font-semibold">Distance:</span> {distance.toFixed(2)} km
          </p>
          <p className="text-gray-200">
            <span className="font-semibold">Base Fare:</span> ₱{baseFare} (first {baseKm} km)
          </p>
          {distance > baseKm && (
            <p className="text-gray-200">
              <span className="font-semibold">Extra:</span> ₱{extraRate} × {(distance - baseKm).toFixed(2)} km
            </p>
          )}
          <p className="text-green-400 font-bold text-lg mt-2">
            Total Fare: ₱{computedFare.toFixed(2)}
          </p>
          {distance <= baseKm && (
            <p className="text-xs text-gray-500 text-center mt-1">(Minimum fare applied)</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
