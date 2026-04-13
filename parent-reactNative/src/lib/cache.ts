import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from "react-native";

const createTokenCache = () => {
  return {
    async getToken(key: string) {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          console.log(`${key} was used 🔐 \n`);
        } else {
          console.log("No values stored under key: " + key);
        }
        return item;
      } catch (error) {
        console.error("AsyncStorage get item error: ", error);
        await AsyncStorage.removeItem(key);
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        return AsyncStorage.setItem(key, value);
      } catch (err) {
        return;
      }
    },
  };
};

export const tokenCache =
  Platform.OS !== "web" ? createTokenCache() : undefined;
