import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getOutbox, removeSessionFromOutbox, saveFarmersToLocal, getLocalFarmers } from '../utils/storage';
import { API_URL } from '../config';

export default function Outbox({ theme }) {

  const styles = getStyles(theme);
  const [outbox, setOutbox] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [downloadingFarmers, setDownloadingFarmers] = useState(false);
  const [localFarmersCount, setLocalFarmersCount] = useState(0);

  const loadOutbox = async () => {
    const data = await getOutbox();
    setOutbox(data);
    const farmers = await getLocalFarmers();
    setLocalFarmersCount(farmers.length);
  };

  useEffect(() => {
    loadOutbox();
  }, []);

  const handleSyncFarmers = async () => {
    const token = await AsyncStorage.getItem('@jwt_token');
    if (!token) {
      Alert.alert("Login Required", "You are in Offline Guest mode. Please tap 'LOG IN' in the top bar when connected to download the latest farmers database.");
      return;
    }

    setDownloadingFarmers(true);
    try {
      const res = await axios.get(`${API_URL}/farmers/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await saveFarmersToLocal(res.data);
      setLocalFarmersCount(res.data.length);
      Alert.alert("Database Updated", `Successfully downloaded ${res.data.length} farmers for offline use.`);
    } catch (e) {
      console.log("Failed to sync farmers", e?.message);
      if (e.response && e.response.status === 401) {
        Alert.alert("Session Expired", "Your login session has expired. Please log out and log back in.");
      } else {
        Alert.alert("Sync Failed", "Could not download farmers database. Check connection.");
      }
    } finally {
      setDownloadingFarmers(false);
    }
  };

  const handleSync = async () => {
    if (outbox.length === 0) return;

    const token = await AsyncStorage.getItem('@jwt_token');
    if (!token) {
      Alert.alert("Login Required to Sync", "You collected this data in Guest mode. Please tap 'LOG IN' in the top right to sign in and upload your pending outbox records.");
      return;
    }
    
    setSyncing(true);
    let successCount = 0;
    
    for (const session of outbox) {
      try {
        const payload = { ...session };
        delete payload.local_id;
        delete payload.saved_at;
        
        if (payload.records) {
          payload.records = payload.records.map(r => ({
            ...r,
            date: r.date || new Date().toISOString().split('T')[0]
          }));
        }
        
        await axios.post(`${API_URL}/sessions/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await removeSessionFromOutbox(session.local_id);
        successCount++;
      } catch (error) {
        console.log("Failed to sync session", error?.message);
        if (!error.response) {
          Alert.alert("No Internet Connection", "Please connect to the internet to sync to the server.");
          setSyncing(false);
          loadOutbox();
          return;
        } else if (error.response.status === 401) {
          Alert.alert("Session Expired", "Your login session has expired. Please log out and log back in.");
          setSyncing(false);
          loadOutbox();
          return;
        } else if (error.response.status === 400) {
          Alert.alert("Data Error", "There is an error with the data formatting. Please contact support.");
        }
      }
    }
    
    setSyncing(false);
    loadOutbox();
    
    if (successCount === outbox.length) {
      Alert.alert("Sync Complete", "All sessions successfully sent to the server!");
    } else {
      Alert.alert("Sync Partial", `Synced ${successCount} out of ${outbox.length} sessions. Check connection.`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Outbox (Pending Sync)</Text>

      {/* Sync Farmers Database Button */}
      <View style={{ marginBottom: 20, backgroundColor: theme.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ backgroundColor: theme.toggleBg, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Feather name="database" size={20} color={theme.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 15, color: theme.textPrimary }}>Offline Farmers DB</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{localFarmersCount} farmers cached locally</Text>
          </View>
          <TouchableOpacity 
            style={{ backgroundColor: theme.primaryLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
            onPress={handleSyncFarmers}
            disabled={downloadingFarmers}
          >
            {downloadingFarmers ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="download-cloud" size={14} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>SYNC DB</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{outbox.length}</Text>
        </View>
        <Text style={styles.subtitle}>sessions waiting</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.refreshBtn} onPress={loadOutbox}>
          <Feather name="refresh-cw" size={16} color={theme.primaryLight} style={{ marginRight: 4 }} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {syncing && (
        <View style={styles.syncingBanner}>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.syncingText}>Syncing securely to server...</Text>
        </View>
      )}

      <FlatList
        data={outbox}
        keyExtractor={(item) => item.local_id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIconBox}>
              <Feather name="upload-cloud" size={24} color={theme.primaryLight} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Waybill: {item.waybill_no}</Text>
              <Text style={styles.cardSub}>Records: {item.records.length} Farmers</Text>
              <Text style={styles.cardDate}>{new Date(item.saved_at).toLocaleString()}</Text>
            </View>
            <View style={styles.statusDot} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="check-circle" size={48} color={theme.textSecondary} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>You're all caught up!</Text>
            <Text style={styles.emptySub}>No pending sessions in the outbox.</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.syncBtn, (outbox.length === 0 || syncing) && styles.syncBtnDisabled]} 
        onPress={handleSync} 
        disabled={outbox.length === 0 || syncing}
        activeOpacity={0.8}
      >
        <Feather name="server" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.syncBtnText}>{syncing ? "SYNCING..." : "SYNC TO SERVER NOW"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.background },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 20, color: theme.textPrimary, marginTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  badge: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  badgeText: { color: theme.accent, fontWeight: 'bold', fontSize: 14 },
  subtitle: { fontSize: 16, color: theme.textSecondary, fontWeight: '600' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  refreshText: { color: theme.primaryLight, fontWeight: '700', fontSize: 13 },
  syncingBanner: { flexDirection: 'row', backgroundColor: theme.primaryLight, padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  syncingText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { 
    flexDirection: 'row',
    backgroundColor: theme.card, 
    padding: 16, 
    marginBottom: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: theme.border,
    alignItems: 'center',
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  cardIconBox: { backgroundColor: theme.toggleBg, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontWeight: '800', fontSize: 16, color: theme.textPrimary, marginBottom: 4 },
  cardSub: { color: theme.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  cardDate: { color: theme.textSecondary, fontSize: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accent },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 15, color: theme.textSecondary },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.success,
    padding: 18,
    borderRadius: 12,
    elevation: 4,
    shadowColor: theme.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 10
  },
  syncBtnDisabled: { backgroundColor: theme.inactiveTab, shadowOpacity: 0, elevation: 0 },
  syncBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
