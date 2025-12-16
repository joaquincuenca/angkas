export class GeocodeService {
    static async searchAddress(query, lat = 14.1218, lon = 122.9566) {
        try {
            const GEOCODE_API_URL = import.meta.env.VITE_GEOCODE_API_URL;

            const url = `${GEOCODE_API_URL}${encodeURIComponent(query)}&limit=10&viewbox=${lon - 0.5},${lat - 0.5},${lon + 0.5},${lat + 0.5}&bounded=1`;

            const res = await fetch(url, {
                headers: {
                    "User-Agent": "TrikeBookingApp/1.0",
                },
            });

            if (!res.ok) {
                return [];
            }

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                return [];
            }

            return data.map((place) => ({
                lat: parseFloat(place.lat),
                lon: parseFloat(place.lon),
                display_name: place.display_name,
                type: place.type || place.class || "place",
            }));
        } catch (error) {
            return [];
        }
    }

    static async reverseGeocode(latlng) {
        try {
            const REVERSE_GEOCODE_API_URL =
                import.meta.env.VITE_REVERSE_GEOCODE_API_URL;

            const url = `${REVERSE_GEOCODE_API_URL}${latlng.lat}&lon=${latlng.lng}`;

            const res = await fetch(url, {
                headers: {
                    "User-Agent": "TrikeBookingApp/1.0",
                },
            });

            if (!res.ok) {
                return "";
            }

            const data = await res.json();
            return data.display_name || "";
        } catch (error) {
            return "";
        }
    }
}

window.testGeocode = async (query = "Daet") => {
    return await GeocodeService.searchAddress(query);
};
