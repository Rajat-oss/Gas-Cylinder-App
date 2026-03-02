import * as Location from 'expo-location';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LocationTracker = () => {
    const { user, token } = useAuth();

    useEffect(() => {
        let intervalId: any;

        const startTracking = async () => {
            if (!user || !token) return;

            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Permission to access location was denied');
                return;
            }

            // Function to send current location
            const updateLocation = async () => {
                try {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });

                    await api.patch('/auth/location', {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    });
                } catch (error) {
                    console.error('Failed to update location:', error);
                }
            };

            // Initial update
            updateLocation();

            // Set interval for continuous updates (every 15 seconds for live monitoring)
            intervalId = setInterval(updateLocation, 15000);
        };

        startTracking();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user, token]);

    return null; // This component doesn't render anything
};

export default LocationTracker;
