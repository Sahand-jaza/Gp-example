import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-between py-12">
        <View className="items-center mt-10">
          <View className="w-24 h-24 bg-brand-accent/10 rounded-3xl items-center justify-center mb-8">
            <Ionicons name="school" size={48} color="#3b82f6" />
          </View>
          <Text className="text-4xl font-bold text-brand-primary text-center leading-tight">
            Education Monitoring Made Simple
          </Text>
          <Text className="text-lg text-slate-500 text-center mt-6 leading-relaxed">
            Stay connected with your child's learning journey and track their academic progress in real-time.
          </Text>
        </View>

        <View className="w-full space-y-4">
          <TouchableOpacity 
            className="bg-brand-accent py-4 rounded-2xl w-full items-center shadow-lg shadow-brand-accent/30 active:opacity-90"
            onPress={() => navigation.navigate('Login')}
          >
            <Text className="text-white font-bold text-lg">Sign In to Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-white border-2 border-slate-100 py-4 rounded-2xl w-full items-center active:bg-slate-50"
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text className="text-brand-primary font-bold text-lg">Create Parent Account</Text>
          </TouchableOpacity>

          <Text className="text-slate-400 text-center text-sm mt-4">
            By continuing, you agree to our Terms of Service.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
