import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeliveryCard } from '../../components/DeliveryCard';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Delivery, deliveryService } from '../../services/deliveryService';
import socketService from '../../services/socket';

export default function DeliveriesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const insets = useSafeAreaInsets();

    const mapDeliveryData = (data: Delivery[]) => {
        return data.map(d => ({
            id: d.id,
            customerName: d.customerName,
            address: d.customerAddress,
            cylinderType: d.cylinderType,
            contactNumber: d.customerPhone || '',
            paymentStatus: d.status === 'DELIVERED' ? 'Paid' : 'Pending',
            deliveryStatus: d.status === 'PENDING' ? 'Assigned' :
                d.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' :
                    d.status === 'DELIVERED' ? 'Delivered' : 'Cancelled',
            amount: d.amount || (d.quantity ? d.quantity * 800 : 800),
        }));
    };

    const fetchData = useCallback(async () => {
        try {
            if (!user) {
                setDeliveries([]);
                return;
            }
            const data = await deliveryService.getDeliveries();
            const myDeliveries = data.filter(d => d.assignedStaffId === user?.id);
            setDeliveries(mapDeliveryData(myDeliveries));
        } catch (error: any) {
            if (!user) return;
            console.error('Fetch deliveries error:', error);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user) {
            setDeliveries([]);
            return;
        }

        fetchData();

        const socket = socketService.connect();

        const handleConnect = () => { };
        const handleDisconnect = () => { };
        const handleNewOrder = (newOrder: Delivery) => {
            if (newOrder.assignedStaffId === user?.id) {
                setDeliveries(prev => {
                    if (prev.some(d => d.id === newOrder.id)) return prev;
                    const mapped = {
                        id: newOrder.id,
                        customerName: newOrder.customerName,
                        address: newOrder.customerAddress,
                        cylinderType: newOrder.cylinderType,
                        contactNumber: newOrder.customerPhone || '',
                        paymentStatus: 'Pending',
                        deliveryStatus: 'Assigned',
                        amount: newOrder.amount || (newOrder.quantity ? newOrder.quantity * 800 : 800)
                    };
                    return [mapped, ...prev];
                });
                Alert.alert('New Task!', 'You have been assigned a new delivery task.');
            }
        };

        socket.on('newOrder', handleNewOrder);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('newOrder', handleNewOrder);
        };
    }, [user?.id, fetchData]);

    const onRefresh = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData, user]);

    const handleUpdateStatus = async (id: string, statusText: string) => {
        const backendStatus = statusText === 'Out for Delivery' ? 'OUT_FOR_DELIVERY' :
            statusText === 'Cancelled' ? 'CANCELLED' : 'DELIVERED';

        if (backendStatus === 'CANCELLED') {
            Alert.alert(
                'Cancel Delivery',
                'Are you sure you want to cancel this delivery?',
                [
                    { text: 'No', style: 'cancel' },
                    {
                        text: 'Yes, Cancel',
                        style: 'destructive',
                        onPress: async () => {
                            await deliveryService.updateDeliveryStatus(id, 'CANCELLED');
                            setDeliveries(prev => prev.map(d => d.id === id ? { ...d, deliveryStatus: 'Cancelled' } : d));
                        }
                    }
                ]
            );
            return;
        }

        await deliveryService.updateDeliveryStatus(id, backendStatus);
        setDeliveries(prev => prev.map(d => d.id === id ? { ...d, deliveryStatus: statusText } : d));
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
                <Ionicons name="cube-outline" size={44} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Deliveries Found</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
        </View>
    );

    const filteredDeliveries = deliveries.filter(delivery => {
        if (selectedFilter === 'All') return true;
        return delivery.deliveryStatus === selectedFilter;
    });

    const filters = ['All', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled'];

    // Count per filter
    const filterCounts: Record<string, number> = {
        'All': deliveries.length,
        'Assigned': deliveries.filter(d => d.deliveryStatus === 'Assigned').length,
        'Out for Delivery': deliveries.filter(d => d.deliveryStatus === 'Out for Delivery').length,
        'Delivered': deliveries.filter(d => d.deliveryStatus === 'Delivered').length,
        'Cancelled': deliveries.filter(d => d.deliveryStatus === 'Cancelled').length,
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Premium Header */}
            <View style={[styles.pageHeader, { paddingTop: insets.top + 14 }]}>
                <Text style={styles.pageHeaderTitle}>Manage Deliveries</Text>
            </View>


            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {filters.map((filter) => {
                        const isActive = filter === selectedFilter;
                        const iconMap: Record<string, any> = {
                            'All': 'layers',
                            'Assigned': 'clipboard',
                            'Out for Delivery': 'bicycle',
                            'Delivered': 'checkmark-circle',
                            'Cancelled': 'close-circle',
                        };
                        return (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterChip, isActive && styles.activeFilterChip]}
                                onPress={() => setSelectedFilter(filter)}
                                activeOpacity={0.85}
                            >
                                <Ionicons
                                    name={isActive ? iconMap[filter] : `${iconMap[filter]}-outline`}
                                    size={13}
                                    color={isActive ? '#F59E0B' : '#94A3B8'}
                                />
                                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                                    {filter}
                                </Text>
                                {filterCounts[filter] > 0 && (
                                    <View style={[styles.filterBadge, isActive && styles.activeFilterBadge]}>
                                        <Text style={[styles.filterBadgeText, isActive && styles.activeFilterBadgeText]}>
                                            {filterCounts[filter]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <FlatList
                data={filteredDeliveries}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <DeliveryCard
                        delivery={item}
                        onPress={() => router.push(`/delivery/${item.id}` as any)}
                        onStart={() => handleUpdateStatus(item.id, 'Out for Delivery')}
                        onDeliver={() => router.push(`/delivery/${item.id}` as any)}
                        onCancel={() => handleUpdateStatus(item.id, 'Cancelled')}
                    />
                )}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '600',
    },

    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '600',
    },

    // Page Header
    pageHeader: {
        backgroundColor: '#003087',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    pageHeaderEyebrow: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2,
        marginBottom: 4,
    },
    pageHeaderTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.8,
    },
    contentCard: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        paddingTop: 14,
    },

    // Header (kept for loader state)
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#F1F5F9',
    },
    headerEyebrow: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textLight,
        letterSpacing: 2,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },

    // Progress
    progressBar: {
        height: 3,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
        borderRadius: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },

    // Stats strip
    statsStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    statsText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },
    statsHighlight: {
        color: Colors.text,
        fontWeight: '700',
    },
    statsEarnings: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.success,
    },

    // Filters
    filterContainer: {
        paddingBottom: 12,
        marginTop: 10,
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        borderWidth: 0,
    },
    activeFilterChip: {
        backgroundColor: '#0F172A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },
    activeFilterText: {
        color: '#F59E0B',
        fontWeight: '800',
    },
    filterBadge: {
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    activeFilterBadge: {
        backgroundColor: 'rgba(245,158,11,0.2)',
    },
    filterBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
    },
    activeFilterBadgeText: {
        color: '#F59E0B',
    },

    listContent: {
        padding: 20,
        paddingTop: 4,
        paddingBottom: 120,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textLight,
        textAlign: 'center',
        lineHeight: 20,
    },
});
