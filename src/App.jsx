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
  iconSize: [30, 30],
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

function App() {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🚕 Fare settings
  const baseFare = 50; // ₱ for first 4km
  const baseKm = 4; // Minimum covered distance
  const extraRate = 15; // ₱ per km beyond 4km

  // 🧮 Fetch accurate driving distance from OpenRouteService
  async function getAccurateDistance(start, end) {
    const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZhMGNmMzAyYWZkNDRhMTNhMjlhOWVjZGM5NDAwNDFiIiwiaCI6Im11cm11cjY0In0=";
    const url = "https://api.openrouteservice.org/v2/directions/driving-car";
    const body = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };

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
      const distanceInMeters = data.routes[0].summary.distance;
      const distanceInKm = distanceInMeters / 1000;
      setDistance(distanceInKm);
    } catch (error) {
      console.error("Error fetching distance:", error);
      alert("Failed to get accurate distance. Check your API key or try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle user clicks
  const handleSelect = (latlng) => {
    if (!pickup) {
      setPickup(latlng);
      setDestination(null);
      setDistance(null);
    } else if (!destination) {
      setDestination(latlng);
      getAccurateDistance(pickup, latlng);
    } else {
      setPickup(latlng);
      setDestination(null);
      setDistance(null);
    }
  };

  // 🪙 Compute fare
  let computedFare = 0;
  if (distance) {
    if (distance <= baseKm) {
      computedFare = baseFare;
    } else {
      computedFare = baseFare + (distance - baseKm) * extraRate;
    }
  }

  return (
    <div className="h-screen flex flex-col relative">
      <h1 className="text-2xl font-bold text-center p-4 bg-gray-800 text-white">
        Pekeng Siklista
      </h1>

      {/* Map */}
      <MapContainer
        center={[14.1122, 122.9553]} // Daet, Camarines Norte
        zoom={13}
        className="flex-1 z-0"
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

      {/* Footer Info */}
      <div className="p-4 bg-gray-100 text-center z-10">
        {loading ? (
          <p className="text-blue-600 font-semibold">Calculating distance...</p>
        ) : distance ? (
          <>
            <p className="text-lg font-semibold">
              Distance: {distance.toFixed(2)} km
            </p>
            <p className="text-lg font-semibold">
              Rate: ₱{extraRate}/km (after 4km)
            </p>
            <p className="text-xl text-green-600 font-bold">
              Total Fare: ₱{computedFare.toFixed(2)}
            </p>
            {distance <= baseKm && (
              <p className="text-sm text-gray-600">(Minimum fare applied)</p>
            )}
          </>
        ) : (
          <p className="text-gray-700">Select pickup and destination pins</p>
        )}
      </div>

      {/* Floating Receipt */}
      {distance && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg p-5 w-72 border border-gray-300 z-50">
          <h2 className="text-lg font-bold text-center mb-2 text-gray-800">
            Ride Receipt
          </h2>
          <hr className="mb-2" />
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">Pickup:</span>{" "}
            {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
          </p>
          <p className="text-gray-700 text-sm">
            <span className="font-semibold">Destination:</span>{" "}
            {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
          </p>
          <p className="text-gray-800 mt-2">
            <span className="font-semibold">Distance:</span>{" "}
            {distance.toFixed(2)} km
          </p>
          <p className="text-gray-800">
            <span className="font-semibold">Base Fare:</span> ₱{baseFare} (for 4 km)
          </p>
          {distance > baseKm && (
            <p className="text-gray-800">
              <span className="font-semibold">Extra:</span> ₱{extraRate} ×{" "}
              {(distance - baseKm).toFixed(2)} km
            </p>
          )}
          <p className="text-green-600 font-bold text-lg">
            Total Fare: ₱{computedFare.toFixed(2)}
          </p>
          {distance <= baseKm && (
            <p className="text-xs text-gray-500 text-center mt-1">
              (Minimum fare applied)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
