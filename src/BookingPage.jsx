import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
function LocationSelector({ onSelect, hideHint }) {
  useMapEvents({
    click(e) {
      hideHint(); // hide popup when user clicks
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

function BookingPage() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // 🚕 Fare settings
  const baseFare = 50;
  const baseKm = 3;
  const extraRate = 15;

  // 🧮 OpenRouteService API
  async function getAccurateDistance(start, end) {
    const apiKey =
      "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZhMGNmMzAyYWZkNDRhMTNhMjlhOWVjZGM5NDAwNDFiIiwiaCI6Im11cm11cjY0In0=";
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
    computedFare =
      distance <= baseKm
        ? baseFare
        : baseFare + (distance - baseKm) * extraRate;
  }

  const resetMap = () => {
    setPickup(null);
    setDestination(null);
    setDistance(null);
  };

  // 🌐 Facebook redirect
  const openFacebookPage = () => {
    window.open(
      "https://www.facebook.com/profile.php?id=61582462506784",
      "_blank"
    );
  };

  return (
    <div className="h-screen flex flex-col relative bg-gray-900 text-white">
      {/* 🧭 Header */}
      <div className="flex justify-between items-center p-4 bg-gray-800 shadow-md sticky top-0 z-50">
        <button
          onClick={() => navigate("/")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-1"
        >
          ← <span className="hidden sm:inline">Back to Home</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-center">
          Pekeng Siklista
        </h1>
        <div className="w-[100px]" />
      </div>

      {/* 💬 Popup Hint Overlay */}
      {showHint && (
        <div
          className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[999]"
          onClick={() => setShowHint(false)}
        >
          <div className="bg-white text-gray-800 rounded-xl shadow-2xl p-8 w-80 text-center animate-bounce">
            <h2 className="text-lg font-bold mb-2">📍 How to Book a Ride</h2>
            <p className="text-sm mb-4">
              Tap on the map to set your <b>pickup location</b>, then tap again
              to set your <b>destination</b>.
            </p>
            <p className="text-xs text-gray-600">(Tap anywhere to continue)</p>
          </div>
        </div>
      )}

      {/* 🗺️ Map Section */}
      <div className="relative flex-1">
        <MapContainer
          center={[14.1122, 122.9553]}
          zoom={13}
          className="w-full h-full z-0"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationSelector
            onSelect={handleSelect}
            hideHint={() => setShowHint(false)}
          />

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

        <MapButtons reset={resetMap} />

        {/* 📄 Fare Receipt */}
        {pickup && destination && distance && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 shadow-xl rounded-xl p-6 w-72 sm:w-80 border border-gray-700 z-50 flex flex-col items-center">
            <h2 className="text-xl font-bold text-center mb-2 text-white">
              Ride Receipt
            </h2>
            <hr className="mb-2 border-gray-600" />
            <p className="text-gray-300 text-sm">
              <span className="font-semibold">Pickup:</span>{" "}
              {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
            </p>
            <p className="text-gray-300 text-sm">
              <span className="font-semibold">Destination:</span>{" "}
              {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
            </p>
            <p className="text-gray-200 mt-2">
              <span className="font-semibold">Distance:</span>{" "}
              {distance.toFixed(2)} km
            </p>
            <p className="text-gray-200">
              <span className="font-semibold">Base Fare:</span> ₱{baseFare}{" "}
              (first {baseKm} km)
            </p>
            {distance > baseKm && (
              <p className="text-gray-200">
                <span className="font-semibold">Extra:</span> ₱{extraRate} ×{" "}
                {(distance - baseKm).toFixed(2)} km
              </p>
            )}
            <p className="text-green-400 font-bold text-lg mt-2">
              Total Fare: ₱{computedFare.toFixed(2)}
            </p>
            {distance <= baseKm && (
              <p className="text-xs text-gray-500 text-center mt-1">
                (Minimum fare applied)
              </p>
            )}

            {/* 📸 Instruction Text */}
            <p className="text-sm text-gray-400 text-center mt-4">
              Screenshot this receipt and send it to our Facebook page to
              confirm your booking.
            </p>

            {/* 🌐 Facebook Booking Button */}
            <button
              onClick={openFacebookPage}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md w-full transition"
            >
              Book via Facebook
            </button>
          </div>
        )}
      </div>

      {/* 🕓 Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-lg">
          Calculating distance...
        </div>
      )}
    </div>
  );
}

export default BookingPage;
