import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBadge } from '../components/StatusBadge';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { Delivery, deliveryService } from '../services/deliveryService';

export default function AllTransactionsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = React.useCallback(async () => {
        try {
            const data = await deliveryService.getDeliveries();
            const myDeliveries = data.filter(d => d.assignedStaffId === user?.id && d.status === 'DELIVERED' && d.transactions && d.transactions.length > 0);
            setDeliveries(myDeliveries);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const getDateString = (dateStr: string) => {
        const deliveryDate = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        today.setHours(0, 0, 0, 0);
        yesterday.setHours(0, 0, 0, 0);
        deliveryDate.setHours(0, 0, 0, 0);

        if (deliveryDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (deliveryDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            const day = String(deliveryDate.getDate()).padStart(2, '0');
            const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
            const year = deliveryDate.getFullYear();
            return `${day}-${month}-${year}`;
        }
    };

    const renderTransaction = ({ item }: { item: Delivery }) => {
        return item.transactions!.map(t => (
            <View key={t.id} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                    <Ionicons
                        name={t.paymentType === 'UPI' ? 'qr-code-outline' : 'cash-outline'}
                        size={24}
                        color={Colors.primary}
                    />
                </View>
                <View style={styles.transactionInfo}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <Text style={styles.transactionDate}>{getDateString(item.createdAt)} • {t.paymentType}</Text>
                    <Text style={styles.address}>{item.customerAddress}</Text>
                </View>
                <View style={styles.transactionAmount}>
                    <Text style={styles.amountText}>+₹{t.amount}</Text>
                    <StatusBadge status="DELIVERED" />
                </View>
            </View>
        ));
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const totalAmount = deliveries.reduce((total, d) => 
        total + (d.transactions?.reduce((sum, t) => sum + t.amount, 0) || 0), 0
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Transactions</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Transactions</Text>
                    <Text style={styles.summaryValue}>{deliveries.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                    <Text style={[styles.summaryValue, { color: Colors.success }]}>₹{totalAmount}</Text>
                </View>
            </View>

            <FlatList
                data={deliveries}
                keyExtractor={(item) => item.id}
                renderItem={renderTransaction}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={80} color={Colors.border} />
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    summaryCard: {
        backgroundColor: Colors.surface,
        margin: 20,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textLight,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 13,
        color: Colors.textLight,
        marginBottom: 4,
    },
    address: {
        fontSize: 12,
        color: Colors.textLight,
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.success,
        marginBottom: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textLight,
        marginTop: 16,
    },
});
