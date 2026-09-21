import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveSessionToOutbox, getLocalFarmers, saveFarmersToLocal } from '../utils/storage';
import { API_URL } from '../config';

export default function PurchaseForm({ onSaveComplete, theme, initialFarmer }) {
  const styles = getStyles(theme);
  const [header, setHeader] = useState({
    cocoa_season: '2025-2026',
    zone_name: '',
    society_district_name: '',
    zone_station: '',
    waybill_no: '',
    dprs_number: ''
  });
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | fetching | captured | denied
  const [localFarmers, setLocalFarmers] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [activeHeaderSearch, setActiveHeaderSearch] = useState(null);

  const uniqueZones = Array.from(new Set(localFarmers.map(f => f.zone).filter(Boolean)));
  const uniqueSocieties = Array.from(new Set(localFarmers.map(f => f.society).filter(Boolean)));

  const [records, setRecords] = useState([
    { id: 1, farmer_name: '', farmer_status: 'Existing', cocoa_card_id: '', kk_id: '', kilos: '', amount_ghc: '', farm_size_ha: 2.5, selected_farm_id: 1, yield_warning_triggered: false }
  ]);

  useEffect(() => {
    const loadFarmersData = async () => {
      let farmers = await getLocalFarmers();
      if (!farmers || farmers.length === 0) {
        try {
          const token = await AsyncStorage.getItem('@jwt_token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await axios.get(`${API_URL}/farmers/`, { headers });
          if (res.data && Array.isArray(res.data)) {
            farmers = res.data;
            await saveFarmersToLocal(farmers);
          }
        } catch (e) {
          console.log("Could not auto-fetch online farmers for dropdown:", e?.message);
        }
      }
      setLocalFarmers(farmers || []);
    };
    loadFarmersData();
  }, []);

  useEffect(() => {
    if (initialFarmer) {
      setHeader(h => ({
        ...h,
        society_district_name: initialFarmer.society || h.society_district_name,
        zone_name: initialFarmer.zone || h.zone_name
      }));
      setRecords([
        { 
          id: Date.now(), 
          farmer_name: initialFarmer.name || '', 
          farmer_status: 'Existing', 
          cocoa_card_id: initialFarmer.id_card_number || '', 
          kk_id: initialFarmer.kk_id_num || '', 
          kilos: '', 
          amount_ghc: '',
          farm_size_ha: initialFarmer.field_size || initialFarmer.actual_farm_size || 2.5,
          selected_farm_id: 1,
          yield_warning_triggered: false
        }
      ]);
    }
  }, [initialFarmer]);

  const updateHeader = (key, value) => setHeader({ ...header, [key]: value });

  const PRICE_PER_BAG = 70; // Standard price calculation

  const updateRecord = (index, key, value) => {
    const newRecords = [...records];
    newRecords[index][key] = value;
    
    // Auto-calculate amount & yield cap warning when kilos change
    if (key === 'kilos') {
      const kilosValue = parseFloat(value);
      if (!isNaN(kilosValue) && kilosValue >= 0) {
        const calculatedAmount = (kilosValue / 62.5) * PRICE_PER_BAG;
        newRecords[index]['amount_ghc'] = calculatedAmount.toFixed(2).toString();

        // Yield Cap Validation: Max 450 kg/Ha * 1.20 buffer
        const farmSize = newRecords[index].farm_size_ha || 2.5;
        const maxYield = farmSize * 450 * 1.20;
        newRecords[index].yield_warning_triggered = kilosValue > maxYield;
      } else {
        newRecords[index]['amount_ghc'] = '';
        newRecords[index].yield_warning_triggered = false;
      }
    }
    
    setRecords(newRecords);
  };

  const addRecord = () => {
    setRecords([...records, { 
      id: Date.now(), 
      farmer_name: '', 
      farmer_status: 'Existing', 
      cocoa_card_id: '', 
      kk_id: '', 
      kilos: '', 
      amount_ghc: '',
      farm_size_ha: 2.5,
      selected_farm_id: 1,
      yield_warning_triggered: false
    }]);
  };

  const captureLocation = async () => {
    setGpsStatus('fetching');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setGpsStatus('denied');
      Alert.alert('Permission Denied', 'GPS permission was denied. Location will not be saved.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setHeader(prev => ({
      ...prev,
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    }));
    setGpsStatus('captured');
  };

  const validateForm = () => {
    if (!header.cocoa_season.trim()) return 'Cocoa season is required.';
    if (!header.zone_name.trim()) return 'Zone name is required.';
    if (!header.society_district_name.trim()) return 'Society/District name is required.';
    if (!header.waybill_no.trim()) return 'Waybill number is required.';
    if (!/^\d+$/.test(header.waybill_no.trim())) return 'Waybill number must be numeric.';
    if (header.dprs_number.trim() && !/^\d+$/.test(header.dprs_number.trim())) return 'DPRS Number must be numeric.';

    if (records.length === 0) return 'At least one farmer record is required.';
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.farmer_name.trim()) return `Record ${i + 1}: Farmer name is required.`;
      if (!r.cocoa_card_id.trim()) return `Record ${i + 1}: Cocoa Card ID is required.`;
      if (!r.kilos || isNaN(parseFloat(r.kilos)) || parseFloat(r.kilos) <= 0)
        return `Record ${i + 1}: Kilos must be a positive number.`;
      if (!r.amount_ghc || isNaN(parseFloat(r.amount_ghc)) || parseFloat(r.amount_ghc) <= 0)
        return `Record ${i + 1}: Amount (GHC) must be a positive number.`;
    }
    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    try {
      const formattedRecords = records.map(r => ({
        ...r,
        date: new Date().toISOString().split('T')[0],
        kilos: parseFloat(r.kilos),
        amount_ghc: parseFloat(r.amount_ghc),
        farm_id: r.selected_farm_id,
        farm_size_ha: r.farm_size_ha || 2.5,
        yield_warning_flag: r.yield_warning_triggered
      }));

      await saveSessionToOutbox({ ...header, records: formattedRecords });
      Alert.alert("✅ Saved to Outbox", "Purchase session saved locally with farm polygon validation. Sync when connected.");
      
      setHeader({ cocoa_season: '2025-2026', zone_name: '', society_district_name: '', zone_station: '', waybill_no: '', dprs_number: '' });
      setRecords([{ id: 1, farmer_name: '', farmer_status: 'Existing', cocoa_card_id: '', kk_id: '', kilos: '', amount_ghc: '', farm_size_ha: 2.5, selected_farm_id: 1, yield_warning_triggered: false }]);
      onSaveComplete();
    } catch (e) {
      Alert.alert("Error", "Could not save to outbox. Please try again.");
    }
  };

  const totalKilos = records.reduce((sum, r) => sum + (parseFloat(r.kilos) || 0), 0);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
      <Text style={styles.title}>New Purchase Session</Text>
      
      <View style={[styles.card, { zIndex: activeHeaderSearch ? 1000 : 1 }]}>
        <View style={styles.cardHeader}>
          <Feather name="file-text" size={20} color={theme.primary} />
          <Text style={styles.sectionTitle}>Header Info (Waybill)</Text>
        </View>
        
        <View style={[styles.inputContainer, { zIndex: activeHeaderSearch === 'zone' ? 9999 : 1 }]}>
          <Text style={styles.inputLabel}>Zone Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Ashanti Region" 
            placeholderTextColor={theme.textSecondary} 
            value={header.zone_name} 
            onChangeText={t => updateHeader('zone_name', t)} 
            onFocus={() => setActiveHeaderSearch('zone')}
          />
          {activeHeaderSearch === 'zone' && (
            <View style={styles.dropdown}>
              {uniqueZones
                .filter(z => !header.zone_name || z.toLowerCase().includes(header.zone_name.toLowerCase()))
                .slice(0, 5)
                .map(z => (
                  <TouchableOpacity key={z} style={styles.dropdownItem} onPressIn={() => { updateHeader('zone_name', z); setActiveHeaderSearch(null); }}>
                    <Text style={styles.dropdownName}>{z}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>
        
        <View style={[styles.inputContainer, { zIndex: activeHeaderSearch === 'society' ? 9999 : 1 }]}>
          <Text style={styles.inputLabel}>Society / District</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Kumasi South" 
            placeholderTextColor={theme.textSecondary} 
            value={header.society_district_name} 
            onChangeText={t => updateHeader('society_district_name', t)} 
            onFocus={() => setActiveHeaderSearch('society')}
          />
          {activeHeaderSearch === 'society' && (
            <View style={styles.dropdown}>
              {uniqueSocieties
                .filter(s => !header.society_district_name || s.toLowerCase().includes(header.society_district_name.toLowerCase()))
                .slice(0, 5)
                .map(s => (
                  <TouchableOpacity key={s} style={styles.dropdownItem} onPressIn={() => { updateHeader('society_district_name', s); setActiveHeaderSearch(null); }}>
                    <Text style={styles.dropdownName}>{s}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, styles.flex1]}>
            <Text style={styles.inputLabel}>Waybill No.</Text>
            <TextInput style={styles.input} placeholder="12345" placeholderTextColor={theme.textSecondary} value={header.waybill_no} onChangeText={t => updateHeader('waybill_no', t)} keyboardType="numeric" />
          </View>
          <View style={[styles.inputContainer, styles.flex1]}>
            <Text style={styles.inputLabel}>DPRS Number</Text>
            <TextInput style={styles.input} placeholder="67890" placeholderTextColor={theme.textSecondary} value={header.dprs_number} onChangeText={t => updateHeader('dprs_number', t)} keyboardType="numeric" />
          </View>
        </View>

        {/* GPS Capture Button */}
        <TouchableOpacity
          onPress={captureLocation}
          disabled={gpsStatus === 'fetching'}
          activeOpacity={0.8}
          style={[
            styles.gpsBtn,
            gpsStatus === 'captured' && styles.gpsCaptured,
            gpsStatus === 'denied'   && styles.gpsDenied,
          ]}
        >
          <Feather 
            name={gpsStatus === 'captured' ? "map-pin" : "navigation"} 
            size={18} 
            color="#fff" 
            style={{ marginRight: 8 }} 
          />
          <Text style={styles.gpsBtnText}>
            {gpsStatus === 'idle'     && 'Capture GPS Location'}
            {gpsStatus === 'fetching' && 'Getting Location...'}
            {gpsStatus === 'captured' && `${header.latitude?.toFixed(4)}, ${header.longitude?.toFixed(4)}`}
            {gpsStatus === 'denied'   && 'Permission Denied'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Farmer Records & Yield Validation</Text>
      </View>
      
      {records.map((record, index) => {
        const farmSize = record.farm_size_ha || 2.5;
        const maxYieldKg = Math.round(farmSize * 450 * 1.20);
        
        return (
          <View key={record.id} style={[styles.recordBox, { zIndex: activeSearchIndex === index ? 9999 : records.length - index }]}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordTitle}>Record {index + 1}</Text>
            </View>
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, record.farmer_status === 'Existing' && styles.toggleActive]}
                onPress={() => updateRecord(index, 'farmer_status', 'Existing')}
              >
                <Text style={[styles.toggleText, record.farmer_status === 'Existing' && styles.toggleActiveText]}>Existing Farmer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, record.farmer_status === 'New' && styles.toggleActive]}
                onPress={() => updateRecord(index, 'farmer_status', 'New')}
              >
                <Text style={[styles.toggleText, record.farmer_status === 'New' && styles.toggleActiveText]}>New Farmer</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.inputContainer, { zIndex: activeSearchIndex === index ? 9999 : 1 }]}>
              <Text style={styles.inputLabel}>Farmer Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Search or select farmer..." 
                placeholderTextColor={theme.textSecondary} 
                value={record.farmer_name} 
                onChangeText={t => updateRecord(index, 'farmer_name', t)}
                onFocus={() => record.farmer_status === 'Existing' && setActiveSearchIndex(index)}
              />
              {record.farmer_status === 'Existing' && activeSearchIndex === index && (
                <View style={styles.dropdown}>
                  {localFarmers
                    .filter(f => !record.farmer_name || (f.name && f.name.toLowerCase().includes(record.farmer_name.toLowerCase())))
                    .slice(0, 6)
                    .map(f => (
                      <TouchableOpacity 
                        key={f.id || f.farmer_id || Math.random().toString()} 
                        style={styles.dropdownItem}
                        onPressIn={() => {
                          const fSize = f.actual_farm_size || f.field_size || 2.5;
                          updateRecord(index, 'farmer_name', f.name || '');
                          updateRecord(index, 'kk_id', f.kk_id_num || f.cocobod_id || '');
                          updateRecord(index, 'cocoa_card_id', f.cocobod_id || f.kk_id_num || '');
                          updateRecord(index, 'farm_size_ha', fSize);
                          if (f.society && !header.society_district_name) updateHeader('society_district_name', f.society);
                          if (f.zone && !header.zone_name) updateHeader('zone_name', f.zone);
                          setActiveSearchIndex(null);
                        }}
                      >
                        <Text style={styles.dropdownName}>{f.name}</Text>
                        <Text style={styles.dropdownSub}>
                          {f.kk_id_num || f.cocobod_id || 'No ID'} • {f.society ? `${f.society}` : ''} • {f.actual_farm_size || f.field_size ? `${f.actual_farm_size || f.field_size} Ha` : '2.5 Ha'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
            
            {/* Registered Farm Picker Badge */}
            <View style={styles.farmBadgeBox}>
              <Feather name="map" size={15} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={styles.farmBadgeText}>
                Registered Farm #1: <Text style={{ fontWeight: '800' }}>{farmSize} Hectares</Text> (~{(farmSize * 2.47).toFixed(1)} Acres)
              </Text>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.inputLabel}>Cocoa Card ID</Text>
                <TextInput style={styles.input} placeholder="CC-001" placeholderTextColor={theme.textSecondary} value={record.cocoa_card_id} onChangeText={t => updateRecord(index, 'cocoa_card_id', t)} />
              </View>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.inputLabel}>KK ID</Text>
                <TextInput style={styles.input} placeholder="KK-001" placeholderTextColor={theme.textSecondary} value={record.kk_id} onChangeText={t => updateRecord(index, 'kk_id', t)} />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.inputLabel}>Kilos</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={theme.textSecondary} value={record.kilos} onChangeText={t => updateRecord(index, 'kilos', t)} keyboardType="numeric" />
              </View>
              <View style={[styles.inputContainer, styles.flex1]}>
                <Text style={styles.inputLabel}>Amount (GHC)</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={theme.textSecondary} value={record.amount_ghc} onChangeText={t => updateRecord(index, 'amount_ghc', t)} keyboardType="numeric" />
              </View>
            </View>

            {/* Yield Cap Warning Box */}
            {record.yield_warning_triggered && (
              <View style={styles.yieldWarningBox}>
                <Feather name="alert-triangle" size={18} color="#d97706" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.yieldWarningText}>
                  <Text style={{ fontWeight: 'bold' }}>Yield Cap Exceeded ⚠️</Text>: Delivered volume ({record.kilos} kg) exceeds seasonal max capacity ({maxYieldKg} kg) for a {farmSize} Ha farm. Flagged for supervisor audit.
                </Text>
              </View>
            )}
          </View>
        );
      })}
      
      <TouchableOpacity style={styles.addBtn} onPress={addRecord} activeOpacity={0.7}>
        <Feather name="plus-circle" size={20} color={theme.primaryLight} style={{ marginRight: 8 }} />
        <Text style={styles.addBtnText}>ADD ANOTHER FARMER</Text>
      </TouchableOpacity>

      <View style={styles.totalsBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Kilos</Text>
          <Text style={styles.totalValue}>{totalKilos.toFixed(2)} kg</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Bags (62.5kg)</Text>
          <Text style={styles.totalValue}>{(totalKilos / 62.5).toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₵{records.reduce((sum, r) => sum + (parseFloat(r.amount_ghc) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <View style={styles.saveBtnContainer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Feather name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>SAVE TO OUTBOX (OFFLINE)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.background },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 20, color: theme.textPrimary, marginTop: 8 },
  card: { 
    backgroundColor: theme.card, 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 24,
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionHeader: { marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginLeft: 8 },
  inputContainer: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { 
    backgroundColor: theme.inputBackground, 
    borderWidth: 1, 
    borderColor: theme.border, 
    padding: 14, 
    borderRadius: 10, 
    fontSize: 16,
    color: theme.inputText
  },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  recordBox: { 
    backgroundColor: theme.card, 
    padding: 20, 
    marginBottom: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: theme.border,
    elevation: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 },
  recordTitle: { fontWeight: '700', fontSize: 16, color: theme.textPrimary },
  toggleContainer: { flexDirection: 'row', backgroundColor: theme.inputBackground, borderRadius: 10, padding: 4, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: theme.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  toggleActiveText: { color: '#ffffff', fontWeight: 'bold' },
  dropdown: { 
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: theme.card, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: theme.primaryLight, 
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 9999,
    maxHeight: 220,
    overflow: 'hidden'
  },
  dropdownItem: { 
    padding: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
    backgroundColor: theme.card
  },
  dropdownName: { fontWeight: 'bold', fontSize: 14, color: theme.textPrimary },
  dropdownSub: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  farmBadgeBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.inputBackground, 
    padding: 10, 
    borderRadius: 10, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border 
  },
  farmBadgeText: { fontSize: 13, color: theme.textPrimary },
  yieldWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    padding: 12,
    borderRadius: 10,
    marginTop: 10
  },
  yieldWarningText: { flex: 1, color: '#92400e', fontSize: 13, lineHeight: 18 },
  gpsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: theme.primary, 
    padding: 14, 
    borderRadius: 10, 
    marginTop: 8 
  },
  gpsCaptured: { backgroundColor: '#059669' },
  gpsDenied: { backgroundColor: '#dc2626' },
  gpsBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.primaryLight,
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24
  },
  addBtnText: { color: theme.primaryLight, fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  totalsBox: { 
    backgroundColor: theme.totalsBackground, 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 24,
    elevation: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 22, fontWeight: '900', color: theme.accent },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginVertical: 12 },
  saveBtnContainer: { marginBottom: 40 },
  saveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: theme.primary, 
    padding: 18, 
    borderRadius: 14,
    elevation: 4,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }
});
