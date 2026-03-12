import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const [isOnline, setIsOnline] = useState(true);

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
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Gradient Header */}
                <View style={styles.gradientHeader}>
                    <View style={styles.headerContent}>
                        <View style={styles.onlineStatusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
                            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                            <Switch
                                value={isOnline}
                                onValueChange={setIsOnline}
                                trackColor={{ false: '#94A3B8', true: '#10B981' }}
                                thumbColor={'#FFFFFF'}
                                style={styles.switch}
                            />
                        </View>
                    </View>
                </View>

                {/* Avatar Section - Overlapping */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <Ionicons name="person" size={56} color="#FFFFFF" />
                        </View>
                    </View>
                    <Text style={styles.driverName}>{user?.name}</Text>
                    <Text style={styles.vehicleNumber}>{user?.vehicleNumber || 'Vehicle not assigned'}</Text>
                </View>

                {/* Driver Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="call" size={20} color="#2563EB" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Phone Number</Text>
                            <Text style={styles.infoValue}>{user?.phone || '+91 XXXXX XXXXX'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="card" size={20} color="#10B981" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>License Number</Text>
                            <Text style={styles.infoValue}>{user?.licenseNumber || 'Not assigned'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="car" size={20} color="#F59E0B" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Vehicle Number</Text>
                            <Text style={styles.infoValue}>{user?.vehicleNumber || 'Not assigned'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconContainer}>
                            <Ionicons name="mail" size={20} color="#8B5CF6" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Employee ID</Text>
                            <Text style={styles.infoValue}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Options */}
                <View style={styles.menuSection}>
                    <TouchableOpacity style={styles.menuCard}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="receipt" size={22} color="#2563EB" />
                        </View>
                        <Text style={styles.menuText}>Transaction History</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#FCE7F3' }]}>
                            <Ionicons name="notifications" size={22} color="#EC4899" />
                        </View>
                        <Text style={styles.menuText}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="help-buoy" size={22} color="#10B981" />
                        </View>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <View style={[styles.menuIconContainer, { backgroundColor: '#E0E7FF' }]}>
                            <Ionicons name="settings" size={22} color="#6366F1" />
                        </View>
                        <Text style={styles.menuText}>Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <CustomButton
                    title="Logout"
                    onPress={handleLogout}
                    variant="outline"
                    style={styles.logoutBtn}
                    textStyle={{ color: Colors.danger, fontWeight: '700' }}
                />

                <Text style={styles.version}>Version 1.0.42 (Beta)</Text>
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
        paddingBottom: 40,
    },
    gradientHeader: {
        height: 180,
        backgroundColor: '#2563EB',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    onlineStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    switch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
    },
    avatarSection: {
        alignItems: 'center',
        marginTop: -60,
        marginBottom: 24,
    },
    avatarContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    avatarCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 6,
        borderColor: '#FFFFFF',
    },
    driverName: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 16,
        letterSpacing: -0.5,
    },
    vehicleNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary,
        marginTop: 4,
        letterSpacing: 1,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    infoIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 58,
    },
    menuSection: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    menuCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    logoutBtn: {
        marginHorizontal: 20,
        borderColor: Colors.danger,
        borderWidth: 2,
    },
    version: {
        textAlign: 'center',
        color: Colors.textLight,
        fontSize: 12,
        marginTop: 24,
        fontWeight: '500',
    },
});
