import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'assignment' | 'payment' | 'system';
    read: boolean;
}

const mockNotifications: Notification[] = [];

export default function NotificationsScreen() {
    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'assignment': return { name: 'document-text', color: Colors.primary };
            case 'payment': return { name: 'cash', color: Colors.success };
            case 'system': return { name: 'notifications', color: Colors.secondary };
            default: return { name: 'information-circle', color: Colors.primary };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'Notifications', headerShown: true }} />
            <FlatList
                data={mockNotifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const icon = getIcon(item.type);
                    return (
                        <TouchableOpacity style={[styles.item, !item.read && styles.unreadItem]}>
                            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                                <Ionicons name={icon.name as any} size={24} color={icon.color} />
                            </View>
                            <View style={styles.content}>
                                <View style={styles.header}>
                                    <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
                                    <Text style={styles.time}>{item.time}</Text>
                                </View>
                                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                            </View>
                            {!item.read && <View style={styles.dot} />}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={() => (
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={60} color={Colors.border} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    list: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    unreadItem: {
        borderColor: Colors.primary + '30',
        backgroundColor: Colors.primary + '05',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        flex: 1,
    },
    unreadTitle: {
        fontWeight: '800',
    },
    time: {
        fontSize: 12,
        color: Colors.textLight,
        marginLeft: 8,
    },
    message: {
        fontSize: 14,
        color: Colors.textLight,
        lineHeight: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        marginLeft: 12,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.textLight,
    },
});
