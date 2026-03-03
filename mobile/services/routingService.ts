import axios from 'axios';

export interface RouteCoord {
    latitude: number;
    longitude: number;
}

export const routingService = {
    // Geocode address using RapidAPI (Google Maps API Proxy)
    geocodeAddress: async (address: string): Promise<RouteCoord | null> => {
        // Try RapidAPI First
        try {
            const RAPID_API_KEY = 'd9dcd2ed79mshc1c06f9daa6331dp178d0cjsne0c1cf1ab3a4';
            const RAPID_API_HOST = 'google-api31.p.rapidapi.com';

            const response = await axios.post(
                `https://${RAPID_API_HOST}/map2`,
                {
                    text: address,
                    place: '', street: '', city: '', country: '', state: '', postalcode: '',
                    latitude: '', longitude: '', radius: ''
                },
                {
                    headers: {
                        'x-rapidapi-key': RAPID_API_KEY,
                        'x-rapidapi-host': RAPID_API_HOST,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            const results = response.data.result;
            if (results && results.length > 0) {
                const first = results[0];
                if (first.latitude && first.longitude) {
                    return {
                        latitude: parseFloat(first.latitude),
                        longitude: parseFloat(first.longitude)
                    };
                }
            }
        } catch (error) {
            console.warn('RapidAPI Geocoding failed, trying fallback...');
        }

        // Fallback: Nominatim (OpenStreetMap)
        try {
            const encodedAddr = encodeURIComponent(address);
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddr}&limit=1`, {
                headers: { 'User-Agent': 'GasCylinderApp-Driver' }
            });

            if (response.data && response.data.length > 0) {
                const first = response.data[0];
                return {
                    latitude: parseFloat(first.lat),
                    longitude: parseFloat(first.lon)
                };
            }
        } catch (error) {
            console.error('All Geocoding attempts failed:', error);
        }
        return null;
    },

    // Get route polyline from OSRM
    getRoute: async (startPos: RouteCoord, endPos: RouteCoord): Promise<RouteCoord[]> => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${startPos.longitude},${startPos.latitude};${endPos.longitude},${endPos.latitude}?overview=full&geometries=geojson`;
            const response = await axios.get(url);
            if (response.data.routes && response.data.routes.length > 0) {
                const coordinates = response.data.routes[0].geometry.coordinates;
                return coordinates.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
            }
        } catch (error) {
            console.error('Routing error:', error);
        }
        return [];
    }
};
