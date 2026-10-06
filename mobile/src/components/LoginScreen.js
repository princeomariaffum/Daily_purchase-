import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export default function LoginScreen({ onLoginSuccess, onGuestLogin, theme }) {
  const styles = getStyles(theme);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/token/`, { username, password });
      await AsyncStorage.setItem('@jwt_token', response.data.access);
      await AsyncStorage.removeItem('@is_guest');
      onLoginSuccess();
    } catch (e) {
      if (!e.response) {
        Alert.alert("Network Error", `Cannot connect to server at ${API_URL}. Ensure your phone is connected to the same Wi-Fi network.`);
      } else {
        Alert.alert("Login Failed", "Invalid credentials. Please check your username and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.card}>
        <Image source={require('../../assets/images/kuapa-logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>Kuapa Kokoo</Text>
        <Text style={styles.subtitle}>Field Data Collection</Text>
        
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Username" 
            placeholderTextColor={theme.textSecondary}
            value={username} 
            onChangeText={setUsername} 
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Feather name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor={theme.textSecondary}
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(prev => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryLight} />
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>SIGN IN</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.guestBtn}
              onPress={onGuestLogin}
              activeOpacity={0.8}
            >
              <Feather name="wifi-off" size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={styles.guestBtnText}>USE WITHOUT LOGIN (OFFLINE)</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 24 },
  card: { 
    backgroundColor: theme.card, 
    padding: 32, 
    borderRadius: 24, 
    elevation: 8,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20
  },
  logoImage: { width: 96, height: 96, borderRadius: 22, alignSelf: 'center', marginBottom: 16 },
  logoBox: { 
    width: 80, 
    height: 80, 
    backgroundColor: theme.accent, 
    borderRadius: 40, 
    alignSelf: 'center', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16,
    elevation: 4,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  logoText: { color: theme.primary, fontSize: 40, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', color: theme.textPrimary },
  subtitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', color: theme.primaryLight, marginBottom: 32 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: theme.inputText, fontWeight: '500' },
  loginBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    elevation: 4,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6
  },
  loginBtnText: { color: theme.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  loadingContainer: { marginTop: 16, paddingVertical: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { marginHorizontal: 12, color: theme.textSecondary, fontWeight: 'bold', fontSize: 12 },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 2
  },
  guestBtnText: { color: theme.primary, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 }
});
