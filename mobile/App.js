import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import PurchaseForm from './src/components/PurchaseForm';
import Outbox from './src/components/Outbox';
import FarmerDirectory from './src/components/FarmerDirectory';
import LoginScreen from './src/components/LoginScreen';
import { lightTheme, darkTheme } from './src/utils/theme';
import AnimatedSplash from './src/components/AnimatedSplash';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash visible until our animated splash is mounted.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [activeTab, setActiveTab] = useState('FORM');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedFarmerForEntry, setSelectedFarmerForEntry] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const styles = getStyles(theme);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('@jwt_token');
      const guest = await AsyncStorage.getItem('@is_guest');
      if (token) {
        setIsAuthenticated(true);
        setIsGuest(false);
      } else if (guest === 'true') {
        setIsAuthenticated(true);
        setIsGuest(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Hand over from the native splash to the animated one.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleGuestLogin = async () => {
    await AsyncStorage.setItem('@is_guest', 'true');
    setIsGuest(true);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@jwt_token');
    await AsyncStorage.removeItem('@is_guest');
    setIsGuest(false);
    setIsAuthenticated(false);
  };

  const handleFarmerSelectForPurchase = (farmer) => {
    setSelectedFarmerForEntry(farmer);
    setActiveTab('FORM');
  };

  if (showSplash) {
    return <AnimatedSplash onFinish={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen 
        onLoginSuccess={() => {
          setIsGuest(false);
          setIsAuthenticated(true);
        }} 
        onGuestLogin={handleGuestLogin}
        theme={theme} 
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      
      <View style={styles.header}>
        <Text style={styles.headerText}>Kuapa Kokoo Data Collection</Text>
        {isGuest ? (
          <TouchableOpacity 
            onPress={handleLogout}
            style={{ position: 'absolute', right: 16, top: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
          >
            <Feather name="log-in" size={14} color={theme.accent} style={{ marginRight: 4 }} />
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>LOG IN</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={handleLogout}
            style={{ position: 'absolute', right: 20, top: 16 }}
          >
            <Feather name="log-out" size={20} color={theme.accent} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {activeTab === 'FORM' ? (
          <PurchaseForm 
            onSaveComplete={() => setActiveTab('OUTBOX')} 
            theme={theme} 
            initialFarmer={selectedFarmerForEntry}
          />
        ) : activeTab === 'FARMERS' ? (
          <FarmerDirectory 
            onSelectFarmerForPurchase={handleFarmerSelectForPurchase}
            theme={theme}
          />
        ) : (
          <Outbox theme={theme} />
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setActiveTab('FORM')}
          activeOpacity={0.7}
        >
          <Feather name="edit-3" size={20} color={activeTab === 'FORM' ? theme.activeTab : theme.inactiveTab} style={styles.tabIcon} />
          <Text style={[styles.tabText, activeTab === 'FORM' && styles.activeTabText]}>Entry Form</Text>
          {activeTab === 'FORM' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setActiveTab('FARMERS')}
          activeOpacity={0.7}
        >
          <Feather name="users" size={20} color={activeTab === 'FARMERS' ? theme.activeTab : theme.inactiveTab} style={styles.tabIcon} />
          <Text style={[styles.tabText, activeTab === 'FARMERS' && styles.activeTabText]}>Farmers</Text>
          {activeTab === 'FARMERS' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setActiveTab('OUTBOX')}
          activeOpacity={0.7}
        >
          <Feather name="upload-cloud" size={20} color={activeTab === 'OUTBOX' ? theme.activeTab : theme.inactiveTab} style={styles.tabIcon} />
          <Text style={[styles.tabText, activeTab === 'OUTBOX' && styles.activeTabText]}>Outbox</Text>
          {activeTab === 'OUTBOX' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { 
    padding: 20, 
    paddingTop: 16,
    backgroundColor: theme.primary, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.shadow,
    elevation: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  headerText: { color: theme.accent, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  content: { flex: 1 },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: theme.tabBar,
    borderTopWidth: 1,
    borderColor: theme.border,
    elevation: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    paddingBottom: 8
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabIcon: { marginBottom: 4 },
  tabText: { color: theme.inactiveTab, fontWeight: '700', fontSize: 11 },
  activeTabText: { color: theme.activeTab },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: '40%',
    height: 3,
    backgroundColor: theme.activeTab,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3
  }
});
