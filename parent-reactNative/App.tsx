import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { ClerkProvider, SignedIn, SignedOut, ClerkLoading } from '@clerk/clerk-expo';
import { tokenCache } from './src/lib/cache';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const Stack = createNativeStackNavigator();

function Navigation() {
  return (
    <>
      <ClerkLoading>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </ClerkLoading>

      <SignedIn>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
      </SignedIn>

      <SignedOut>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      </SignedOut>
    </>
  );
}

export default function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'white' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red', textAlign: 'center' }}>
          Configuration Error: Missing Clerk Publishable Key
        </Text>
        <Text style={{ marginTop: 10, textAlign: 'center', color: '#666' }}>
          Please check your .env file in parent-reactNative
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </ClerkProvider>
  );
}
