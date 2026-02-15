import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { bodyTypeAPI } from '../services/api';
import { saveUserData, getUserData, getProfileData } from '../utils/storage';
import LoadingOverlay from '../components/LoadingOverlay';

const BodyAnalysisScreen = ({ navigation }) => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [chest, setChest] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [wrist, setWrist] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await getUserData();
      if (data) {
        if (data.weight_kg) setWeight(data.weight_kg.toString());
        if (data.height_cm) setHeight(data.height_cm.toString());
        if (data.waist_cm) setWaist(data.waist_cm.toString());
        if (data.hip_cm) setHip(data.hip_cm.toString());
        if (data.chest_cm) setChest(data.chest_cm.toString());
        if (data.shoulder_breadth_cm) setShoulder(data.shoulder_breadth_cm.toString());
        if (data.wrist_cm) setWrist(data.wrist_cm.toString());
        
        // If we have enough data to be considered "filled", set read-only
        if (data.weight_kg && data.height_cm) {
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Failed to load user data', error);
    }
  };

  const handleAnalyze = async () => {
    if (!weight || !height || !waist || !hip || !chest || !shoulder || !wrist) {
      Alert.alert('Error', 'Please fill in all measurements');
      return;
    }

    setLoading(true);
    try {
      // Get gender and other profile info from storage
      const profileData = await getProfileData();
      const currentGender = profileData?.gender || 'female';

      const measurements = {
        gender: currentGender,
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height),
        waist_cm: parseFloat(waist),
        hip_cm: parseFloat(hip),
        chest_cm: parseFloat(chest),
        shoulder_breadth_cm: parseFloat(shoulder),
        wrist_cm: parseFloat(wrist),
      };

      const result = await bodyTypeAPI.predict(measurements);
      // Save data (merging handled by storage utility)
      await saveUserData(measurements);
      navigation.navigate('Results', { result });
      setIsEditing(false); // Switch back to read-only after success
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        error.response?.data?.detail || 'Failed to analyze body type'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, icon, value, setter, placeholder) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputRow, !isEditing && styles.inputRowDisabled]}>
        <Text style={styles.inputEmoji}>{icon}</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.textInputDisabled]}
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          maxLength={5}
          editable={isEditing}
        />
      </View>
      <View style={styles.inputUnderline} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Body Analysis</Text>
          <Text style={styles.subtitle}>Enter your measurements to get started</Text>

          {/* Measurements Form */}
          <View style={styles.formCard}>
            {renderInput('Weight (kg)', '⚖️', weight, setWeight, 'e.g. 70.5')}
            {renderInput('Height (cm)', '📏', height, setHeight, 'e.g. 175.0')}

            <View style={styles.row}>
              <View style={styles.halfInput}>
                {renderInput('Waist (cm)', '📐', waist, setWaist, 'e.g. 80')}
              </View>
              <View style={styles.halfInput}>
                {renderInput('Hip (cm)', '📐', hip, setHip, 'e.g. 95')}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                {renderInput('Chest (cm)', '📐', chest, setChest, 'e.g. 100')}
              </View>
              <View style={styles.halfInput}>
                {renderInput('Shoulder (cm)', '📐', shoulder, setShoulder, 'e.g. 45')}
              </View>
            </View>

            {renderInput('Wrist (cm)', '⌚', wrist, setWrist, 'e.g. 17')}

            {isEditing ? (
              <TouchableOpacity
                style={[styles.analyzeButton, loading && styles.buttonDisabled]}
                onPress={handleAnalyze}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.analyzeButtonText}>
                  {loading ? 'Analyzing...' : 'Analyze My Body Type'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={20} color={colors.primaryGreen} style={{ marginRight: 8 }} />
                <Text style={styles.editButtonText}>Edit Your Data</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <LoadingOverlay visible={loading} message="Analyzing measurements..." />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundCream,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    textAlign: 'left', // Changed to left
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'left', // Changed to left
    marginBottom: spacing.xl,
  },
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGreenLight,
    borderRadius: borderRadius.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  genderToggleDisabled: {
    opacity: 0.8,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  genderSelected: {
    backgroundColor: colors.primaryGreen,
  },
  genderText: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.primaryGreen,
  },
  genderTextSelected: {
    color: colors.textWhite,
  },
  formCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  inputRowDisabled: {
    opacity: 0.7,
  },
  inputEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: typography.md,
    color: colors.textDark,
    paddingVertical: 4,
  },
  textInputDisabled: {
    color: colors.textSecondary,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  analyzeButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 18,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.md,
  },
  editButton: {
    backgroundColor: colors.backgroundGreenLight,
    paddingVertical: 18,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryGreen,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: colors.textWhite,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  editButtonText: {
    color: colors.primaryGreen,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
});

export default BodyAnalysisScreen;
