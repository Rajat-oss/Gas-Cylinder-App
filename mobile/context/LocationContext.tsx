import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface LocationContextType {
    location: { latitude: number; longitude: number } | null;
    errorMsg: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { token, user, logout } = useAuth();

    useEffect(() => {
        let subscription: any = null;

        const startTracking = async () => {
            if (!token || !user) {
                setLocation(null);
                return;
            }

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 15000,
                        distanceInterval: 10,
                    },
                    async (loc) => {
                        const { latitude, longitude } = loc.coords;
                        setLocation({ latitude, longitude });

                        // Sync with backend
                        try {
                            await api.patch('/auth/location', { latitude, longitude });
                        } catch (error: any) {
                            if (error.response?.status === 401) {
                                logout();
                            }
                        }
                    }
                );
            } catch (error: any) {
                setErrorMsg(error.message);
            }
        };

        startTracking();

        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [token, user]);

    return (
        <LocationContext.Provider value={{ location, errorMsg }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
