import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, borderRadius } from '../utils/colors';

const SocialButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.socialButton} onPress={onPress}>
    <Text style={styles.socialIcon}>{icon}</Text>
    {/* In a real app, use actual Image logos for Google/Apple */}
  </TouchableOpacity>
);

const SocialLogin = () => {
  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Or</Text>
        <View style={styles.divider} />
      </View>
      
      <View style={styles.row}>
        <SocialButton icon="G" label="Google" />
        <SocialButton icon="" label="Apple" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderColor,
  },
  dividerText: {
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    // gap: spacing.lg,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: spacing.sm,
  },
  socialIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default SocialLogin;
