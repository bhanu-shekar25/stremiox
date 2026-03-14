import { StremioAPIStore } from 'stremio-api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = {
  getJSON: async (key: string) => {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  },
  setJSON: async (key: string, val: any) =>
    AsyncStorage.setItem(key, JSON.stringify(val)),
};

export const APIStore = new StremioAPIStore({ storage }); 
