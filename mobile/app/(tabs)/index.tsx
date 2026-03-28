import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    AppState,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppMap } from '../../components/AppMap';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { deliveryService } from '../../services/deliveryService';
import { updateOnlineStatus } from '../../services/api';
import { showOnlineNotification, dismissOnlineNotification } from '../../services/notificationService';
import { routingService } from '../../services/routingService';
import socketService from '../../services/socket';

export default function DashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { location } = useLocation();
    const [refreshing, setRefreshing] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [isOnline, setIsOnline] = useState(true);
    const isOnlineRef = useRef(true);
    const heartbeatRef = useRef<any>(null);
    const toastAnim = useRef(new Animated.Value(0)).current;
    const [toastMsg, setToastMsg] = useState<{ text: string; online: boolean } | null>(null);
    const toastTimer = useRef<any>(null);

    const showToast = (online: boolean) => {
        setToastMsg({ text: online ? "You're Online Now 🟢" : "You're Offline Now 🔴", online });
        clearTimeout(toastTimer.current);
        Animated.sequence([
            Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
            Animated.delay(2500),
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setToastMsg(null));
    };
    const [activeDestination, setActiveDestination] = useState<{ latitude: number, longitude: number } | null>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const mapRef = React.useRef<any>(null);
    const insets = useSafeAreaInsets();

    const fetchData = React.useCallback(async () => {
        try {
            if (!user) {
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

    // Online status — backend sync + heartbeat + AppState
    const handleToggleOnline = async (value: boolean) => {
        isOnlineRef.current = value;
        setIsOnline(value);
        showToast(value);
        if (value) {
            showOnlineNotification(user?.name || 'Driver');
        } else {
            dismissOnlineNotification();
        }
        try {
            await updateOnlineStatus(value);
        } catch (e) { /* silent */ }

        if (value) {
            // Start heartbeat every 60s to keep lastSeen fresh
            heartbeatRef.current = setInterval(() => {
                if (isOnlineRef.current && user?.id) {
                    socketService.emit('heartbeat', { driverId: user.id });
                    updateOnlineStatus(true).catch(() => {});
                }
            }, 60000);
        } else {
            clearInterval(heartbeatRef.current);
        }
    };

    useEffect(() => {
        if (!user) return;
        // Go online when dashboard mounts
        handleToggleOnline(true);

        // AppState — app background/foreground pe online state maintain karo
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active' && isOnlineRef.current) {
                // App foreground aaya, agar online tha to lastSeen refresh karo
                updateOnlineStatus(true).catch(() => {});
            }
            // background/inactive pe offline mat karo — sirf toggle se hoga
        });

        return () => {
            sub.remove();
            clearInterval(heartbeatRef.current);
        };
    }, [user?.id]);

    const onRefresh = React.useCallback(async () => {
        if (!user) return;
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

    const totalEarnings = stats.cash + stats.upi;

    return (
        <View style={{ flex: 1 }}>
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Dark Hero Header */}
                <View style={[styles.heroSection, { paddingTop: insets.top + 16 }]}>
                    {/* Top Row */}
                    <View style={styles.topRow}>
                        {/* Left: Avatar only */}
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person" size={22} color="#FFFFFF" />
                        </View>

                        <View style={styles.greetingBlock}>
                            <Text style={styles.greeting}>Hello, {user?.name || 'Driver'} 👋</Text>
                        </View>

                        {/* Right: Online Toggle */}
                        <View style={styles.onlineToggleWrap}>
                            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#007A3D' : '#CC0000' }]} />
                            <Text style={styles.onlineLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
                            <Switch
                                value={isOnline}
                                onValueChange={handleToggleOnline}
                                trackColor={{ false: '#CC0000', true: '#007A3D' }}
                                thumbColor={'#FFFFFF'}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        </View>
                    </View>

                    {/* Status Chips */}
                    <View style={styles.chipRow}>
                        <View style={[styles.statusChip, { borderColor: socketConnected ? '#10B981' : (location ? '#10B981' : '#EF4444') }]}>
                            <View style={[styles.chipDot, { backgroundColor: socketConnected ? '#10B981' : (location ? '#10B981' : '#EF4444') }]} />
                            <Text style={styles.chipText}>
                                {socketConnected ? 'Real-time Linked' : (location ? 'Tracking Active' : 'Offline')}
                            </Text>
                        </View>
                        <View style={styles.dateChip}>
                            <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                            <Text style={styles.dateText}>
                                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                    </View>

                    {/* Earnings Card */}
                    <View style={styles.earningsCard}>
                        <View style={styles.earningsLeft}>
                            <Text style={styles.earningsLabel}>TODAY'S EARNINGS</Text>
                            <Text style={styles.earningsValue}>₹{totalEarnings.toLocaleString('en-IN')}</Text>
                            <Text style={styles.earningsSubtext}>
                                {stats.delivered} of {stats.assigned} deliveries done
                            </Text>
                        </View>
                        <View style={styles.earningsRight}>
                            <View style={styles.paymentChip}>
                                <Text style={styles.paymentChipLabel}>Cash</Text>
                                <Text style={styles.paymentChipValue}>₹{stats.cash.toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={[styles.paymentChip, styles.upiChipBg]}>
                                <Text style={styles.paymentChipLabel}>UPI</Text>
                                <Text style={styles.paymentChipValue}>₹{stats.upi.toLocaleString('en-IN')}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Map Section */}
                <View style={styles.mapSection}>
                    <View style={styles.mapBox}>
                        {location && (
                            <View style={styles.liveBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        )}
                        {location && (
                            <View style={styles.gpsChip}>
                                <Ionicons name="navigate" size={12} color={Colors.success} />
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
                                    <Ionicons name="location-outline" size={44} color={Colors.primary} />
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
                                <Ionicons name="locate" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Today's Overview */}
                <View style={styles.overviewSection}>
                    {/* Section Header */}
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionAccentBar} />
                        <Text style={styles.sectionTitle}>Today's Overview</Text>
                    </View>

                    {/* Stats Grid - 2x2 white cards */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBox, { backgroundColor: '#EBF0F9' }]}>
                                <Ionicons name="clipboard" size={20} color="#003087" />
                            </View>
                            <Text style={styles.statNumber}>{stats.assigned}</Text>
                            <Text style={styles.statLabel}>Assigned</Text>
                            <View style={[styles.statBottomBar, { backgroundColor: '#003087' }]} />
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBox, { backgroundColor: '#E6F4EC' }]}>
                                <Ionicons name="checkmark-circle" size={20} color="#007A3D" />
                            </View>
                            <Text style={styles.statNumber}>{stats.delivered}</Text>
                            <Text style={styles.statLabel}>Delivered</Text>
                            <View style={[styles.statBottomBar, { backgroundColor: '#007A3D' }]} />
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBox, { backgroundColor: '#FDEAEA' }]}>
                                <Ionicons name="time" size={20} color="#CC0000" />
                            </View>
                            <Text style={styles.statNumber}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                            <View style={[styles.statBottomBar, { backgroundColor: '#CC0000' }]} />
                        </View>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconBox, { backgroundColor: '#FEF3E2' }]}>
                                <Ionicons name="wallet" size={20} color="#F5A623" />
                            </View>
                            <Text style={styles.statNumber}>₹{totalEarnings}</Text>
                            <Text style={styles.statLabel}>Earned</Text>
                            <View style={[styles.statBottomBar, { backgroundColor: '#F5A623' }]} />
                        </View>
                    </View>

                    {/* Payment Split */}
                    <View style={styles.paymentSplit}>
                        <View style={styles.paymentCard}>
                            <View style={[styles.paymentIconWrap, { backgroundColor: '#E6F4EC' }]}>
                                <Ionicons name="cash" size={22} color="#007A3D" />
                            </View>
                            <View style={styles.paymentCardText}>
                                <Text style={styles.paymentCardTitle} numberOfLines={1}>Cash</Text>
                                <Text style={styles.paymentCardSub} numberOfLines={1}>Collected</Text>
                                <Text style={[styles.paymentCardValue, { color: '#007A3D' }]}>₹{stats.cash}</Text>
                            </View>
                        </View>
                        <View style={styles.paymentCard}>
                            <View style={[styles.paymentIconWrap, { backgroundColor: '#FDEAEA' }]}>
                                <Ionicons name="card" size={22} color="#CC0000" />
                            </View>
                            <View style={styles.paymentCardText}>
                                <Text style={styles.paymentCardTitle} numberOfLines={1}>UPI</Text>
                                <Text style={styles.paymentCardSub} numberOfLines={1}>Collected</Text>
                                <Text style={[styles.paymentCardValue, { color: '#CC0000' }]}>₹{stats.upi}</Text>
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

            {/* Toast — outside SafeAreaView so it floats on top */}
            {toastMsg && (
                <Animated.View style={[
                    styles.toast,
                    { backgroundColor: toastMsg.online ? '#007A3D' : '#CC0000' },
                    {
                        opacity: toastAnim,
                        transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }]
                    }
                ]}>
                    <Ionicons name={toastMsg.online ? 'wifi' : 'wifi-outline'} size={20} color="#fff" />
                    <Text style={styles.toastText}>{toastMsg.text}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    scrollContent: {
        paddingBottom: 100,
        backgroundColor: '#F1F5F9',
    },

    // Hero Section
    heroSection: {
        backgroundColor: '#003087',
        paddingHorizontal: 20,
        paddingBottom: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 0,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    topLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    onlineToggleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 24,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },
    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    onlineLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F97316',
        justifyContent: 'center',
        alignItems: 'center',
    },
    greetingBlock: {
        flex: 1,
    },
    appLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 2,
        marginBottom: 2,
    },
    greeting: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#172554',
    },

    // Status chips
    chipRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    chipDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#E2E8F0',
    },
    dateChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },

    // Earnings Card
    earningsCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    earningsLeft: {
        flex: 1,
    },
    earningsLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    earningsValue: {
        fontSize: 36,
        fontWeight: '800',
        color: '#F59E0B',
        letterSpacing: -1,
        marginBottom: 4,
    },
    earningsSubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    earningsRight: {
        gap: 8,
    },
    paymentChip: {
        backgroundColor: '#374151',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    upiChipBg: {
        backgroundColor: '#1E3A5F',
    },
    paymentChipLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 2,
    },
    paymentChipValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    // Map Section
    mapSection: {
        paddingHorizontal: 20,
        marginTop: 0,
    },
    mapBox: {
        height: 220,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        marginTop: 20,
        marginBottom: 24,
    },
    liveBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        backgroundColor: '#EF4444',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        zIndex: 10,
    },
    pulseDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#FFFFFF',
    },
    liveText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    gpsChip: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
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
        fontSize: 10,
        fontWeight: '700',
        color: Colors.success,
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayCard: {
        alignItems: 'center',
        padding: 28,
        borderRadius: 20,
    },
    overlayTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 10,
    },
    overlayText: {
        fontSize: 13,
        color: Colors.textLight,
        marginTop: 4,
    },
    recenterBtn: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    // Overview Section
    overviewSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionAccentBar: {
        width: 4,
        height: 22,
        borderRadius: 2,
        backgroundColor: '#CC0000',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.3,
    },

    // Stat Cards — white with colored icon box + bottom accent bar
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    statBottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },

    // Payment Split — white cards
    paymentSplit: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    paymentCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 14,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
    paymentIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentCardText: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    paymentCardLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    paymentCardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.2,
        lineHeight: 20,
    },
    paymentCardSub: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        lineHeight: 14,
        marginBottom: 4,
    },
    paymentCardValue: {
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 20,
    },
    paymentCardBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },

    mainActionBtn: {
        backgroundColor: '#CC0000',
        shadowColor: '#CC0000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    toast: {
        position: 'absolute',
        top: 55,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 18,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 20,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
});
