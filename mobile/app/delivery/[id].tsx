import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppMap } from '../../components/AppMap';
import { CustomButton } from '../../components/CustomButton';
import { PaymentSelector } from '../../components/PaymentSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/Colors';
import { useLocation } from '../../context/LocationContext';
import { Delivery, deliveryService } from '../../services/deliveryService';
import { routingService } from '../../services/routingService';


const DeliveryDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { location: driverLoc } = useLocation();
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | null>(null);
    const [amount, setAmount] = useState('');
    const [txnId, setTxnId] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const [destinationLoc, setDestinationLoc] = useState<{ latitude: number, longitude: number } | null>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const mapRef = useRef<any>(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        const initializeSession = async () => {
            try {
                const deliveryId = typeof id === 'string' ? id : id?.[0];
                if (!deliveryId) return;

                const taskPromise = deliveryService.getDeliveries().then(list => list.find(d => d.id === deliveryId));
                const item = await taskPromise;
                if (item) {
                    setDelivery(item);
                    setAmount(item.amount ? item.amount.toString() : (item.quantity ? (item.quantity * 800).toString() : '800'));

                    const parsedLat = Number(item.latitude);
                    const parsedLng = Number(item.longitude);

                    if (parsedLat && parsedLng && !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
                        setDestinationLoc({ latitude: parsedLat, longitude: parsedLng });
                    } else {
                        routingService.geocodeAddress(item.customerAddress).then(dest => {
                            if (dest) setDestinationLoc(dest);
                        });
                    }
                }
            } catch (err) {
                console.error('Session Init Error:', err);
            }
        };
        initializeSession();
    }, [id]);

    useEffect(() => {
        if (isNavigating && driverLoc && destinationLoc) {
            const updateRoute = async () => {
                try {
                    const coords = await routingService.getRoute(driverLoc, destinationLoc);
                    setRouteCoords(coords);
                } catch (e) {
                    console.error('Route update error:', e);
                }
            };
            updateRoute();
        }
    }, [isNavigating, driverLoc, destinationLoc]);

    useEffect(() => {
        if (mapReady && mapRef.current && (driverLoc || destinationLoc)) {
            const points = [];
            if (isNavigating && driverLoc) points.push(driverLoc);
            if (destinationLoc) points.push(destinationLoc);
            if (points.length > 0 && Platform.OS !== 'web') {
                mapRef.current.fitToCoordinates(points, {
                    edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
                    animated: true
                });
            }
        }
    }, [isNavigating, driverLoc, destinationLoc, mapReady]);

    const handleStartNavigation = async () => {
        if (!delivery) return;
        try {
            if (delivery.status === 'PENDING') {
                const updated = await deliveryService.updateDeliveryStatus(delivery.id, 'OUT_FOR_DELIVERY');
                setDelivery(updated);
            }
            setIsNavigating(true);
            if (destinationLoc) {
                const lat = destinationLoc.latitude;
                const lng = destinationLoc.longitude;
                const url = Platform.select({
                    ios: `maps:0,0?q=Delivery@${lat},${lng}`,
                    android: `geo:0,0?q=${lat},${lng}(Delivery)`,
                    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                });
                Alert.alert(
                    'Tracking Started',
                    'Real-time route is now visible in-app. Open turn-by-turn navigation?',
                    [
                        { text: 'Stay in App', style: 'cancel' },
                        { text: 'Open Maps', onPress: () => url && Linking.openURL(url) }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to start navigation. Please try again.');
        }
    };

    const handleConfirmPayment = async () => {
        if (!paymentMode) { Alert.alert('Error', 'Please select a payment mode'); return; }
        if (!amount || isNaN(Number(amount))) { Alert.alert('Error', 'Please enter a valid amount'); return; }
        if (paymentMode === 'UPI' && !txnId) { Alert.alert('Error', 'Please enter UPI Transaction ID'); return; }

        setConfirming(true);
        try {
            await deliveryService.updateDeliveryStatus(delivery!.id, 'DELIVERED', {
                paymentMode,
                amount: Number(amount),
                txnId: paymentMode === 'UPI' ? txnId : undefined
            });
            setDelivery(prev => prev ? { ...prev, status: 'DELIVERED' } : null);
            Alert.alert('Success', 'Delivery completed successfully!');
            router.back();
        } catch {
            Alert.alert('Error', 'Failed to complete delivery');
        } finally {
            setConfirming(false);
        }
    };

    const isPaid = delivery?.status === 'DELIVERED';

    const statusColor: Record<string, string> = {
        'PENDING': '#2563EB',
        'OUT_FOR_DELIVERY': '#F59E0B',
        'DELIVERED': '#10B981',
        'CANCELLED': '#EF4444',
    };
    const accentColor = statusColor[delivery?.status ?? ''] || Colors.primary;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

                {/* ── HERO HEADER ── */}
                <View style={[styles.heroHeader, { paddingTop: insets.top + 12 }]}>
                    {/* Back + Title row */}
                    <View style={styles.heroTopRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.heroEyebrow}>DISPATCH TRACKING</Text>
                            <Text style={styles.heroTitle} numberOfLines={1}>
                                {delivery?.customerName || 'Delivery Task'}
                            </Text>
                        </View>
                        {delivery && (
                            <StatusBadge status={delivery.status === 'PENDING' ? 'Assigned' : delivery.status} />
                        )}
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                {/* ── MAP CARD — renders immediately, no data wait ── */}
                <View style={styles.mapCard}>
                    <View style={styles.mapHeader}>
                        <View style={styles.liveIndicator}>
                            <View style={[styles.dot, { backgroundColor: isNavigating ? '#10B981' : '#F59E0B' }]} />
                            <Text style={styles.liveText}>{isNavigating ? 'LIVE ROUTING' : 'FLEET TRACKER'}</Text>
                        </View>
                        <Text style={styles.distanceText}>
                            {isNavigating ? `${routeCoords.length} route points` : 'GPS Active'}
                        </Text>
                    </View>
                    <View style={styles.mapPlaceholder}>
                        <AppMap
                            mapRef={mapRef}
                            driverLoc={driverLoc}
                            destinationLoc={destinationLoc}
                            routeCoords={isNavigating ? routeCoords : []}
                            onMapReady={() => setMapReady(true)}
                        />
                        <TouchableOpacity
                            style={styles.recenterBtn}
                            onPress={() => {
                                if (driverLoc && mapRef.current && Platform.OS !== 'web') {
                                    mapRef.current.animateToRegion({ ...driverLoc, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                                } else if (destinationLoc && mapRef.current && Platform.OS !== 'web') {
                                    mapRef.current.animateToRegion({ ...destinationLoc, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                                }
                            }}
                        >
                            <Ionicons name="locate" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {delivery && (delivery.status === 'PENDING' || delivery.status === 'OUT_FOR_DELIVERY') && (
                        <TouchableOpacity
                            style={[styles.navBtn, { backgroundColor: isNavigating ? '#059669' : '#003087' }]}
                            onPress={handleStartNavigation}
                            activeOpacity={0.88}
                        >
                            <Ionicons
                                name={isNavigating ? 'navigate' : 'navigate-outline'}
                                size={18}
                                color="#FFFFFF"
                            />
                            <Text style={styles.navBtnText}>
                                {delivery.status === 'PENDING' ? 'Start GPS Navigation' : 'Reroute Navigation'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {destinationLoc && (
                        <TouchableOpacity
                            style={styles.letsGoBtn}
                            onPress={() => {
                                const { latitude: lat, longitude: lng } = destinationLoc;
                                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
                            }}
                            activeOpacity={0.88}
                        >
                            <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                            <Text style={styles.navBtnText}>Let's Go 🚀</Text>
                        </TouchableOpacity>
                    )}
                </View>

                    {/* Delivery details — loads after API */}
                    {delivery && (
                    <>

                    {/* ── CUSTOMER DETAILS ── */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-circle-outline" size={16} color={Colors.textLight} />
                        <Text style={styles.sectionLabel}>CUSTOMER DETAILS</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.customerRow}>
                            <View style={[styles.custAvatar, { backgroundColor: accentColor + '20' }]}>
                                <Ionicons name="person" size={24} color={accentColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.custName}>{delivery.customerName}</Text>
                                <Text style={styles.custPhone}>+91 {delivery.customerPhone}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.callBtn, { backgroundColor: '#D1FAE5' }]}
                                onPress={() => Linking.openURL(`tel:${delivery.customerPhone}`)}
                            >
                                <Ionicons name="call" size={18} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.addressRow}>
                            <Ionicons name="location-outline" size={15} color={Colors.textLight} />
                            <Text style={styles.addressText}>{delivery.customerAddress}</Text>
                        </View>
                    </View>

                    {/* ── SCHEDULED DATE ── */}
                    {(delivery.scheduledDeliveryDate || delivery.createdAt) && (
                        <>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="calendar-outline" size={16} color={Colors.textLight} />
                                <Text style={styles.sectionLabel}>SCHEDULED DELIVERY</Text>
                            </View>
                            <View style={styles.card}>
                                <View style={styles.scheduleRow}>
                                    <View style={[styles.scheduleIconBox, { backgroundColor: '#EDE9FE' }]}>
                                        <Ionicons name="calendar" size={22} color="#7C3AED" />
                                    </View>
                                    <View>
                                        <Text style={styles.schedDate}>
                                            {new Date(delivery.scheduledDeliveryDate || delivery.createdAt).toLocaleDateString('en-IN', {
                                                weekday: 'long', day: 'numeric', month: 'long'
                                            })}
                                        </Text>
                                        <Text style={styles.schedTime}>
                                            {new Date(delivery.scheduledDeliveryDate || delivery.createdAt).toLocaleTimeString('en-IN', {
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}

                    {/* ── PAYMENT COLLECTION ── */}
                    <View style={styles.sectionHeader}>
                        <Ionicons name="wallet-outline" size={16} color={Colors.textLight} />
                        <Text style={styles.sectionLabel}>COLLECTION & PAYMENT</Text>
                    </View>
                    <View style={styles.card}>
                        <PaymentSelector
                            selectedMode={paymentMode}
                            onSelect={!isPaid ? setPaymentMode : () => { }}
                        />

                        <View style={styles.amountBox}>
                            <Text style={styles.inputLabel}>Amount to Collect (₹)</Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.currency}>₹</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                    editable={!isPaid}
                                    placeholder="0"
                                    placeholderTextColor="#CBD5E1"
                                />
                            </View>
                        </View>

                        {paymentMode === 'UPI' && (
                            <View style={styles.upiSection}>
                                <View style={styles.qrBox}>
                                    <Ionicons name="qr-code" size={90} color={Colors.text} />
                                    <Text style={styles.qrLabel}>SCAN FOR MERCHANT UPI</Text>
                                </View>
                                <Text style={styles.inputLabel}>UPI Reference Number</Text>
                                <TextInput
                                    style={styles.borderedInput}
                                    placeholder="Enter Ref No."
                                    placeholderTextColor="#94A3B8"
                                    value={txnId}
                                    onChangeText={setTxnId}
                                    editable={!isPaid}
                                />
                            </View>
                        )}

                        {!isPaid && (
                            <CustomButton
                                title="Mark as Delivered"
                                onPress={handleConfirmPayment}
                                loading={confirming}
                                style={styles.confirmBtn}
                                variant="success"
                                size="lg"
                            />
                        )}

                        {isPaid && (
                            <View style={styles.paidSuccess}>
                                <View style={styles.paidIconWrap}>
                                    <Ionicons name="checkmark-done-circle" size={48} color="#10B981" />
                                </View>
                                <Text style={styles.paidTitle}>DELIVERY COMPLETED</Text>
                                <Text style={styles.paidSub}>Payment collected successfully</Text>
                            </View>
                        )}
                    </View>
                    </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default DeliveryDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        gap: 12,
    },
    inlineLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        gap: 14,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '600',
    },

    // Hero
    heroHeader: {
        backgroundColor: '#003087',
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroEyebrow: {
        fontSize: 9,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    heroChips: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    heroChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    heroChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    navDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },

    // Scroll content
    content: {
        padding: 20,
        paddingTop: 20,
        paddingBottom: 120,
    },

    // Map Card
    mapCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 14,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    mapHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#166534',
        letterSpacing: 0.5,
    },
    distanceText: {
        fontSize: 11,
        color: Colors.textLight,
        fontStyle: 'italic',
    },
    mapPlaceholder: {
        height: 240,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
    },
    recenterBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10,
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        borderRadius: 16,
        paddingVertical: 14,
    },
    navBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    letsGoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
        borderRadius: 16,
        paddingVertical: 14,
        backgroundColor: '#16A34A',
    },

    // Section labels
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        marginTop: 4,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.textLight,
        letterSpacing: 1.5,
    },

    // Cards
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },

    // Customer
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    custAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    custName: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 2,
    },
    custPhone: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },
    callBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textLight,
        lineHeight: 19,
    },

    // Schedule
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    scheduleIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    schedDate: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 3,
    },
    schedTime: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },

    // Payment
    amountBox: { marginTop: 20 },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    currency: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginRight: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    upiSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    qrBox: { alignItems: 'center', marginBottom: 20 },
    qrLabel: {
        marginTop: 10,
        fontSize: 11,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 1,
    },
    borderedInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 2,
    },
    confirmBtn: { marginTop: 24 },
    paidSuccess: { alignItems: 'center', paddingVertical: 16 },
    paidIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    paidTitle: {
        fontSize: 15,
        fontWeight: '900',
        color: '#059669',
        letterSpacing: 2,
        marginBottom: 4,
    },
    paidSub: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },
});
