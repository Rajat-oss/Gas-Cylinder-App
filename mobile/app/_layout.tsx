import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="delivery/[id]" options={{ headerShown: true, title: 'Delivery Details' }} />
          <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        </Stack>
        <StatusBar style="dark" />
      </LocationProvider>
    </AuthProvider>
  );
}
