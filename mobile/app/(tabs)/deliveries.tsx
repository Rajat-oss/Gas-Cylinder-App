import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeliveryCard } from '../../components/DeliveryCard';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Delivery, deliveryService } from '../../services/deliveryService';
import socketService from '../../services/socket';

export default function DeliveriesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('All');

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
            setLoading(true);
            const data = await deliveryService.getDeliveries();
            // Filter by assigned staff if it's a driver
            const myDeliveries = data.filter(d => d.assignedStaffId === user?.id);
            setDeliveries(mapDeliveryData(myDeliveries));
        } catch (error: any) {
            // Silently handle errors when user is logged out
            if (!user) {
                console.log('Skipping error alert - user logged out');
                return;
            }
            console.error('Fetch deliveries error:', error);
            let errorMessage = 'Failed to load deliveries';
            
            if (error.response?.status === 401) {
                errorMessage = 'Session expired. Please login again.';
            } else if (!error.response) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
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
            <Ionicons name="document-text-outline" size={80} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Deliveries Assigned</Text>
            <Text style={styles.emptySubtitle}>You{"'"}re all caught up for today!</Text>
        </View>
    );

    // Filter deliveries based on selected filter
    const filteredDeliveries = deliveries.filter(delivery => {
        if (selectedFilter === 'All') return true;
        return delivery.deliveryStatus === selectedFilter;
    });

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['All', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled'].map((filter) => (
                        <TouchableOpacity 
                            key={filter} 
                            style={[styles.filterChip, filter === selectedFilter && styles.activeFilterChip]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text style={[styles.filterText, filter === selectedFilter && styles.activeFilterText]}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
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
        backgroundColor: '#F8FAFC',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 10,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        borderWidth: 0,
    },
    activeFilterChip: {
        backgroundColor: '#2563EB',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: 0.2,
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 20,
        letterSpacing: -0.5,
    },
    emptySubtitle: {
        fontSize: 15,
        color: Colors.textLight,
        marginTop: 8,
        textAlign: 'center',
    },
});
