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

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.customerName}>{delivery.customerName}</Text>
                    <Text style={styles.cylinderType}>{delivery.cylinderType} Cylinder</Text>
                </View>
                <StatusBadge status={delivery.deliveryStatus} />
            </View>

            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={Colors.textLight} />
                <Text style={styles.address} numberOfLines={2}>{delivery.address}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.paymentInfo}>
                    <Text style={styles.price}>₹{delivery.amount}</Text>
                    <StatusBadge status={delivery.paymentStatus} />
                </View>

                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                    <Ionicons name="call" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

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
                {(delivery.deliveryStatus === 'Assigned' || delivery.deliveryStatus === 'Out for Delivery') && (
                    <CustomButton
                        title="Cancel"
                        onPress={onCancel}
                        variant="outline"
                        size="sm"
                        style={[styles.actionBtn, { borderColor: Colors.danger } as any]}
                        textStyle={{ color: Colors.danger }}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    customerName: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    cylinderType: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
        paddingLeft: 2,
    },
    address: {
        fontSize: 14,
        color: Colors.textLight,
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 14,
        marginBottom: 14,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginRight: 10,
        letterSpacing: -0.5,
    },
    callButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
    },
});
