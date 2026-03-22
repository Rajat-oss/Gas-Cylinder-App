import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppMap } from '../../components/AppMap';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { deliveryService } from '../../services/deliveryService';
import { routingService } from '../../services/routingService';
import socketService from '../../services/socket';

export default function DashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { location } = useLocation();
    const [refreshing, setRefreshing] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [activeDestination, setActiveDestination] = useState<{ latitude: number, longitude: number } | null>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const mapRef = React.useRef<any>(null);

    const fetchData = React.useCallback(async () => {
        try {
            if (!user) {
                // Clear data when user is logged out
                setDeliveries([]);
                setActiveDestination(null);
                return;
            }
            const data = await deliveryService.getDeliveries();
            setDeliveries(data);

            const relevantOrder = data.find(d => d.status === 'OUT_FOR_DELIVERY') || data.find(d => d.status === 'PENDING');
            if (relevantOrder) {
                if (relevantOrder.latitude && relevantOrder.longitude) {
                    setActiveDestination({ latitude: relevantOrder.latitude, longitude: relevantOrder.longitude });
                } else {
                    const coords = await routingService.geocodeAddress(relevantOrder.customerAddress);
                    if (coords) setActiveDestination(coords);
                }
            } else {
                setActiveDestination(null);
            }
        } catch (error) {
            // Silently handle errors when user is logged out
            if (!user) {
                console.log('Skipping dashboard error - user logged out');
                return;
            }
            console.error('Dashboard fetch error:', error);
        }
    }, [user]);

    useEffect(() => {
        if (location && activeDestination) {
            routingService.getRoute(location, activeDestination).then(setRouteCoords);
        } else {
            setRouteCoords([]);
        }
    }, [location, activeDestination]);

    useEffect(() => {
        if (!user) {
            // Don't setup socket or fetch data if user is not logged in
            setSocketConnected(false);
            return;
        }

        fetchData();

        const socket = socketService.connect();

        const handleConnect = () => setSocketConnected(true);
        const handleDisconnect = () => setSocketConnected(false);
        const handleNewOrder = (order: any) => {
            if (order.assignedStaffId === user?.id) {
                setDeliveries(prev => [order, ...prev]);
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('newOrder', handleNewOrder);

        if (socket.connected) setSocketConnected(true);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('newOrder', handleNewOrder);
        };
    }, [user?.id, fetchData]);

    const onRefresh = React.useCallback(async () => {
        if (!user) return; // Don't refresh if user is not logged in
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData, user]);

    const stats = {
        assigned: deliveries.length,
        delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
        pending: deliveries.filter(d => d.status === 'PENDING' || d.status === 'OUT_FOR_DELIVERY').length,
        cash: deliveries.reduce((total, d) => total + (d.transactions?.filter((t: any) => t.paymentType === 'CASH').reduce((sum: number, t: any) => sum + t.amount, 0) || 0), 0),
        upi: deliveries.reduce((total, d) => total + (d.transactions?.filter((t: any) => t.paymentType === 'UPI').reduce((sum: number, t: any) => sum + t.amount, 0) || 0), 0),
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person" size={28} color="#FFFFFF" />
                        </View>
                        <View>
                            <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
                            <View style={styles.statusContainer}>
                                <View style={[styles.statusDot, { backgroundColor: socketConnected ? Colors.success : (location ? Colors.info : Colors.danger) }]} />
                                <Text style={styles.statusText}>
                                    {socketConnected ? 'Real-time Linked' : (location ? 'Tracking Active' : 'Offline')}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => router.push('/notifications')}
                    >
                        <Ionicons name="notifications" size={24} color={Colors.primary} />
                        {deliveries.some(d => d.status === 'PENDING') && <View style={styles.badge} />}
                    </TouchableOpacity>
                </View>

                {/* Welcome Banner */}
                <View style={styles.welcomeBanner}>
                    <View style={styles.bannerContent}>
                        <View>
                            <Text style={styles.bannerTitle}>Gas Delivery Partner</Text>
                            <Text style={styles.bannerSubtitle}>Track your deliveries in real-time</Text>
                        </View>
                        <View style={styles.bannerIcon}>
                            <Ionicons name="flame" size={36} color="#FFFFFF" />
                        </View>
                    </View>
                </View>

                {/* Live Fleet Tracking Section */}
                <View style={styles.trackingContainer}>
                    <View style={styles.mapBox}>
                        {location && (
                            <View style={styles.liveBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        )}
                        {location && (
                            <View style={styles.gpsChip}>
                                <Ionicons name="navigate" size={14} color={Colors.success} />
                                <Text style={styles.gpsText}>GPS Active</Text>
                            </View>
                        )}
                        <AppMap
                            mapRef={mapRef}
                            driverLoc={location}
                            destinationLoc={activeDestination}
                            routeCoords={routeCoords}
                        />
                        {!location && (
                            <View style={styles.mapOverlay}>
                                <View style={styles.overlayCard}>
                                    <Ionicons name="location-outline" size={48} color={Colors.primary} />
                                    <Text style={styles.overlayTitle}>Enable GPS</Text>
                                    <Text style={styles.overlayText}>Turn on location for live tracking</Text>
                                </View>
                            </View>
                        )}
                        {location && (
                            <TouchableOpacity
                                style={styles.recenterBtn}
                                onPress={() => {
                                    mapRef.current?.animateToRegion({
                                        ...location,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01
                                    });
                                }}
                            >
                                <Ionicons name="locate" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Today's Overview</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, styles.statCardBlue]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="clipboard" size={20} color="#FFFFFF" />
                            </View>
                            <Text style={styles.statNumber}>{stats.assigned}</Text>
                            <Text style={styles.statLabel}>Assigned</Text>
                        </View>
                        <View style={[styles.statCard, styles.statCardGreen]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            </View>
                            <Text style={styles.statNumber}>{stats.delivered}</Text>
                            <Text style={styles.statLabel}>Delivered</Text>
                        </View>
                        <View style={[styles.statCard, styles.statCardOrange]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="time" size={20} color="#FFFFFF" />
                            </View>
                            <Text style={styles.statNumber}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={[styles.statCard, styles.statCardPurple]}>
                            <View style={styles.statIconContainer}>
                                <Ionicons name="wallet" size={20} color="#FFFFFF" />
                            </View>
                            <Text style={styles.statNumber}>₹{stats.cash + stats.upi}</Text>
                            <Text style={styles.statLabel}>Total Earnings</Text>
                        </View>
                    </View>

                    <View style={styles.paymentSplit}>
                        <View style={[styles.paymentCard, styles.cashCard]}>
                            <View style={styles.paymentIconContainer}>
                                <Ionicons name="cash" size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.paymentContent}>
                                <Text style={styles.paymentLabel}>Cash Collected</Text>
                                <Text style={styles.paymentValue}>₹{stats.cash}</Text>
                            </View>
                        </View>
                        <View style={[styles.paymentCard, styles.upiCard]}>
                            <View style={styles.paymentIconContainer}>
                                <Ionicons name="card" size={24} color="#FFFFFF" />
                            </View>
                            <View style={styles.paymentContent}>
                                <Text style={styles.paymentLabel}>UPI Collected</Text>
                                <Text style={styles.paymentValue}>₹{stats.upi}</Text>
                            </View>
                        </View>
                    </View>

                    <CustomButton
                        title="View Today's Deliveries"
                        onPress={() => router.push('/deliveries')}
                        style={styles.mainActionBtn}
                        variant="primary"
                        size="lg"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '600',
    },
    notificationBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.danger,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    welcomeBanner: {
        backgroundColor: Colors.primary,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    bannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    bannerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingContainer: {
        marginBottom: 24,
    },
    mapBox: {
        height: 240,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
    liveBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: Colors.danger,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    gpsChip: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gpsText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.success,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayCard: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 32,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    overlayTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 12,
    },
    overlayText: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 4,
    },
    recenterBtn: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: Colors.primary,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    summaryContainer: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 18,
        letterSpacing: -0.8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    statCardBlue: {
        backgroundColor: Colors.primary,
    },
    statCardGreen: {
        backgroundColor: Colors.success,
    },
    statCardOrange: {
        backgroundColor: Colors.warning,
    },
    statCardPurple: {
        backgroundColor: Colors.accent,
    },
    statIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.8,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    paymentSplit: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 20,
    },
    paymentCard: {
        flex: 1,
        padding: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    cashCard: {
        backgroundColor: Colors.success,
    },
    upiCard: {
        backgroundColor: Colors.success,
    },
    paymentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentContent: {
        flex: 1,
    },
    paymentLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 2,
        fontWeight: '600',
    },
    paymentValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    mainActionBtn: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 4,
    },
});
