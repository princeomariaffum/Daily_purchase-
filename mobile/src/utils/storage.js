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

// Farmers Chunked Storage Constants
const FARMERS_META_KEY = '@kuapa_kokoo_farmers_meta';
const FARMERS_CHUNK_PREFIX = '@kuapa_kokoo_farmers_chunk_';
const CHUNK_SIZE = 150; // Keeps each row well under 2MB CursorWindow limit

export const saveFarmersToLocal = async (farmers) => {
  try {
    if (!Array.isArray(farmers)) return;

    // 1. Sanitize farmer objects to keep offline payload size small & performant
    const sanitizedFarmers = farmers.map(f => ({
      id: f.id,
      farmer_id: f.farmer_id || f.cocobod_id || f.kk_id_num,
      name: (f.name || `${f.first_name || ''} ${f.last_name || ''}`).trim(),
      first_name: f.first_name || '',
      last_name: f.last_name || '',
      cocobod_id: f.cocobod_id || f.kk_id_num || f.farmer_id || '',
      kk_id_num: f.kk_id_num || f.cocobod_id || f.farmer_id || '',
      contact: f.contact || f.phone_numbers || '',
      actual_farm_size: f.actual_farm_size || f.field_size || 0,
      society: f.society || f.district_name || '',
      zone: f.zone || f.zone_name_str || '',
    }));

    // 2. Clean up old chunks if any exist
    const oldMetaStr = await AsyncStorage.getItem(FARMERS_META_KEY);
    if (oldMetaStr) {
      try {
        const oldMeta = JSON.parse(oldMetaStr);
        const oldKeys = Array.from({ length: oldMeta.chunkCount }, (_, i) => `${FARMERS_CHUNK_PREFIX}${i}`);
        await AsyncStorage.multiRemove(oldKeys);
      } catch (err) {
        // ignore cleanup error
      }
    }
    // Remove legacy monolithic key if present
    await AsyncStorage.removeItem('@kuapa_kokoo_farmers').catch(() => {});

    // 3. Chunk farmers array
    const chunks = [];
    for (let i = 0; i < sanitizedFarmers.length; i += CHUNK_SIZE) {
      chunks.push(sanitizedFarmers.slice(i, i + CHUNK_SIZE));
    }

    // 4. Save chunks via multiSet
    const keyValuePairs = chunks.map((chunk, index) => [
      `${FARMERS_CHUNK_PREFIX}${index}`,
      JSON.stringify(chunk)
    ]);

    await AsyncStorage.multiSet(keyValuePairs);

    // 5. Save metadata
    await AsyncStorage.setItem(FARMERS_META_KEY, JSON.stringify({
      chunkCount: chunks.length,
      totalFarmers: sanitizedFarmers.length,
      updatedAt: new Date().toISOString()
    }));

  } catch (e) {
    console.error("Error saving farmers to local", e);
    throw e;
  }
};

export const getLocalFarmers = async () => {
  try {
    const metaStr = await AsyncStorage.getItem(FARMERS_META_KEY);
    if (!metaStr) {
      // Legacy single key fallback
      try {
        const legacyStr = await AsyncStorage.getItem('@kuapa_kokoo_farmers');
        return legacyStr ? JSON.parse(legacyStr) : [];
      } catch (legacyErr) {
        console.warn("Legacy farmers fetch failed or row too big:", legacyErr);
        return [];
      }
    }

    const meta = JSON.parse(metaStr);
    const chunkKeys = Array.from({ length: meta.chunkCount }, (_, i) => `${FARMERS_CHUNK_PREFIX}${i}`);
    
    const results = await AsyncStorage.multiGet(chunkKeys);
    let allFarmers = [];

    for (const [key, value] of results) {
      if (value) {
        const chunk = JSON.parse(value);
        allFarmers.push(...chunk);
      }
    }

    return allFarmers;
  } catch (e) {
    console.error("Error getting local farmers", e);
    return [];
  }
};
