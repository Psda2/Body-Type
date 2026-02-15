import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const DailyDietCard = ({ onPress, todayMeals }) => {
  const mealCount = todayMeals ? Object.keys(todayMeals).length : 0;
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🍛</Text>
        <Text style={styles.title}>Daily Nutrition Plan</Text>
        
        {mealCount > 0 ? (
          <>
            <Text style={styles.subtitle}>
              {mealCount} Meals Planned
            </Text>
            <Text style={styles.mealPreview}>
              Next: {todayMeals?.lunch?.main || todayMeals?.dinner?.main || "Check your plan"}
            </Text>
          </>
        ) : (
          <Text style={styles.subtitle}>Tap to generate your plan</Text>
        )}

        <View style={styles.button}>
          <Text style={styles.buttonText}>{mealCount > 0 ? "View Today's Plan" : 'Create Plan'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
    backgroundColor: colors.primaryGreen,
    padding: spacing.lg,
  },
  content: {
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textWhite,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    marginBottom: 4,
  },
  subtitle: {
    color: '#C8E6C9',
    fontSize: typography.sm,
    marginBottom: 4,
  },
  mealPreview: {
    color: colors.textWhite,
    fontSize: typography.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.accentYellow,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.primaryGreen,
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
});

export default DailyDietCard;
