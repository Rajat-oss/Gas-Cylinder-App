import * as Location from 'expo-location';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * Optimized Location Tracking Component
 * Periodically updates driver location on the server.
 */
const LocationTracker = () => {
    const { user, token, logout } = useAuth();

    useEffect(() => {
        let subscription: any = null;

        const startTracking = async () => {
            // Requirement: If token/user doesn't exist, stop
            if (!token || !user) return;

            try {
                // 1. Request Permission
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('[Location] Permission denied. Real-time tracking disabled.');
                    return;
                }

                // 2. Start Real-time Watching
                // watchPositionAsync is more accurate & handles updates automatically when moving
                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High, // Force high accuracy for real-time fleet tracking
                        timeInterval: 15000,             // Minimum 15 seconds to stay "Active"
                    },
                    async (location) => {
                        try {
                            const { latitude, longitude } = location.coords;

                            // Send to Backend
                            await api.patch('/auth/location', { latitude, longitude });

                            // Success log for verification in mobile console
                            console.log(`[GPS-Active] ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        } catch (error: any) {
                            if (error.response?.status === 401) {
                                console.error('[Auth] Session invalid. Logging out...');
                                logout();
                            } else {
                                console.error('[API] Failed to update location:', error.message);
                            }
                        }
                    }
                );

                console.log('[System] High-accuracy tracking initialized.');

            } catch (error: any) {
                console.error('[System] Tracking initialization failed:', error);
            }
        };

        startTracking();

        // CLEANUP: Stop watching when user logs out or leaves page
        return () => {
            if (subscription) {
                subscription.remove();
                console.log('[System] Tracking stopped.');
            }
        };
    }, [user, token, logout]);

    return null; // Logic-only component
};

export default LocationTracker;
