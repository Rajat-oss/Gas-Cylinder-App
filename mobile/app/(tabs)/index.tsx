import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { SummaryCard } from '../../components/SummaryCard';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import socketService from '../../services/socket';

export default function DashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [socketConnected, setSocketConnected] = useState(false);

    const fetchData = React.useCallback(async () => {
        try {
            const data = await deliveryService.getDeliveries();
            // In a real app, backend might only return driver's own tasks if requested via /my-tasks
            // but our backend /my-tasks returns ONLY assigned tasks.
            setDeliveries(data);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        }
    }, []);

    useEffect(() => {
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
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const stats = {
        assigned: deliveries.length,
        delivered: deliveries.filter(d => d.status === 'DELIVERED').length,
        pending: deliveries.filter(d => d.status === 'PENDING' || d.status === 'OUT_FOR_DELIVERY').length,
        cash: 0, // Backend needs to provide this or fetch from transactions
        upi: 0,
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
                    <View>
                        <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: socketConnected ? Colors.success : Colors.danger }} />
                            <Text style={[styles.date, { marginTop: 0 }]}>{socketConnected ? 'Real-time Linked' : 'Reconnecting...'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => router.push('/notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                        <View style={styles.badge} />
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Daily Overview</Text>
                    <View style={styles.statsGrid}>
                        <SummaryCard
                            label="Assigned"
                            value={stats.assigned}
                            icon={<Ionicons name="clipboard-outline" size={20} color={Colors.primary} />}
                        />
                        <SummaryCard
                            label="Delivered"
                            value={stats.delivered}
                            color={Colors.success}
                            icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />}
                        />
                        <SummaryCard
                            label="Pending"
                            value={stats.pending}
                            color={Colors.warning}
                            icon={<Ionicons name="time-outline" size={20} color={Colors.warning} />}
                        />
                        <SummaryCard
                            label="Total Earnings"
                            value={`₹${stats.cash + stats.upi}`}
                            color={Colors.primary}
                            icon={<Ionicons name="wallet-outline" size={20} color={Colors.primary} />}
                        />
                    </View>

                    <View style={styles.paymentSplit}>
                        <View style={[styles.paymentCard, { borderLeftColor: Colors.success }]}>
                            <Text style={styles.paymentLabel}>Cash Collected</Text>
                            <Text style={styles.paymentValue}>₹{stats.cash}</Text>
                        </View>
                        <View style={[styles.paymentCard, { borderLeftColor: Colors.primary }]}>
                            <Text style={styles.paymentLabel}>UPI Collected</Text>
                            <Text style={styles.paymentValue}>₹{stats.upi}</Text>
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

                <View style={styles.quickActions}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionItem}>
                            <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
                                <Ionicons name="navigate-outline" size={24} color="#0284c7" />
                            </View>
                            <Text style={styles.actionText}>Route map</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem}>
                            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                                <Ionicons name="help-circle-outline" size={24} color="#d97706" />
                            </View>
                            <Text style={styles.actionText}>Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem}>
                            <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                                <Ionicons name="settings-outline" size={24} color="#9333ea" />
                            </View>
                            <Text style={styles.actionText}>Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    date: {
        fontSize: 14,
        color: Colors.textLight,
        marginTop: 4,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.danger,
        borderWidth: 1,
        borderColor: Colors.surface,
    },
    summaryContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    paymentSplit: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    paymentCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    paymentLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 4,
    },
    paymentValue: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    mainActionBtn: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    quickActions: {
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionItem: {
        alignItems: 'center',
        width: '30%',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
});
