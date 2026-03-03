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
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.onlineStatus}>
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? Colors.success : Colors.danger }]} />
                        <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                        <Switch
                            value={isOnline}
                            onValueChange={setIsOnline}
                            trackColor={{ false: Colors.border, true: Colors.success + '50' }}
                            thumbColor={isOnline ? Colors.success : '#f4f3f4'}
                        />
                    </View>
                </View>

                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={50} color={Colors.primary} />
                    </View>
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.role}>{user?.role}</Text>
                </View>

                <View style={styles.detailsCard}>
                    <View style={styles.detailItem}>
                        <Ionicons name="call-outline" size={24} color={Colors.textLight} />
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>Phone Number</Text>
                            <Text style={styles.detailValue}>{user?.phone || '+91 XXXXX XXXXX'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailItem}>
                        <Ionicons name="mail-outline" size={24} color={Colors.textLight} />
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>Employee ID (Email)</Text>
                            <Text style={styles.detailValue}>{user?.email}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailItem}>
                        <Ionicons name="car-outline" size={24} color={Colors.textLight} />
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>Vehicle Number</Text>
                            <Text style={styles.detailValue}>{user?.vehicleNumber || 'Not assigned'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailItem}>
                        <Ionicons name="card-outline" size={24} color={Colors.textLight} />
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>License Number</Text>
                            <Text style={styles.detailValue}>{user?.licenseNumber || 'Not assigned'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.menuCard}>
                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
                        <Text style={styles.menuText}>Privacy & Security</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.border} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="help-buoy-outline" size={24} color={Colors.primary} />
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.border} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="settings-outline" size={24} color={Colors.primary} />
                        <Text style={styles.menuText}>App Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.border} />
                    </TouchableOpacity>
                </View>

                <CustomButton
                    title="Logout"
                    onPress={handleLogout}
                    variant="outline"
                    style={styles.logoutBtn}
                    textStyle={{ color: Colors.danger }}
                />

                <Text style={styles.version}>Version 1.0.42 (Beta)</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
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
        color: Colors.text,
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: Colors.surface,
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
    },
    role: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    detailsCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailText: {
        marginLeft: 16,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.textLight,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginLeft: 40,
    },
    menuCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 32,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginLeft: 16,
    },
    logoutBtn: {
        borderColor: Colors.danger,
    },
    version: {
        textAlign: 'center',
        color: Colors.textLight,
        fontSize: 12,
        marginTop: 24,
        marginBottom: 20,
    },
});
