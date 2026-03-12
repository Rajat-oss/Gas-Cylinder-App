import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#2563EB',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    paddingHorizontal: 16,
                    marginHorizontal: 16,
                    marginBottom: Platform.OS === 'ios' ? 20 : 16,
                    borderRadius: 24,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
                headerStyle: {
                    backgroundColor: Colors.surface,
                },
                headerTitleStyle: {
                    fontWeight: '700',
                    color: Colors.text,
                },
                headerShadowVisible: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="deliveries"
                options={{
                    title: 'Deliveries',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "cube" : "cube-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="summary"
                options={{
                    title: 'Summary',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
