import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { AppMap } from '../../components/AppMap';
import { CustomButton } from '../../components/CustomButton';
import { PaymentSelector } from '../../components/PaymentSelector';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/Colors';
import { Delivery, deliveryService } from '../../services/deliveryService';
import { routingService } from '../../services/routingService';


const DeliveryDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | null>(null);
    const [amount, setAmount] = useState('');
    const [txnId, setTxnId] = useState('');
    const [confirming, setConfirming] = useState(false);

    // Mapping states - non-blocking for initial page open
    const [driverLoc, setDriverLoc] = useState<{ latitude: number, longitude: number } | null>(null);
    const [destinationLoc, setDestinationLoc] = useState<{ latitude: number, longitude: number } | null>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const mapRef = useRef<any>(null);

    useEffect(() => {
        const initializeSession = async () => {
            try {
                const deliveryId = typeof id === 'string' ? id : id?.[0];
                if (!deliveryId) return;

                // 1. Parallel Task Initiation (Optimized)
                const taskPromise = deliveryService.getDeliveries().then(list => list.find(d => d.id === deliveryId));
                const permissionsPromise = Location.requestForegroundPermissionsAsync();

                // 2. Resolve Main Content ASAP
                const item = await taskPromise;
                if (item) {
                    setDelivery(item);
                    setAmount('1150');
                    setLoading(false); // Reveal details immediately while background tasks run

                    // 3. Initiate Map & Routing (Non-blocking)
                    routingService.geocodeAddress(item.customerAddress).then(dest => {
                        if (dest) setDestinationLoc(dest);
                    });

                    permissionsPromise.then(async ({ status }) => {
                        if (status === 'granted') {
                            const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
                            setDriverLoc({ latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude });

                            Location.watchPositionAsync(
                                { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
                                (newLoc) => {
                                    setDriverLoc({
                                        latitude: newLoc.coords.latitude,
                                        longitude: newLoc.coords.longitude
                                    });
                                }
                            );
                        }
                    });
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Session Init Error:', err);
                setLoading(false);
            }
        };

        initializeSession();
    }, [id]);

    useEffect(() => {
        if (driverLoc && destinationLoc) {
            const updateRoute = async () => {
                try {
                    const coords = await routingService.getRoute(driverLoc, destinationLoc);
                    setRouteCoords(coords);

                    if (Platform.OS !== 'web' && mapRef.current?.fitToCoordinates) {
                        mapRef.current.fitToCoordinates([driverLoc, destinationLoc], {
                            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                            animated: true
                        });
                    }
                } catch (e) {
                    console.error('Route update error:', e);
                }
            };
            updateRoute();
        }
    }, [driverLoc, destinationLoc]);

    const handleConfirmPayment = async () => {
        if (!paymentMode) { Alert.alert('Error', 'Please select a payment mode'); return; }
        if (!amount || isNaN(Number(amount))) { Alert.alert('Error', 'Please enter a valid amount'); return; }
        if (paymentMode === 'UPI' && !txnId) { Alert.alert('Error', 'Please enter UPI Transaction ID'); return; }

        setConfirming(true);
        try {
            await deliveryService.updateDeliveryStatus(delivery!.id, 'DELIVERED');
            setDelivery(prev => prev ? { ...prev, status: 'DELIVERED' } : null);
            Alert.alert('Success', 'Delivery completed successfully!');
            router.back();
        } catch {
            Alert.alert('Error', 'Failed to complete delivery');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Fetching Delivery Data...</Text>
            </View>
        );
    }

    if (!delivery) {
        return (
            <View style={styles.loaderContainer}>
                <Text>Task not found</Text>
                <CustomButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
            </View>
        );
    }

    const isPaid = delivery.status === 'DELIVERED';

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'Dispatch Tracking', headerShown: true }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Real-time Map (Loads Dynamically) */}
                    <View style={styles.mapCard}>
                        <View style={styles.mapHeader}>
                            <View style={styles.liveIndicator}>
                                <View style={styles.dot} />
                                <Text style={styles.liveText}>FLEET TRACKER</Text>
                            </View>
                            <Text style={styles.distanceText}>Syncing nearest path...</Text>
                        </View>
                        <View style={styles.mapPlaceholder}>
                            <AppMap
                                mapRef={mapRef}
                                driverLoc={driverLoc}
                                destinationLoc={destinationLoc}
                                routeCoords={routeCoords}
                            />
                            {/* Locate Me Button Overlay */}
                            <View style={styles.mapControls}>
                                <View style={styles.controlBtn} onTouchEnd={() => {
                                    if (driverLoc) {
                                        if (Platform.OS === 'web') {
                                            // Handle web center via prop update or direct ref if possible
                                            // For now, setting view manually if we had ref access, 
                                            // but updating state driverLoc triggers our useEffect in AppMap.web
                                            setDriverLoc({ ...driverLoc });
                                        } else {
                                            mapRef.current?.animateToRegion({
                                                ...driverLoc,
                                                latitudeDelta: 0.01,
                                                longitudeDelta: 0.01
                                            });
                                        }
                                    }
                                }}>
                                    <Ionicons name="locate" size={24} color={Colors.primary} />
                                </View>
                            </View>
                        </View>
                        <CustomButton
                            title="Start GPS Navigation"
                            variant="primary"
                            size="md"
                            onPress={() => {
                                if (destinationLoc) {
                                    const lat = destinationLoc.latitude;
                                    const lng = destinationLoc.longitude;
                                    const url = Platform.select({
                                        ios: `maps:0,0?q=Delivery@${lat},${lng}`,
                                        android: `geo:0,0?q=${lat},${lng}(Delivery)`,
                                        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                                    });
                                    if (url) Linking.openURL(url);
                                }
                            }}
                            style={{ marginTop: 12, borderRadius: 16 }}
                            textStyle={{ fontSize: 13, fontWeight: '800' }}
                        />
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Customer Details</Text>
                            <StatusBadge status={delivery.status === 'PENDING' ? 'Assigned' : delivery.status} />
                        </View>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="person-circle" size={40} color={Colors.primary} />
                                <View style={styles.textGroup}>
                                    <Text style={styles.primaryText}>{delivery.customerName}</Text>
                                    <Text style={styles.secondaryText}>+91 {delivery.customerPhone}</Text>
                                </View>
                                <Ionicons name="call" size={24} color={Colors.success} style={{ marginLeft: 'auto' }} onPress={() => Linking.openURL(`tel:${delivery.customerPhone}`)} />
                            </View>
                            <View style={styles.addressBox}>
                                <Ionicons name="map" size={16} color={Colors.textLight} />
                                <Text style={styles.addressText}>{delivery.customerAddress}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Collection Payment</Text>
                        <View style={styles.card}>
                            <PaymentSelector
                                selectedMode={paymentMode}
                                onSelect={!isPaid ? setPaymentMode : () => { }}
                            />

                            <View style={styles.amountBox}>
                                <Text style={styles.inputLabel}>Cash/UPI Amount</Text>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.currency}>₹</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={setAmount}
                                        editable={!isPaid}
                                    />
                                </View>
                            </View>

                            {paymentMode === 'UPI' && (
                                <View style={styles.upiSection}>
                                    <View style={styles.qrPlaceholder}>
                                        <Ionicons name="qr-code" size={100} color={Colors.text} />
                                        <Text style={[styles.qrText, { color: Colors.primary }]}>SCAN FOR MERCHANT UPI</Text>
                                    </View>
                                    <Text style={styles.inputLabel}>UPI Reference Number</Text>
                                    <TextInput
                                        style={[styles.input, styles.borderedInput]}
                                        placeholder="Enter Ref No."
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
                                    <Ionicons name="checkmark-done-circle" size={40} color={Colors.success} />
                                    <Text style={styles.paidTitle}>DELIVERY COMPLETED</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default DeliveryDetailScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '600' },
    content: { padding: 16 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
    mapCard: { backgroundColor: 'white', borderRadius: 24, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
    mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginBottom: 12 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
    liveText: { fontSize: 10, fontWeight: '900', color: '#166534', letterSpacing: 0.5 },
    distanceText: { fontSize: 11, color: '#64748b', fontStyle: 'italic' },
    mapPlaceholder: { height: 250, backgroundColor: '#f1f5f9', borderRadius: 20, overflow: 'hidden' },
    infoCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    textGroup: { flex: 1 },
    primaryText: { fontSize: 18, fontWeight: '700', color: Colors.text },
    secondaryText: { fontSize: 14, color: '#64748b' },
    mapControls: { position: 'absolute', bottom: 16, right: 16, zIndex: 10 },
    controlBtn: { backgroundColor: 'white', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#e2e8f0' },
    addressBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', gap: 10 },
    addressText: { fontSize: 14, color: Colors.text, lineHeight: 20, flex: 1 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
    amountBox: { marginTop: 24 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    currency: { fontSize: 20, fontWeight: '800', color: Colors.text, marginRight: 4 },
    input: { flex: 1, paddingVertical: 14, fontSize: 20, fontWeight: '800', color: Colors.text },
    upiSection: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    qrPlaceholder: { alignItems: 'center', marginBottom: 24 },
    qrText: { marginTop: 12, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    borderedInput: { backgroundColor: '#f8fafc', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, fontWeight: '600' },
    confirmBtn: { marginTop: 32 },
    paidSuccess: { alignItems: 'center', paddingVertical: 20 },
    paidTitle: { fontSize: 14, fontWeight: '900', color: Colors.success, marginTop: 10, letterSpacing: 2 }
});
