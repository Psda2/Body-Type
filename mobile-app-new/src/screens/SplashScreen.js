import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing } from '../utils/colors';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.tagline}>
        Your Personal Sri Lankan{'\n'}Health & Nutrition Guide
      </Text>
      <View style={styles.loadingDots}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundCream,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  logoContainer: {
    width: 180,
    height: 180,
    marginBottom: spacing.xl,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    fontSize: typography.md,
    color: colors.primaryGreen,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: typography.medium,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: spacing['2xl'],
    // gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    marginRight: 8,
    borderRadius: 5,
    backgroundColor: colors.primaryGreen,
    opacity: 0.4,
  },
  dot1: { opacity: 0.9 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.3 },
});

export default SplashScreen;
