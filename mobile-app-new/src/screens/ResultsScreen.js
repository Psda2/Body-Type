import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const ResultsScreen = ({ route, navigation }) => {
  const { result } = route.params || {};

  const getBMICategory = (bmi) => {
    if (!bmi) return 'Unknown';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIColor = (category) => {
    if (category === 'Normal weight') return colors.accentGreen;
    if (category === 'Underweight' || category === 'Overweight') return '#FF9800';
    return colors.alertRed;
  };

  const bmiCategory = getBMICategory(result?.bmi);
  const bmiColor = getBMIColor(bmiCategory);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color={colors.textWhite} />
          </View>
          <Text style={styles.pageTitle}>Analysis Complete!</Text>
        </View>

        {/* BMI Card */}
        <View style={styles.bmiCard}>
          <Text style={styles.cardTitle}>Body Mass Index (BMI)</Text>
          <View style={styles.bmiRow}>
            <View>
              <Text style={styles.bmiLabel}>Your BMI</Text>
              <Text style={styles.bmiValue}>{result?.bmi?.toFixed(2) || '--'}</Text>
            </View>
            <View style={[styles.bmiStatusBadge, { backgroundColor: bmiColor + '20' }]}>
              <Text style={[styles.bmiStatusText, { color: bmiColor }]}>{bmiCategory}</Text>
            </View>
          </View>
        </View>

        {/* Body Type Card */}
        <View style={styles.bodyTypeCard}>
          <Ionicons name="body" size={40} color={colors.primaryGreen} />
          <Text style={styles.bodyTypeLabel}>Your Body Type</Text>
          <Text style={styles.bodyTypeValue}>{result?.somatotype || '--'}</Text>
          <Text style={styles.bodyTypeDescription}>
            {result?.somatotype === 'Ectomorph' && 'Naturally lean with a fast metabolism'}
            {result?.somatotype === 'Mesomorph' && 'Athletic build with good muscle development'}
            {result?.somatotype === 'Endomorph' && 'Naturally higher body fat percentage'}
          </Text>
        </View>

        {/* Next Steps */}
        <Text style={styles.sectionTitle}>What's Next?</Text>
        <View style={styles.nextStepsGrid}>
          <TouchableOpacity
            style={[styles.nextStepCard, { marginRight: spacing.md }]}
            onPress={() => navigation.navigate('MainApp', { screen: 'MealPlans' })}
            activeOpacity={0.8}
          >
            <View style={[styles.nextStepIcon, { backgroundColor: colors.backgroundGreenLight }]}>
              <Ionicons name="restaurant" size={28} color={colors.primaryGreen} />
            </View>
            <Text style={styles.nextStepTitle}>View Meal Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextStepCard}
            onPress={() => navigation.navigate('MainApp', { screen: 'Profile' })}
            activeOpacity={0.8}
          >
            <View style={[styles.nextStepIcon, { backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="person" size={28} color={colors.accentYellow} />
            </View>
            <Text style={styles.nextStepTitle}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundCream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  pageTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primaryGreen,
  },
  bmiCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.primaryGreen,
    marginBottom: spacing.md,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
  },
  bmiStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  bmiStatusText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  bodyTypeCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  bodyTypeLabel: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  bodyTypeValue: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginVertical: spacing.sm,
  },
  bodyTypeDescription: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginBottom: spacing.md,
  },
  nextStepsGrid: {
    flexDirection: 'row',
    // gap: spacing.md,
  },
  nextStepCard: {
    flex: 1,
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    // marginRight: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  nextStepIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  nextStepTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textDark,
    textAlign: 'center',
  },
});

export default ResultsScreen;
