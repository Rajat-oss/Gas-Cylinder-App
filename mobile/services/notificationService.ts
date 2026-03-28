import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ONLINE_NOTIFICATION_ID = 'driver-online-status';

// SDK 53+ fix
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export async function requestNotificationPermission(): Promise<boolean> {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch {
        return false;
    }
}

export async function showOnlineNotification(driverName: string) {
    try {
        const granted = await requestNotificationPermission();
        if (!granted) return;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('online-status', {
                name: 'Driver Online Status',
                importance: Notifications.AndroidImportance.LOW,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                sound: null,
            });
        }

        await Notifications.dismissNotificationAsync(ONLINE_NOTIFICATION_ID);

        await Notifications.scheduleNotificationAsync({
            identifier: ONLINE_NOTIFICATION_ID,
            content: {
                title: '🟢 You are Online',
                body: `${driverName} • GasFlow is tracking your status`,
                sticky: true,
                autoDismiss: false,
                ...(Platform.OS === 'android' && { channelId: 'online-status' }),
            },
            trigger: null,
        });
    } catch {
        // Expo Go mein silently fail — APK mein kaam karega
    }
}

export async function dismissOnlineNotification() {
    try {
        await Notifications.dismissNotificationAsync(ONLINE_NOTIFICATION_ID);
        await Notifications.dismissAllNotificationsAsync();
    } catch {
        // silent
    }
}
