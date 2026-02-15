import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const ProfileCard = ({ userName, userEmail, stats, onEditPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
        
        {onEditPress && (
          <TouchableOpacity onPress={onEditPress} style={styles.editButton}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsContainer}>
        {stats && stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryGreen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.cardWhite,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: typography.sm,
    color: colors.cardWhite,
    opacity: 0.9,
  },
  editButton: {
    padding: spacing.sm,
  },
  editIcon: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '18%',
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.cardWhite,
    opacity: 0.9,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.cardWhite,
  },
});

export default ProfileCard;
