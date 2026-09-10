import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const OUTBOX_KEY = '@kuapa_kokoo_outbox';

export const saveSessionToOutbox = async (sessionData) => {
  try {
    const existing = await AsyncStorage.getItem(OUTBOX_KEY);
    const outbox = existing ? JSON.parse(existing) : [];
    
    const newSession = {
      ...sessionData,
      local_id: uuidv4(),
      saved_at: new Date().toISOString(),
    };
    
    outbox.push(newSession);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    return newSession;
  } catch (e) {
    console.error("Error saving to outbox", e);
    throw e;
  }
};

export const getOutbox = async () => {
  try {
    const existing = await AsyncStorage.getItem(OUTBOX_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error("Error getting outbox", e);
    return [];
  }
};

export const clearOutbox = async () => {
  try {
    await AsyncStorage.removeItem(OUTBOX_KEY);
  } catch (e) {
    console.error("Error clearing outbox", e);
  }
};

export const removeSessionFromOutbox = async (localId) => {
  try {
    const existing = await AsyncStorage.getItem(OUTBOX_KEY);
    let outbox = existing ? JSON.parse(existing) : [];
    outbox = outbox.filter(s => s.local_id !== localId);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  } catch (e) {
    console.error("Error removing from outbox", e);
  }
};

const FARMERS_KEY = '@kuapa_kokoo_farmers';

export const saveFarmersToLocal = async (farmers) => {
  try {
    await AsyncStorage.setItem(FARMERS_KEY, JSON.stringify(farmers));
  } catch (e) {
    console.error("Error saving farmers to local", e);
    throw e;
  }
};

export const getLocalFarmers = async () => {
  try {
    const existing = await AsyncStorage.getItem(FARMERS_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error("Error getting local farmers", e);
    return [];
  }
};
