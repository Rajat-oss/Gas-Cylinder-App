import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBadge } from '../../components/StatusBadge';
import { SummaryCard } from '../../components/SummaryCard';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Delivery, deliveryService } from '../../services/deliveryService';
export default function SummaryScreen() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    const fetchData = React.useCallback(async () => {
        const data = await deliveryService.getDeliveries();
        const myDeliveries = data.filter(d => d.assignedStaffId === user?.id);
        setDeliveries(myDeliveries);
        setRefreshing(false);
    }, [user?.id]);

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

        return () => clearInterval(interval);
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
        if (delivery.status === 'DELIVERED' && delivery.scheduledDeliveryDate) {
            const date = new Date(delivery.scheduledDeliveryDate);
            const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to Mon=0, Sun=6
            chartData[mappedIndex].value++;
        }
    });

    const maxVal = Math.max(...chartData.map(d => d.value));

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text style={styles.sectionTitle}>Performance Analytics</Text>

                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Deliveries this Week</Text>
                    <View style={styles.chartContainer}>
                        {chartData.map((data, index) => (
                            <View key={index} style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        { height: maxVal > 0 ? (data.value / maxVal) * 120 : 0 }
                                    ]}
                                />
                                <Text style={styles.barLabel}>{data.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <SummaryCard
                        label="Total Deliveries"
                        value={stats.total}
                        icon={<Ionicons name="bicycle-outline" size={20} color={Colors.primary} />}
                    />
                    <SummaryCard
                        label="Total Earnings"
                        value={`₹${stats.cash + stats.upi}`}
                        color={Colors.success}
                        icon={<Ionicons name="trending-up-outline" size={20} color={Colors.success} />}
                    />
                    <SummaryCard
                        label="Cash Total"
                        value={`₹${stats.cash}`}
                        color={Colors.warning}
                        icon={<Ionicons name="cash-outline" size={20} color={Colors.warning} />}
                    />
                    <SummaryCard
                        label="UPI Total"
                        value={`₹${stats.upi}`}
                        color={Colors.primary}
                        icon={<Ionicons name="qr-code-outline" size={20} color={Colors.primary} />}
                    />
                </View>

                <Text style={styles.sectionTitle}>Transaction History</Text>
                <View style={styles.historyCard}>
                    {deliveries.filter(d => d.status === 'DELIVERED' && d.transactions && d.transactions.length > 0).flatMap((item) =>
                        item.transactions!.map(t => (
                            <View key={t.id} style={styles.historyItem}>
                                <View style={styles.historyIcon}>
                                    <Ionicons
                                        name={t.paymentType === 'UPI' ? 'qr-code-outline' : 'cash-outline'}
                                        size={20}
                                        color={Colors.textLight}
                                    />
                                </View>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyName}>{item.customerName}</Text>
                                    <Text style={styles.historyDate}>Today • {t.paymentType}</Text>
                                </View>
                                <View style={styles.historyAmount}>
                                    <Text style={styles.amountText}>+₹{t.amount}</Text>
                                    <StatusBadge status="DELIVERED" />
                                </View>
                            </View>
                        ))
                    )}
                    {deliveries.filter(d => d.status === 'DELIVERED' && d.transactions && d.transactions.length > 0).length === 0 && (
                        <Text style={styles.noData}>No completed deliveries yet.</Text>
                    )}
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
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
        marginTop: 8,
    },
    chartCard: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chartTitle: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 20,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
    },
    barWrapper: {
        alignItems: 'center',
        width: '10%',
    },
    bar: {
        width: 12,
        backgroundColor: Colors.primary,
        borderRadius: 6,
        marginBottom: 8,
    },
    barLabel: {
        fontSize: 10,
        color: Colors.textLight,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    historyCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyInfo: {
        flex: 1,
    },
    historyName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    historyDate: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    historyAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.success,
        marginBottom: 4,
    },
    noData: {
        textAlign: 'center',
        color: Colors.textLight,
        padding: 20,
    },
});
