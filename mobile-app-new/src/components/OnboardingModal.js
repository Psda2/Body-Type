import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const { width } = Dimensions.get('window');

const OnboardingModal = ({ visible, onComplete, onSkip, initialData = {} }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    age: initialData.age ? initialData.age.toString() : '',
    gender: initialData.gender || 'female',
    lifestyle: initialData.lifestyle || 'Moderately Active',
    fitness_level: initialData.fitness_level || 'Beginner',
    goal: initialData.goal || 'Healthy Living',
  });

  const steps = [
    {
      id: 'age',
      title: "What's your age?",
      subtitle: "Help us calculate your nutritional needs accurately.",
      type: 'input',
      icon: 'calendar-outline',
      placeholder: 'Enter age...',
      keyboardType: 'numeric',
    },
    {
      id: 'gender',
      title: "Select your gender",
      subtitle: "This helps in accurately predicting your body type.",
      type: 'select',
      options: ['male', 'female'],
      icons: { male: 'male', female: 'female' },
    },
    {
      id: 'lifestyle',
      title: "Your lifestyle",
      subtitle: "How active are you on a daily basis?",
      type: 'select',
      options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
    },
    {
      id: 'fitness_level',
      title: "Fitness level",
      subtitle: "How would you rate your current physical fitness?",
      type: 'select',
      options: ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
      id: 'goal',
      title: "What's your goal?",
      subtitle: "Choose the meal plan type that best fits your objective.",
      type: 'select',
      options: ['Healthy Living', 'Weight Loss', 'Muscle Gain', 'Lean & Toned'],
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      if (currentStep.id === 'age' && !data.age) return;
      setStep(step + 1);
    } else {
      const finalData = {
        ...data,
        age: parseInt(data.age, 10) || 0
      };
      onComplete(finalData);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const renderContent = () => {
    if (currentStep.type === 'input') {
      return (
        <View style={styles.inputContainer}>
          <Ionicons name={currentStep.icon} size={40} color={colors.primaryGreen} style={styles.stepIcon} />
          <TextInput
            style={styles.textInput}
            value={data[currentStep.id]}
            onChangeText={(text) => setData({ ...data, [currentStep.id]: text })}
            placeholder={currentStep.placeholder}
            keyboardType={currentStep.keyboardType}
            autoFocus
            maxLength={3}
          />
        </View>
      );
    }

    return (
      <View style={styles.optionsContainer}>
        {currentStep.options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionCard,
              data[currentStep.id] === option && styles.optionCardSelected,
            ]}
            onPress={() => setData({ ...data, [currentStep.id]: option })}
            activeOpacity={0.8}
          >
            {currentStep.icons && (
              <Ionicons
                name={currentStep.icons[option]}
                size={24}
                color={data[currentStep.id] === option ? colors.textWhite : colors.primaryGreen}
                style={styles.optionIcon}
              />
            )}
            <Text
              style={[
                styles.optionText,
                data[currentStep.id] === option && styles.optionTextSelected,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
              </View>
              <TouchableOpacity onPress={onSkip} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.stepIndicator}>Step {step + 1} of {steps.length}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
            {renderContent()}
          </View>

          <View style={styles.footer}>
            {step > 0 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.skipLink} onPress={onSkip}>
                <Text style={styles.skipLinkText}>Answer Later</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, currentStep.id === 'age' && !data.age && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={currentStep.id === 'age' && !data.age}
            >
              <Text style={styles.nextButtonText}>
                {step === steps.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textWhite} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundCream,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.xl,
    minHeight: 500, // Increased height
    ...shadows.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryGreen,
    borderRadius: 3,
  },
  stepIndicator: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  stepIcon: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.lg,
  },
  textInput: {
    width: '60%',
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryGreen,
    fontSize: 32,
    fontWeight: typography.bold,
    textAlign: 'center',
    color: colors.textDark,
    paddingVertical: 10,
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.cardWhite,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    ...shadows.sm,
  },
  optionCardSelected: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textDark,
  },
  optionTextSelected: {
    color: colors.textWhite,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  backButton: {
    padding: spacing.md,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primaryGreen,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xl,
    ...shadows.md,
  },
  nextButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  nextButtonText: {
    color: colors.textWhite,
    fontSize: typography.md,
    fontWeight: typography.bold,
  },
  skipLink: {
    padding: spacing.md,
  },
  skipLinkText: {
    color: colors.textSecondary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    textDecorationLine: 'underline',
  },
});

export default OnboardingModal;
