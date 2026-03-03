import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface AppMapProps {
    mapRef: any;
    driverLoc: { latitude: number, longitude: number } | null;
    destinationLoc: { latitude: number, longitude: number } | null;
    routeCoords: any[];
}

declare global { interface Window { L: any; } }

export const AppMap = ({ driverLoc, destinationLoc, routeCoords }: AppMapProps) => {
    const mapDivRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<{ [key: string]: any }>({});
    const polylineRef = useRef<any>(null);
    const [libLoaded, setLibLoaded] = useState(false);

    // Optimized Asset Loading
    useEffect(() => {
        if (window.L) { setLibLoaded(true); return; }

        const lLink = document.createElement('link');
        lLink.rel = 'stylesheet';
        lLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(lLink);

        const lScript = document.createElement('script');
        lScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        lScript.async = true;
        lScript.onload = () => setLibLoaded(true);
        document.head.appendChild(lScript);

        return () => {
            // Leaflet doesn't always clean up easily if scripts are shared, 
            // but we can remove the instance on unmount below.
        };
    }, []);

    // Memoize Icons to prevent recreate on every render
    const icons = useMemo(() => {
        if (!window.L) return null;
        const L = window.L;
        return {
            truck: L.divIcon({
                html: `<div style="background-color: ${Colors.primary}; padding: 6px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); transform: rotate(0deg);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M10 17h4V5H2v12h3m10 0h2l3.6-7H14v7Z"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                       </div>`,
                className: '', iconSize: [36, 36], iconAnchor: [18, 18]
            }),
            dest: L.divIcon({
                html: `<div style="background-color: #f43f5e; padding: 6px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                       </div>`,
                className: '', iconSize: [36, 36], iconAnchor: [18, 18]
            })
        };
    }, [libLoaded]);

    useEffect(() => {
        if (!libLoaded || !mapDivRef.current || !window.L || !icons) return;

        const L = window.L;

        // Initialize Map
        if (!mapInstance.current) {
            mapInstance.current = L.map(mapDivRef.current, { center: [20.5937, 78.9629], zoom: 5, attributionControl: false, zoomControl: false });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
        }

        const map = mapInstance.current;

        // Auto-Adjust Viewport (Improved)
        const updateView = () => {
            const bounds = [];
            if (driverLoc) bounds.push([driverLoc.latitude, driverLoc.longitude]);
            if (destinationLoc) bounds.push([destinationLoc.latitude, destinationLoc.longitude]);

            if (bounds.length > 1) {
                map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], animate: true });
            } else if (bounds.length === 1) {
                map.setView(bounds[0], 15, { animate: true });
            }
        };

        // Sync Driver
        if (driverLoc) {
            if (!markersRef.current.driver) {
                markersRef.current.driver = L.marker([driverLoc.latitude, driverLoc.longitude], { icon: icons.truck }).addTo(map);
                // Initial center if first time
                if (!markersRef.current.dest) map.setView([driverLoc.latitude, driverLoc.longitude], 15);
            } else {
                markersRef.current.driver.setLatLng([driverLoc.latitude, driverLoc.longitude]);
            }
        }

        // Sync Client
        if (destinationLoc) {
            if (!markersRef.current.dest) {
                markersRef.current.dest = L.marker([destinationLoc.latitude, destinationLoc.longitude], { icon: icons.dest }).addTo(map);
                updateView();
            } else {
                markersRef.current.dest.setLatLng([destinationLoc.latitude, destinationLoc.longitude]);
            }
        }

        // Sync Path
        if (routeCoords?.length > 0) {
            const points = routeCoords.map(c => [c.latitude, c.longitude]);
            if (!polylineRef.current) {
                polylineRef.current = L.polyline(points, { color: Colors.primary, weight: 6, opacity: 0.7 }).addTo(map);
            } else {
                polylineRef.current.setLatLngs(points);
            }
        }

        return () => {
            if (mapInstance.current && !libLoaded) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [libLoaded, driverLoc, destinationLoc, routeCoords, icons]);

    return (
        <View style={{ flex: 1 }}>
            <div ref={mapDivRef} style={{ width: '100%', height: '100%', borderRadius: '20px', zIndex: 1 }} />
            {!libLoaded && (
                <View style={styles.overlay}>
                    <ActivityIndicator color={Colors.primary} />
                    <Text style={styles.mapLoadingText}>Booting Dispatch Tracker...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', borderRadius: 20, zIndex: 10 },
    mapLoadingText: { fontSize: 11, color: '#64748b', marginTop: 10, fontWeight: '700' }
});
