import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  Modal, ActivityIndicator, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { API_URL } from '../config';
import { getLocalFarmers } from '../utils/storage';

export default function FarmerDirectory({ onSelectFarmerForPurchase, theme }) {

  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Detail Modal
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerHistory, setFarmerHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@jwt_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/farmers/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFarmers(data);
      } else {
        const cached = await getLocalFarmers();
        setFarmers(cached);
      }
    } catch (e) {
      console.log('Error fetching mobile farmers directory, fallback to cached:', e);
      const cached = await getLocalFarmers();
      setFarmers(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const openFarmerHistory = async (farmer) => {
    setSelectedFarmer(farmer);
    setFarmerHistory(null);
    setLoadingHistory(true);

    try {
      const token = await AsyncStorage.getItem('@jwt_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/farmers/${farmer.id}/lifetime_history/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFarmerHistory(data);
      }
    } catch (err) {
      console.log('Error fetching detailed history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredFarmers = farmers.filter(f => 
    (f.name && f.name.toLowerCase().includes(search.toLowerCase())) ||
    (f.kk_id_num && f.kk_id_num.toLowerCase().includes(search.toLowerCase())) ||
    (f.society && f.society.toLowerCase().includes(search.toLowerCase()))
  );

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      
      {/* Search Header */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search farmer name, KK-ID or society..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Farmers List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading Farmers Database...</Text>
        </View>
      ) : filteredFarmers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="users" size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Farmers Found</Text>
          <Text style={styles.emptySub}>Try searching with a different KK-ID or name.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFarmers}
          keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.farmerCard} 
              onPress={() => openFarmerHistory(item)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.farmerName}>{item.name}</Text>
                <Text style={styles.farmerSub}>
                  KK-ID: <Text style={styles.kkIdText}>{item.kk_id_num || 'N/A'}</Text>
                </Text>
                <Text style={styles.farmerSociety}>
                  {item.society || 'No Society'} • {item.zone || 'No Zone'}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.volText}>{item.volume ? `${item.volume.toLocaleString()} kg` : '0 kg'}</Text>
                <Text style={styles.bagsText}>{item.bags ? `${item.bags} bags` : '0 bags'}</Text>
                <Feather name="chevron-right" size={16} color="#94a3b8" style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ===== FARMER HISTORY MODAL ===== */}
      <Modal
        visible={selectedFarmer !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedFarmer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            {selectedFarmer && (
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFarmerName}>{selectedFarmer.name}</Text>
                  <Text style={styles.modalKkId}>KK-ID: {selectedFarmer.kk_id_num || 'N/A'}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeBtn} 
                  onPress={() => setSelectedFarmer(null)}
                >
                  <Feather name="x" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Modal Body */}
            <ScrollView style={{ padding: 16 }}>
              {loadingHistory ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={{ marginTop: 10, color: '#64748b', fontWeight: '600' }}>Fetching Lifetime History...</Text>
                </View>
              ) : selectedFarmer && (
                <View style={{ gap: 16 }}>
                  
                  {/* Summary Grid */}
                  <View style={styles.summaryGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>LIFETIME VOLUME</Text>
                      <Text style={[styles.statVal, { color: '#059669' }]}>
                        {(farmerHistory?.summary?.total_kilos || selectedFarmer.volume || 0).toLocaleString()} kg
                      </Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>TOTAL BAGS</Text>
                      <Text style={[styles.statVal, { color: '#2563eb' }]}>
                        {farmerHistory?.summary?.total_bags || selectedFarmer.bags || Math.round((selectedFarmer.volume || 0)/62.5)} bags
                      </Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>PAID OUT</Text>
                      <Text style={[styles.statVal, { color: '#1e293b' }]}>
                        GH₵ {(farmerHistory?.summary?.total_amount_ghc || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>BONUS EARNED</Text>
                      <Text style={[styles.statVal, { color: '#d97706' }]}>
                        GH₵ {(farmerHistory?.summary?.bonus_entitled || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  </View>

                  {/* Profile info */}
                  <View style={styles.bioCard}>
                    <Text style={styles.bioTitle}>Farmer Bio Details</Text>
                    <Text style={styles.bioText}>Society: <Text style={styles.bioBold}>{selectedFarmer.society || 'N/A'}</Text></Text>
                    <Text style={styles.bioText}>Zone: <Text style={styles.bioBold}>{selectedFarmer.zone || 'N/A'}</Text></Text>
                    <Text style={styles.bioText}>Ghana Card: <Text style={styles.bioBold}>{selectedFarmer.id_card_number || 'N/A'}</Text></Text>
                    <Text style={styles.bioText}>Phone: <Text style={styles.bioBold}>{selectedFarmer.phone_numbers || 'N/A'}</Text></Text>
                    <Text style={styles.bioText}>Farm Field Size: <Text style={styles.bioBold}>{selectedFarmer.field_size ? `${selectedFarmer.field_size} Ha` : 'N/A'}</Text></Text>
                  </View>

                  {/* Action Button: Create New Purchase */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      const f = selectedFarmer;
                      setSelectedFarmer(null);
                      if (onSelectFarmerForPurchase) {
                        onSelectFarmerForPurchase(f);
                      }
                    }}
                  >
                    <Feather name="plus-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>New Purchase Entry for {selectedFarmer.name.split(' ')[0]}</Text>
                  </TouchableOpacity>

                  {/* Purchases List */}
                  <Text style={styles.sectionTitle}>Waybill Delivery Records</Text>
                  {(!farmerHistory?.records || farmerHistory.records.length === 0) ? (
                    <Text style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>No individual waybills logged yet.</Text>
                  ) : (
                    farmerHistory.records.map((r, i) => (
                      <View key={i} style={styles.recordRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '700', color: '#1e293b', fontSize: 14 }}>Waybill #{r.waybill_no || r.id}</Text>
                          <Text style={{ color: '#64748b', fontSize: 12 }}>{r.date} • {r.season}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontWeight: '800', color: '#059669', fontSize: 14 }}>{r.kilos} kg</Text>
                          <Text style={{ fontWeight: '700', color: '#d97706', fontSize: 12 }}>Bonus: GH₵ {r.bonus_ghc}</Text>
                        </View>
                      </View>
                    ))
                  )}

                  <View style={{ height: 20 }} />
                </View>
              )}
            </ScrollView>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 16 },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600' },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '700', color: '#475569' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: { color: theme.accent, fontSize: 18, fontWeight: '800' },
  farmerName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  farmerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  kkIdText: { fontWeight: '700', color: theme.primary },
  farmerSociety: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  volText: { fontSize: 14, fontWeight: '800', color: '#059669' },
  bagsText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden'
  },
  modalHeader: {
    backgroundColor: theme.primary,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalFarmerName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  modalKkId: { fontSize: 13, color: theme.accent, fontWeight: '700', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  statVal: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  bioCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4
  },
  bioTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  bioText: { fontSize: 13, color: '#64748b' },
  bioBold: { fontWeight: '700', color: '#334155' },
  actionBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  }
});
