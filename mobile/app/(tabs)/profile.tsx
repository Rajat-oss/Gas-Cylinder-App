import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [isOnline, setIsOnline] = useState(true);
    const [hasPending, setHasPending] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        deliveryService.getDeliveries().then(data => {
            setHasPending(data.some((d: any) => d.status === 'PENDING'));
        }).catch(() => {});
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => logout()
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Hero Header */}
                <View style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
                    {/* Top bar */}
                    <View style={styles.topBar}>
                        <View style={styles.brandPill}>
                            <Ionicons name="flame" size={14} color="#F97316" />
                            <Text style={styles.brandText}>GAS DELIVERY</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.notifBtn}
                            onPress={() => router.push('/notifications')}
                        >
                            <Ionicons name="notifications" size={20} color="#FFFFFF" />
                            {hasPending && <View style={styles.notifBadge} />}
                        </TouchableOpacity>
                    </View>

                    {/* Avatar + Name */}
                    <View style={styles.profileCenter}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarRing}>
                                <View style={styles.avatarInner}>
                                    <Ionicons name="person" size={48} color="#FFFFFF" />
                                </View>
                            </View>
                            <View style={[styles.onlineDotBadge, { backgroundColor: isOnline ? '#10B981' : '#6B7280' }]} />
                        </View>
                        <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
                        <View style={styles.roleChip}>
                            <Ionicons name="shield-checkmark" size={12} color="#F97316" />
                            <Text style={styles.roleText}>Verified Gas Delivery Partner</Text>
                        </View>
                        <Text style={styles.vehicleTag}>{user?.vehicleNumber || 'Vehicle not assigned'}</Text>
                    </View>

                </View>

                {/* Info Card */}
                <View style={styles.sectionLabel}>
                    <Ionicons name="person-circle-outline" size={16} color={Colors.textLight} />
                    <Text style={styles.sectionLabelText}>DRIVER INFORMATION</Text>
                </View>
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="call" size={18} color="#2563EB" />
                        </View>
                        <View style={styles.infoText}>
                            <Text style={styles.infoTopLabel}>Phone Number</Text>
                            <Text style={styles.infoValue}>{user?.phone || '+91 XXXXX XXXXX'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>

                    <View style={styles.infoDivider} />

                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="card" size={18} color="#10B981" />
                        </View>
                        <View style={styles.infoText}>
                            <Text style={styles.infoTopLabel}>License Number</Text>
                            <Text style={styles.infoValue}>{user?.licenseNumber || 'Not assigned'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>

                    <View style={styles.infoDivider} />

                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="car" size={18} color="#F59E0B" />
                        </View>
                        <View style={styles.infoText}>
                            <Text style={styles.infoTopLabel}>Vehicle Number</Text>
                            <Text style={styles.infoValue}>{user?.vehicleNumber || 'Not assigned'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>

                    <View style={styles.infoDivider} />

                    <View style={styles.infoRow}>
                        <View style={[styles.infoIconBox, { backgroundColor: '#EDE9FE' }]}>
                            <Ionicons name="finger-print" size={18} color="#8B5CF6" />
                        </View>
                        <View style={styles.infoText}>
                            <Text style={styles.infoTopLabel}>Employee ID</Text>
                            <Text style={styles.infoValue}>{user?.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.sectionLabel}>
                    <Ionicons name="apps-outline" size={16} color={Colors.textLight} />
                    <Text style={styles.sectionLabelText}>QUICK ACTIONS</Text>
                </View>
                <View style={styles.quickGrid}>
                    <TouchableOpacity style={styles.quickCard}>
                        <View style={[styles.quickIcon, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="receipt" size={22} color="#2563EB" />
                        </View>
                        <Text style={styles.quickText}>Transactions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCard}>
                        <View style={[styles.quickIcon, { backgroundColor: '#FCE7F3' }]}>
                            <Ionicons name="notifications" size={22} color="#EC4899" />
                        </View>
                        <Text style={styles.quickText}>Notifications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCard}>
                        <View style={[styles.quickIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="help-buoy" size={22} color="#10B981" />
                        </View>
                        <Text style={styles.quickText}>Support</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickCard}>
                        <View style={[styles.quickIcon, { backgroundColor: '#E0E7FF' }]}>
                            <Ionicons name="settings" size={22} color="#6366F1" />
                        </View>
                        <Text style={styles.quickText}>Settings</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>



            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    content: {
        paddingBottom: 100,
    },

    // Hero Header
    heroHeader: {
        backgroundColor: '#003087',
        paddingHorizontal: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 24,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    brandPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.07)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    brandText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    onlinePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    onlineLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    switch: {
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    notifBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#CC0000',
        borderWidth: 1.5,
        borderColor: '#003087',
    },

    // Avatar
    profileCenter: {
        alignItems: 'center',
        marginBottom: 28,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarRing: {
        width: 104,
        height: 104,
        borderRadius: 52,
        borderWidth: 3,
        borderColor: '#F97316',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#1E3A8A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineDotBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 3,
        borderColor: '#172554',
    },
    driverName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    roleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(249,115,22,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 8,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F97316',
    },
    vehicleTag: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 1,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginVertical: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#F59E0B',
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Section label
    sectionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    sectionLabelText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
        letterSpacing: 1.2,
    },

    // Info Card
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    infoIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    infoText: {
        flex: 1,
    },
    infoTopLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    infoDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 72,
    },

    // Quick Actions Grid
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 28,
    },
    quickCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    quickIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    quickText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#FECACA',
        backgroundColor: '#FFF5F5',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF4444',
    },
    version: {
        textAlign: 'center',
        color: Colors.textLight,
        fontSize: 12,
        fontWeight: '500',
    },
});
