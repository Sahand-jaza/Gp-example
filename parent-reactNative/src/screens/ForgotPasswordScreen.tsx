import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onRequestReset = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });
      setSuccessfulCreation(true);
    } catch (err: any) {
      Alert.alert("Reset Error", err.errors?.[0]?.message || "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        Alert.alert("Reset Failed", "The code you entered is invalid.");
      }
    } catch (err: any) {
      Alert.alert("Reset Error", err.errors?.[0]?.message || "Failed to reset password.");
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

        <Text className="text-3xl font-bold text-brand-primary mb-2">
          {successfulCreation ? 'Reset Password' : 'Forgot Password'}
        </Text>
        <Text className="text-slate-500 mb-10">
          {successfulCreation 
            ? `We've sent a 6-digit code to ${emailAddress}`
            : 'Enter your email address to receive a password reset code.'}
        </Text>
        
        {!successfulCreation ? (
          <>
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
            </View>

            <TouchableOpacity 
              className="bg-brand-accent py-4 rounded-2xl w-full items-center justify-center flex-row shadow-lg shadow-brand-accent/30 mt-10 active:opacity-90"
              onPress={onRequestReset}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Send Reset Code</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="space-y-6 mb-8">
              <View>
                <Text className="text-slate-700 font-bold mb-2 ml-1">Reset Code</Text>
                <View className="bg-slate-50 rounded-2xl border border-slate-100 p-2">
                  <TextInput
                    value={code}
                    placeholder="000000"
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    className="text-center text-3xl font-bold text-brand-primary"
                    maxLength={6}
                    placeholderTextColor="#cbd5e1"
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-700 font-bold mb-2 ml-1">New Password</Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-1">
                  <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                  <TextInput
                    value={password}
                    placeholder="Min. 8 characters"
                    secureTextEntry={!showPassword}
                    onChangeText={setPassword}
                    className="flex-1 ml-3 h-12 text-brand-primary text-base"
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              className="bg-brand-success py-4 rounded-2xl w-full items-center justify-center flex-row shadow-lg shadow-brand-success/30 active:opacity-90"
              onPress={onResetPassword}
              disabled={loading}
            >
               {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Set New Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              className="mt-6 items-center" 
              onPress={() => setSuccessfulCreation(false)}
            >
              <Text className="text-slate-500">Didn't receive code? Go back</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
