import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { CustomButton } from './CustomButton';
import { StatusBadge } from './StatusBadge';

interface DeliveryCardProps {
    delivery: {
        id: string;
        customerName: string;
        address: string;
        cylinderType: string;
        contactNumber: string;
        paymentStatus: string;
        deliveryStatus: string;
        amount: number;
    };
    onPress: () => void;
    onStart: () => void;
    onDeliver: () => void;
    onCancel: () => void;
}

const statusAccent: Record<string, string> = {
    'Assigned': '#003087',
    'Out for Delivery': '#F5A623',
    'Delivered': '#007A3D',
    'Cancelled': '#CC0000',
};

const statusIconBg: Record<string, string> = {
    'Assigned': '#EBF0F9',
    'Out for Delivery': '#FEF3E2',
    'Delivered': '#E6F4EC',
    'Cancelled': '#FDEAEA',
};

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
    delivery,
    onPress,
    onStart,
    onDeliver,
    onCancel
}) => {
    const handleCall = () => {
        Linking.openURL(`tel:${delivery.contactNumber}`);
    };

    const accent = statusAccent[delivery.deliveryStatus] || '#003087';
    const iconBg = statusIconBg[delivery.deliveryStatus] || '#EBF0F9';

    return (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: accent }]}
            onPress={onPress}
            activeOpacity={0.88}
        >
            {/* Header Row */}
            <View style={styles.header}>
                <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                    <Ionicons name="cube" size={22} color={accent} />
                </View>
                <View style={styles.titleBlock}>
                    <Text style={styles.customerName}>{delivery.customerName}</Text>
                    <Text style={styles.cylinderType}>{delivery.cylinderType} Cylinder</Text>
                </View>
                <StatusBadge status={delivery.deliveryStatus} />
            </View>

            {/* Address */}
            <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={accent} />
                <Text style={styles.address} numberOfLines={2}>{delivery.address}</Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: accent }]}>₹{delivery.amount}</Text>
                    <StatusBadge status={delivery.paymentStatus} />
                </View>

                <TouchableOpacity style={[styles.callButton, { backgroundColor: iconBg }]} onPress={handleCall}>
                    <Ionicons name="call" size={18} color={accent} />
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            {(delivery.deliveryStatus === 'Assigned' || delivery.deliveryStatus === 'Out for Delivery') && (
                <View style={styles.actions}>
                    {delivery.deliveryStatus === 'Assigned' && (
                        <CustomButton
                            title="Start Delivery"
                            onPress={onStart}
                            size="sm"
                            style={styles.actionBtn}
                        />
                    )}
                    {delivery.deliveryStatus === 'Out for Delivery' && (
                        <CustomButton
                            title="Mark Delivered"
                            onPress={onDeliver}
                            variant="success"
                            size="sm"
                            style={styles.actionBtn}
                        />
                    )}
                    <CustomButton
                        title="Cancel"
                        onPress={onCancel}
                        variant="outline"
                        size="sm"
                        style={[styles.actionBtn, { borderColor: Colors.danger } as any]}
                        textStyle={{ color: Colors.danger }}
                    />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleBlock: {
        flex: 1,
    },
    customerName: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    cylinderType: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textLight,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: '#EBF0F9',
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
    },
    address: {
        fontSize: 13,
        color: Colors.textLight,
        flex: 1,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    paymentMethodChip: {
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    paymentMethodText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7C3AED',
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 14,
    },
    actionBtn: {
        flex: 1,
    },
});
