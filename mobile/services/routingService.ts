import axios from 'axios';

export interface RouteCoord {
    latitude: number;
    longitude: number;
}

export const routingService = {

    // Geocode: Nominatim (free) → Google Maps (existing key) fallback
    // RapidAPI removed — was hitting 429 rate limits
    geocodeAddress: async (address: string): Promise<RouteCoord | null> => {

        // 1️⃣ Nominatim (OpenStreetMap) — free, no key needed
        try {
            const encodedAddr = encodeURIComponent(address + ', India');
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddr}&limit=1`,
                {
                    headers: { 'User-Agent': 'GasCylinderApp-Driver/1.0' },
                    timeout: 6000,
                }
            );
            if (response.data && response.data.length > 0) {
                const first = response.data[0];
                return {
                    latitude: parseFloat(first.lat),
                    longitude: parseFloat(first.lon),
                };
            }
        } catch (e: any) {
            console.warn('Nominatim geocoding failed, trying Google Maps...');
        }

        // 2️⃣ Google Maps Geocoding API — uses existing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
        try {
            const GMAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!GMAPS_KEY) throw new Error('No Google Maps key configured');

            const encodedAddr = encodeURIComponent(address);
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddr}&key=${GMAPS_KEY}`,
                { timeout: 6000 }
            );

            if (response.data.status === 'OK' && response.data.results?.length > 0) {
                const loc = response.data.results[0].geometry.location;
                return { latitude: loc.lat, longitude: loc.lng };
            }
        } catch (e: any) {
            console.warn('Google Maps geocoding failed:', e.message);
        }

        return null;
    },

    // Route polyline from OSRM (free, no key)
    getRoute: async (startPos: RouteCoord, endPos: RouteCoord): Promise<RouteCoord[]> => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${startPos.longitude},${startPos.latitude};${endPos.longitude},${endPos.latitude}?overview=full&geometries=geojson`;
            const response = await axios.get(url, { timeout: 8000 });
            if (response.data.routes && response.data.routes.length > 0) {
                const coordinates = response.data.routes[0].geometry.coordinates;
                return coordinates.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
            }
        } catch (error) {
            console.warn('OSRM routing failed:', error);
        }
        return [];
    },
};
