import React from 'react';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { tokenCache } from './src/lib/cache';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

const Stack = createNativeStackNavigator();

function PublicScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <Text className="text-xl font-bold">Welcome Parents!</Text>
      <Text>Please sign in to view your student's progress.</Text>
    </View>
  );
}

function PrivateScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-green-50">
      <Text className="text-xl font-bold text-green-700">Dashboard</Text>
      <Text>You are successfully signed in!</Text>
    </View>
  );
}

export default function App() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={PUBLISHABLE_KEY}>
      <NavigationContainer>
        <SignedIn>
          <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={PrivateScreen} />
          </Stack.Navigator>
        </SignedIn>
        
        <SignedOut>
          <Stack.Navigator>
            <Stack.Screen name="Welcome" component={PublicScreen} />
          </Stack.Navigator>
        </SignedOut>
      </NavigationContainer>
    </ClerkProvider>
  );
}
