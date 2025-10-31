import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [38, 38],
});

// Detect user clicks on map
function LocationSelector({ onSelect, hideHint }) {
  useMapEvents({
    click(e) {
      hideHint();
      onSelect(e.latlng);
    },
  });
  return null;
}

// Map helper buttons
function MapButtons({ reset }) {
  return (
    <div className="absolute top-5 left-5 flex flex-col gap-3 z-50">
      <button
        onClick={reset}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-xl shadow-md transition-all"
      >
        Reset
      </button>
    </div>
  );
}

// Automatically center map on user location
function AutoCenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
}

function BookingPage() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  // Fare settings
  const baseFare = 50;
  const baseKm = 3;
  const extraRate = 15;

  // OpenRouteService API
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
      alert("Failed to get distance. Please try again later.");
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

  // Computed fare
  const computedFare =
    distance != null
      ? distance <= baseKm
        ? baseFare
        : baseFare + (distance - baseKm) * extraRate
      : 0;

  const resetMap = () => {
    setPickup(userLocation); // keep user's location as pickup
    setDestination(null);
    setDistance(null);
  };

  const openFacebookPage = () =>
    window.open("https://www.facebook.com/profile.php?id=61582462506784", "_blank");

  // 🧭 Detect user’s current location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userPos = { lat: latitude, lng: longitude };
          setUserLocation(userPos);
          setPickup(userPos);
          setShowHint(true);
        },
        (err) => {
          console.error(err);
          alert("Unable to get your location. Please enable GPS.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, []);

  return (
    <div className="h-screen flex flex-col relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 text-white">
      {/* Header */}
      <header className="flex justify-between items-center px-5 py-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-lg">
        <button
          onClick={() => navigate("/")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          ← <span className="hidden sm:inline">Back</span>
        </button>
        <h1 className="text-2xl font-bold tracking-wide">Ghetto Rider</h1>
        <div className="w-[80px]" />
      </header>

      {/* Hint Popup */}
      {showHint && (
        <div
          className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[999] cursor-pointer"
          onClick={() => setShowHint(false)}
        >
          <div className="bg-white text-gray-800 rounded-2xl shadow-2xl p-8 w-80 text-center animate-fadeIn">
            <h2 className="text-lg font-bold mb-2">How to Book a Ride</h2>
            <p className="text-sm mb-4">
              Your <b>pickup</b> location is automatically set to where you are now.
              Tap on the map to set your <b>destination</b>.
            </p>
            <p className="text-xs text-gray-600">(Tap anywhere to continue)</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative flex-1">
        <MapContainer
          center={userLocation || [14.1122, 122.9553]}
          zoom={13}
          className="w-full h-full z-0"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {userLocation && <AutoCenterMap position={userLocation} />}

          <LocationSelector onSelect={handleSelect} hideHint={() => setShowHint(false)} />

          {pickup && (
            <Marker position={pickup} icon={markerIcon}>
              <Popup>Your Pickup Point</Popup>
            </Marker>
          )}
          {destination && (
            <Marker position={destination} icon={markerIcon}>
              <Popup>Destination</Popup>
            </Marker>
          )}
        </MapContainer>

        <MapButtons reset={resetMap} />

        {/* Fare Receipt */}
        {pickup && destination && distance && (
          <div className="absolute right-5 bottom-5 bg-gray-900 text-white border border-gray-700 shadow-2xl rounded-2xl p-6 w-80 transition-all animate-slideUp">
            <h2 className="text-xl font-bold text-center mb-3">Ride Summary</h2>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-semibold text-gray-200">Pickup:</span>{" "}
                {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
              </p>
              <p>
                <span className="font-semibold text-gray-200">Destination:</span>{" "}
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </p>
              <p>
                <span className="font-semibold text-gray-200">Distance:</span>{" "}
                {distance.toFixed(2)} km
              </p>
              <p>
                <span className="font-semibold text-gray-200">Base Fare:</span> ₱{baseFare} (
                first {baseKm} km)
              </p>
              {distance > baseKm && (
                <p>
                  <span className="font-semibold text-gray-200">Extra:</span> ₱{extraRate} ×{" "}
                  {(distance - baseKm).toFixed(2)} km
                </p>
              )}
            </div>
            <div className="text-center mt-3">
              <p className="text-green-400 font-bold text-lg">
                Total Fare: ₱{computedFare.toFixed(2)}
              </p>
              {distance <= baseKm && (
                <p className="text-xs text-gray-400">(Minimum fare applied)</p>
              )}
            </div>

            <p className="text-xs text-gray-300 text-center mt-4">
              Screenshot this and send it to our Facebook page to confirm booking.
            </p>

            <button
              onClick={openFacebookPage}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-lg font-medium shadow-md transition"
            >
              Book via Facebook
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-lg font-medium z-[1000]">
          <div className="animate-pulse">Calculating distance...</div>
        </div>
      )}
    </div>
  );
}

export default BookingPage;
