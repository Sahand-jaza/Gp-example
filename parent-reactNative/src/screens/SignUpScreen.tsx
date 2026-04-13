import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen({ navigation }: any) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
        unsafeMetadata: {
          role: "parent"
        }
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert("Registration Error", err.errors?.[0]?.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        Alert.alert("Verification Failed", "The code you entered is invalid.");
      }
    } catch (err: any) {
      Alert.alert("Verification Error", err.errors?.[0]?.message || "Failed to verify email.");
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
          {pendingVerification ? 'Verify Email' : 'Join as a Parent'}
        </Text>
        <Text className="text-slate-500 mb-10">
          {pendingVerification 
            ? `We've sent a 6-digit code to ${emailAddress}`
            : 'Start monitoring your child\'s learning journey today.'}
        </Text>
        
        {!pendingVerification ? (
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
              
              <View>
                <Text className="text-slate-700 font-bold mb-2 ml-1">Password</Text>
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
              className="bg-brand-accent py-4 rounded-2xl w-full items-center justify-center flex-row shadow-lg shadow-brand-accent/30 mt-10 active:opacity-90"
              onPress={onSignUpPress}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Create Account</Text>}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="text-slate-500">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-brand-accent font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <TextInput
                value={code}
                placeholder="000000"
                onChangeText={setCode}
                keyboardType="number-pad"
                className="text-center text-4xl font-bold text-brand-primary"
                maxLength={6}
                placeholderTextColor="#cbd5e1"
              />
            </View>

            <TouchableOpacity 
              className="bg-brand-success py-4 rounded-2xl w-full items-center justify-center flex-row shadow-lg shadow-brand-success/30 active:opacity-90"
              onPress={onPressVerify}
              disabled={loading}
            >
               {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Verify & Finish</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              className="mt-6 items-center" 
              onPress={() => setPendingVerification(false)}
            >
              <Text className="text-slate-500">Entered wrong email? Go back</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
