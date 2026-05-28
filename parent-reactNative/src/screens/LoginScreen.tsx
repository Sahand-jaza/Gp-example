import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
      } else {
        Alert.alert("Authentication Failure", "Please check your credentials and try again.");
      }
    } catch (err: any) {
      if (err.errors?.[0]?.code === 'session_exists' || err.errors?.[0]?.message === 'Session already exists') {
        await signOut();
        Alert.alert("Session Refreshed", "An old session was detected and cleared. Please try signing in again.");
      } else {
        Alert.alert("Sign In Error", err.errors?.[0]?.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 px-8 pt-10"
      >
        <TouchableOpacity 
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-50 mb-6"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-brand-primary mb-2">Welcome Back</Text>
        <Text className="text-slate-500 mb-10">Sign in to your parent account to continue monitoring progress.</Text>
        
        <View className="space-y-6">
          <View>
            <Text className="text-slate-700 font-bold mb-2 ml-1">Email Address</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-1">
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="parent@example.com"
                onChangeText={setEmailAddress}
                className="flex-1 ml-3 h-12 text-brand-primary text-base"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
          
          <View>
            <Text className="text-slate-700 font-bold mb-2 ml-1">Password</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-1">
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput
                value={password}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                className="flex-1 ml-3 h-12 text-brand-primary text-base"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} className="mt-3 self-end mr-1">
              <Text className="text-brand-accent font-medium">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          className="bg-brand-accent py-4 rounded-2xl w-full items-center justify-center flex-row shadow-lg shadow-brand-accent/30 mt-10 active:opacity-90"
          onPress={onSignInPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-slate-500">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text className="text-brand-accent font-bold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
