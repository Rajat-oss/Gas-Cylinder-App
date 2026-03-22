import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Delivery, deliveryService } from '../../services/deliveryService';
import socketService from '../../services/socket';

export default function SummaryScreen() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    const fetchData = React.useCallback(async () => {
        try {
            if (!user) return; // Don't fetch if user is not logged in
            const data = await deliveryService.getDeliveries();
            setDeliveries(data);
            setRefreshing(false);
        } catch (error) {
            console.error('Summary fetch error:', error);
            setRefreshing(false);
        }
    }, [user]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchData();

        // Auto-refresh every 30 seconds for live updates
        const interval = setInterval(() => {
            fetchData();
        }, 30000);

        const socket = socketService.connect();

        const handleUpdate = () => {
            fetchData();
        };

        socket.on('newOrder', handleUpdate);
        socket.on('orderUpdated', handleUpdate);

        return () => {
            clearInterval(interval);
            socket.off('newOrder', handleUpdate);
            socket.off('orderUpdated', handleUpdate);
        };
    }, [fetchData]);

    // Refresh when tab comes into focus
    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const stats = {
        total: deliveries.filter(d => d.status === 'DELIVERED').length,
        cash: deliveries.reduce((total, d) => total + (d.transactions?.filter(t => t.paymentType === 'CASH').reduce((sum, t) => sum + t.amount, 0) || 0), 0),
        upi: deliveries.reduce((total, d) => total + (d.transactions?.filter(t => t.paymentType === 'UPI').reduce((sum, t) => sum + t.amount, 0) || 0), 0),
    };

    // Calculate deliveries by day of week based on scheduledDeliveryDate
    const chartData = [
        { label: 'Mon', value: 0 },
        { label: 'Tue', value: 0 },
        { label: 'Wed', value: 0 },
        { label: 'Thu', value: 0 },
        { label: 'Fri', value: 0 },
        { label: 'Sat', value: 0 },
        { label: 'Sun', value: 0 },
    ];

    // Count deliveries by scheduled delivery date
    deliveries.forEach(delivery => {
        if (delivery.status === 'DELIVERED') {
            const dateStr = delivery.scheduledDeliveryDate || delivery.createdAt;
            if (dateStr) {
                const date = new Date(dateStr);
                const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
                const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to Mon=0, Sun=6
                chartData[mappedIndex].value++;
            }
        }
    });

    const maxVal = Math.max(...chartData.map(d => d.value), 1);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                <Text style={styles.pageTitle}>Performance Analytics</Text>

                {/* Weekly Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Deliveries this Week</Text>
                    <View style={styles.chartContainer}>
                        {chartData.map((data, index) => (
                            <View key={index} style={styles.barWrapper}>
                                <View style={styles.barValueContainer}>
                                    {data.value > 0 && (
                                        <Text style={styles.barValue}>{data.value}</Text>
                                    )}
                                </View>
                                <View
                                    style={[
                                        styles.bar,
                                        { height: (data.value / maxVal) * 100 }
                                    ]}
                                />
                                <Text style={styles.barLabel}>{data.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Performance Cards */}
                <View style={styles.performanceGrid}>
                    <View style={[styles.performanceCard, styles.cardBlue]}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="bicycle-outline" size={24} color="#2563EB" />
                        </View>
                        <Text style={styles.cardValue}>{stats.total}</Text>
                        <Text style={styles.cardLabel}>Total Deliveries</Text>
                    </View>

                    <View style={[styles.performanceCard, styles.cardGreen]}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="trending-up-outline" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.cardValue}>₹{stats.cash + stats.upi}</Text>
                        <Text style={styles.cardLabel}>Total Earnings</Text>
                    </View>

                    <View style={[styles.performanceCard, styles.cardOrange]}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="cash-outline" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.cardValue}>₹{stats.cash}</Text>
                        <Text style={styles.cardLabel}>Cash Total</Text>
                    </View>

                    <View style={[styles.performanceCard, styles.cardPurple]}>
                        <View style={styles.cardIconContainer}>
                            <Ionicons name="qr-code-outline" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={styles.cardValue}>₹{stats.upi}</Text>
                        <Text style={styles.cardLabel}>UPI Total</Text>
                    </View>
                </View>

                {/* Transaction History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    <TouchableOpacity 
                        style={styles.viewAllBtn}
                        onPress={() => router.push('/transactions')}
                    >
                        <Text style={styles.viewAllText}>View All</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.historyCard}>
                    {deliveries.filter(d =>
                        d.status === 'DELIVERED' && d.transactions && d.transactions.length > 0
                    ).length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={Colors.border} />
                            <Text style={styles.noData}>No completed deliveries yet.</Text>
                        </View>
                    )}
                    {deliveries.filter(d =>
                        d.status === 'DELIVERED' && d.transactions && d.transactions.length > 0
                    ).flatMap((item) =>
                        item.transactions!.map(t => {
                            // Get delivery date - use createdAt as actual delivery date
                            const deliveryDate = new Date(item.createdAt);
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);
                            
                            // Reset time to compare only dates
                            today.setHours(0, 0, 0, 0);
                            yesterday.setHours(0, 0, 0, 0);
                            deliveryDate.setHours(0, 0, 0, 0);
                            
                            let dateStr;
                            if (deliveryDate.getTime() === today.getTime()) {
                                dateStr = 'Today';
                            } else if (deliveryDate.getTime() === yesterday.getTime()) {
                                dateStr = 'Yesterday';
                            } else {
                                // Format as DD-MM-YYYY
                                const day = String(deliveryDate.getDate()).padStart(2, '0');
                                const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
                                const year = deliveryDate.getFullYear();
                                dateStr = `${day}-${month}-${year}`;
                            }
                            
                            return (
                                <View key={t.id} style={styles.historyItem}>
                                    <View style={styles.historyIcon}>
                                        <Ionicons
                                            name={t.paymentType === 'UPI' ? 'qr-code-outline' : 'cash-outline'}
                                            size={22}
                                            color={t.paymentType === 'UPI' ? '#8B5CF6' : '#F59E0B'}
                                        />
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyName}>{item.customerName}</Text>
                                        <Text style={styles.historyDate}>{dateStr} • {t.paymentType}</Text>
                                    </View>
                                    <View style={styles.historyAmount}>
                                        <Text style={styles.amountText}>+₹{t.amount}</Text>
                                        <StatusBadge status="DELIVERED" />
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 24,
        letterSpacing: -1,
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        paddingTop: 12,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barValueContainer: {
        height: 20,
        justifyContent: 'center',
        marginBottom: 4,
    },
    barValue: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
    },
    bar: {
        width: 20,
        backgroundColor: Colors.primary,
        borderRadius: 6,
        marginBottom: 6,
        minHeight: 4,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textLight,
        marginTop: 4,
    },
    performanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    performanceCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    cardBlue: {
        borderLeftWidth: 4,
        borderLeftColor: '#2563EB',
    },
    cardGreen: {
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    cardOrange: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    cardPurple: {
        borderLeftWidth: 4,
        borderLeftColor: '#8B5CF6',
    },
    cardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardValue: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 3,
        letterSpacing: -0.5,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textLight,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    viewAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    historyInfo: {
        flex: 1,
    },
    historyName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    historyDate: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    historyAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.success,
        marginBottom: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noData: {
        textAlign: 'center',
        color: Colors.textLight,
        fontSize: 14,
        marginTop: 12,
    },
});
