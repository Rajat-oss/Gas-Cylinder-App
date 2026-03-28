import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

function TabIcon({ name, focused, label }: { name: any; focused: boolean; label: string }) {
    return (
        <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
            <Ionicons
                name={focused ? name : `${name}-outline`}
                size={20}
                color={focused ? '#FFFFFF' : '#94A3B8'}
            />
        </View>
    );
}

const tabStyles = StyleSheet.create({
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapActive: {
        backgroundColor: '#003087',
        shadowColor: '#003087',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 8 : 16);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#003087',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                    height: 60 + bottomInset,
                    paddingBottom: bottomInset,
                    paddingTop: 10,
                    paddingHorizontal: 8,
                    marginHorizontal: 12,
                    marginBottom: bottomInset > 0 ? 8 : 10,
                    borderRadius: 20,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 2,
                    letterSpacing: 0.3,
                },
                tabBarItemStyle: {
                    paddingVertical: 2,
                },
                tabBarActiveBackgroundColor: 'transparent',
                tabBarInactiveBackgroundColor: 'transparent',
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="home" focused={focused} label="Dashboard" />
                    ),
                }}
            />
            <Tabs.Screen
                name="deliveries"
                options={{
                    title: 'Deliveries',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="cube" focused={focused} label="Deliveries" />
                    ),
                }}
            />
            <Tabs.Screen
                name="summary"
                options={{
                    title: 'Summary',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="bar-chart" focused={focused} label="Summary" />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="person" focused={focused} label="Profile" />
                    ),
                }}
            />
        </Tabs>
    );
}
