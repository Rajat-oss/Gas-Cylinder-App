import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors } from '../constants/Colors';

interface AppMapProps {
    mapRef: any;
    driverLoc: { latitude: number, longitude: number } | null;
    destinationLoc: { latitude: number, longitude: number } | null;
    routeCoords: any[];
    onMapReady?: () => void;
}

/**
 * Native Optimized Map
 * Picks up naturally when platform is NOT web.
 */
export const AppMap: React.FC<AppMapProps> = ({ mapRef, driverLoc, destinationLoc, routeCoords, onMapReady }) => {
    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            onMapReady={onMapReady}
            initialRegion={{
                latitude: driverLoc?.latitude || destinationLoc?.latitude || 20.5937,
                longitude: driverLoc?.longitude || destinationLoc?.longitude || 78.9629,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
        >
            {driverLoc && (
                <Marker key="driver-marker" coordinate={driverLoc} title="Your Location">
                    <View style={styles.driverMarker}>
                        <Ionicons name="car-sport" size={24} color="white" />
                    </View>
                </Marker>
            )}
            {destinationLoc && (
                <Marker key="dest-marker" coordinate={destinationLoc} title="Delivery Destination">
                    <View style={styles.destMarker}>
                        <Ionicons name="location" size={24} color="white" />
                    </View>
                </Marker>
            )}
            {routeCoords.length > 0 && (
                <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={Colors.primary} />
            )}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: { ...StyleSheet.absoluteFillObject },
    driverMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white', elevation: 5 },
    destMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f43f5e', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white', elevation: 5 },
});
