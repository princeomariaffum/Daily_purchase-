import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet } from 'react-native';

const SPLASH_GREEN = '#085a1e';
const SPLASH_YELLOW = '#f5d312';

// Branded splash shown on app start: logo fades/scales in, holds, then fades out.
export default function AnimatedSplash({ onFinish, holdMs = 1200 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(holdMs),
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => onFinish && onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.Image
        source={require('../../assets/images/kuapa-logo.png')}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.title}>Kuapa Kokoo</Text>
        <Text style={styles.subtitle}>Field Data Collection</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SPLASH_GREEN, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 200, height: 200, borderRadius: 44, marginBottom: 28 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: SPLASH_YELLOW, fontSize: 15, fontWeight: '600', marginTop: 6, letterSpacing: 1 },
});
