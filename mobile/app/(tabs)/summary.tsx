import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

    const fetchData = React.useCallback(async () => {
        try {
            if (!user) return;
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

    const chartData = [
        { label: 'Mon', value: 0 },
        { label: 'Tue', value: 0 },
        { label: 'Wed', value: 0 },
        { label: 'Thu', value: 0 },
        { label: 'Fri', value: 0 },
        { label: 'Sat', value: 0 },
        { label: 'Sun', value: 0 },
    ];

    deliveries.forEach(delivery => {
        if (delivery.status === 'DELIVERED') {
            const dateStr = delivery.scheduledDeliveryDate || delivery.createdAt;
            if (dateStr) {
                const date = new Date(dateStr);
                const dayIndex = date.getDay();
                const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
                chartData[mappedIndex].value++;
            }
        }
    });

    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Blue Hero Header */}
            <View style={[styles.heroHeader, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.heroEyebrow}>WEEKLY</Text>
                <Text style={styles.heroTitle}>Performance</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#CC0000']} />
                }
                showsVerticalScrollIndicator={false}
            >

                {/* Weekly Chart Card */}
                <View style={styles.chartCard}>
                    <View style={styles.chartCardHeader}>
                        <View>
                            <Text style={styles.chartTitle}>Deliveries this Week</Text>
                            <Text style={styles.chartSubtitle}>
                                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.weeklyBadge}>
                            <Ionicons name="trending-up" size={12} color="#10B981" />
                            <Text style={styles.weeklyBadgeText}>+{stats.total} ↑</Text>
                        </View>
                    </View>
                    <View style={styles.chartContainer}>
                        {chartData.map((data, index) => {
                            const isToday = index === todayIndex;
                            const barHeight = Math.max((data.value / maxVal) * 100, 4);
                            return (
                                <View key={index} style={styles.barWrapper}>
                                    <View style={styles.barValueContainer}>
                                        {data.value > 0 && (
                                            <Text style={[styles.barValue, isToday && styles.barValueActive]}>
                                                {data.value}
                                            </Text>
                                        )}
                                    </View>
                                    <View
                                        style={[
                                            styles.bar,
                                            { height: barHeight },
                                            isToday ? styles.barActive : styles.barDefault
                                        ]}
                                    />
                                    <Text style={[styles.barLabel, isToday && styles.barLabelActive]}>
                                        {data.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* KPI Cards */}
                <View style={styles.kpiGrid}>
                    <View style={[styles.kpiCard, { backgroundColor: '#003087' }]}>
                        <Text style={styles.kpiEmoji}>🚴</Text>
                        <Text style={styles.kpiValue}>{stats.total}</Text>
                        <Text style={styles.kpiLabel}>Total Deliveries</Text>
                    </View>
                    <View style={[styles.kpiCard, { backgroundColor: '#007A3D' }]}>
                        <Text style={styles.kpiEmoji}>💰</Text>
                        <Text style={styles.kpiValue}>₹{(stats.cash + stats.upi).toLocaleString('en-IN')}</Text>
                        <Text style={styles.kpiLabel}>Total Earnings</Text>
                    </View>
                    <View style={[styles.kpiCard, { backgroundColor: '#F5A623' }]}>
                        <Text style={styles.kpiEmoji}>💵</Text>
                        <Text style={styles.kpiValue}>₹{stats.cash.toLocaleString('en-IN')}</Text>
                        <Text style={styles.kpiLabel}>Cash Total</Text>
                    </View>
                    <View style={[styles.kpiCard, { backgroundColor: '#CC0000' }]}>
                        <Text style={styles.kpiEmoji}>📱</Text>
                        <Text style={styles.kpiValue}>₹{stats.upi.toLocaleString('en-IN')}</Text>
                        <Text style={styles.kpiLabel}>UPI Total</Text>
                    </View>
                </View>

                {/* Transaction History */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Transactions</Text>
                    <TouchableOpacity
                        style={styles.viewAllBtn}
                        onPress={() => router.push('/transactions')}
                    >
                        <Text style={styles.viewAllText}>View All →</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.historyCard}>
                    {deliveries.filter(d =>
                        d.status === 'DELIVERED' && d.transactions && d.transactions.length > 0
                    ).length === 0 && (
                            <View style={styles.emptyState}>
                                <Ionicons name="receipt-outline" size={44} color={Colors.border} />
                                <Text style={styles.noData}>No completed deliveries yet.</Text>
                            </View>
                        )}
                    {deliveries.filter(d =>
                        d.status === 'DELIVERED' && d.transactions && d.transactions.length > 0
                    ).flatMap((item) =>
                        item.transactions!.map(t => {
                            const deliveryDate = new Date(item.createdAt);
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);

                            today.setHours(0, 0, 0, 0);
                            yesterday.setHours(0, 0, 0, 0);
                            deliveryDate.setHours(0, 0, 0, 0);

                            let dateStr;
                            if (deliveryDate.getTime() === today.getTime()) {
                                dateStr = 'Today';
                            } else if (deliveryDate.getTime() === yesterday.getTime()) {
                                dateStr = 'Yesterday';
                            } else {
                                const day = String(deliveryDate.getDate()).padStart(2, '0');
                                const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
                                const year = deliveryDate.getFullYear();
                                dateStr = `${day}-${month}-${year}`;
                            }

                            const isUPI = t.paymentType === 'UPI';

                            return (
                                <View key={t.id} style={styles.historyItem}>
                                    <View style={[styles.historyIcon, { backgroundColor: isUPI ? '#EBF0F9' : '#FEF3E2' }]}>
                                        <Ionicons
                                            name={isUPI ? 'qr-code-outline' : 'cash-outline'}
                                            size={20}
                                            color={isUPI ? '#003087' : '#F5A623'}
                                        />
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <Text style={styles.historyName}>{item.customerName}</Text>
                                        <Text style={styles.historyDate}>{dateStr} · {t.paymentType}</Text>
                                    </View>
                                    <View style={styles.historyRight}>
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
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },

    // Hero Header
    heroHeader: {
        backgroundColor: '#003087',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    heroEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    refreshBtn: {
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

    // Chart
    chartCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 4,
    },
    chartCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 2,
    },
    chartSubtitle: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
    },
    weeklyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    weeklyBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 110,
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
        color: Colors.textLight,
    },
    barValueActive: {
        color: '#CC0000',
    },
    bar: {
        width: 22,
        borderRadius: 8,
        marginBottom: 8,
        minHeight: 4,
    },
    barDefault: {
        backgroundColor: '#E2E8F0',
    },
    barActive: {
        backgroundColor: '#CC0000',
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textLight,
    },
    barLabelActive: {
        color: '#CC0000',
        fontWeight: '800',
    },

    // KPI Grid
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    kpiCard: {
        width: '47.5%',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    kpiEmoji: {
        fontSize: 24,
        marginBottom: 10,
    },
    kpiValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    viewAllBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#EBF0F9',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#003087',
    },

    // History
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 4,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    historyIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 3,
    },
    historyDate: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    historyRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    amountText: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.success,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noData: {
        textAlign: 'center',
        color: Colors.textLight,
        fontSize: 14,
        marginTop: 10,
    },
});
