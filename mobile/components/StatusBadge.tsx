import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface StatusBadgeProps {
    status: string;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'Delivered':
        case 'Paid':
        case 'DELIVERED':
            return { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' };
        case 'Out for Delivery':
            return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
        case 'Pending':
            return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
        case 'Cancelled':
        case 'CANCELLED':
            return { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' };
        case 'Assigned':
        case 'PENDING':
            return { bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' };
        default:
            return { bg: Colors.secondary + '20', text: Colors.secondary, dot: Colors.secondary };
    }
};

const getDisplayLabel = (status: string) => {
    switch (status) {
        case 'DELIVERED': return 'Delivered';
        case 'CANCELLED': return 'Cancelled';
        case 'PENDING': return 'Assigned';
        default: return status;
    }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = getStatusConfig(status);
    const label = getDisplayLabel(status);

    return (
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <View style={[styles.dot, { backgroundColor: config.dot }]} />
            <Text style={[styles.text, { color: config.text }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    text: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});
