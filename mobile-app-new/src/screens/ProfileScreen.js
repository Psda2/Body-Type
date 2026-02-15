import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { historyAPI, userAPI } from '../services/api';
import { getUserData, saveUserData, clearStorage, getProfileData, saveProfileData } from '../utils/storage';
import OnboardingModal from '../components/OnboardingModal';
import LoadingOverlay from '../components/LoadingOverlay';

const ProfileScreen = ({ navigation }) => {
  const [metrics, setMetrics] = useState({
    bmi: 0,
    bodyType: '--',
    weight: 0,
    height: 0,
    gender: 'female', // Default
  });
  const [profileData, setProfileData] = useState({
    age: 0,
    lifestyle: 'Moderately Active',
    fitness_level: 'Beginner',
    goal: 'Healthy Living',
  });
  const [loading, setLoading] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadProfile = async () => {
    try {
      // Load profile data (onboarding info)
      let profile = await getProfileData();
      
      // Sync from Backend (User-wise)
      try {
        const remoteUser = await userAPI.getCurrentUser();
        if (remoteUser) {
          const syncedProfile = {
            ...profile,
            age: remoteUser.age || profile?.age || 0,
            gender: remoteUser.gender || profile?.gender || 'female',
            lifestyle: remoteUser.lifestyle || profile?.lifestyle || 'Moderately Active',
            fitness_level: remoteUser.fitness_level || profile?.fitness_level || 'Beginner',
            goal: remoteUser.goal || profile?.goal || 'Healthy Living',
          };
          profile = syncedProfile;
          await saveProfileData(syncedProfile);
        }
      } catch (apiError) {
        console.log('API Profile sync error:', apiError);
      }

      if (profile) {
        setProfileData(profile);
      }

      // Try API first
      const history = await historyAPI.getAll();
      if (history && history.length > 0) {
        const sorted = history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latest = sorted[0];
        setMetrics({
          bmi: latest.bmi || 0,
          bodyType: latest.somatotype || latest.body_type || '--',
          weight: latest.weight_kg || 0,
          height: latest.height_cm || 0,
          gender: latest.gender || 'female',
        });
      } else {
        // Fallback to local storage
        const userData = await getUserData();
        if (userData) {
          const h = userData.height_cm / 100;
          const calculatedBmi = h > 0 ? userData.weight_kg / (h * h) : 0;
          setMetrics({
            bmi: calculatedBmi,
            bodyType: '--',
            weight: userData.weight_kg || 0,
            height: userData.height_cm || 0,
            gender: (userData.gender === 'female' || userData.gender === 1) ? 'female' : 'male',
          });
        }
      }
    } catch (error) {
      console.log('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await clearStorage();
    // Reset navigation stack to Login
    if (navigation && navigation.reset) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } else {
      // Fallback if reset not available
      navigation.navigate('Login');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const getBMICategory = (bmi) => {
    if (!bmi || bmi <= 0) return { label: 'Unknown', color: colors.textSecondary, message: 'Complete a body analysis to see your BMI' };
    if (bmi < 18.5) return { label: 'Underweight', color: '#FF9800', message: 'Consider a nutritious meal plan to gain healthy weight' };
    if (bmi < 25) return { label: 'Healthy BMI', color: colors.accentGreen, message: 'Good starting BMI to tone up and get your dream body' };
    if (bmi < 30) return { label: 'Overweight', color: '#FF9800', message: 'A balanced diet and exercise can help reach your goals' };
    return { label: 'Obese', color: colors.alertRed, message: 'Consult a health professional for personalized guidance' };
  };

  const getBMIPosition = () => {
    const minBMI = 15;
    const maxBMI = 30;
    let currentBMI = metrics.bmi;
    if (!isFinite(currentBMI) || isNaN(currentBMI)) currentBMI = 22;
    const clamped = Math.max(minBMI, Math.min(currentBMI, maxBMI));
    return ((clamped - minBMI) / (maxBMI - minBMI)) * 100;
  };

  const bmiInfo = getBMICategory(metrics.bmi);

  const getLifestyle = () => {
    if (metrics.bmi < 18.5) return 'Active';
    if (metrics.bmi < 25) return 'Moderate';
    return 'Sedentary';
  };

  const getFitnessLevel = () => {
    if (metrics.bmi >= 18.5 && metrics.bmi < 25) return 'Intermediate';
    if (metrics.bmi < 18.5) return 'Beginner';
    return 'Beginner';
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (newData) => {
    try {
      setLoading(true);
      // Save locally
      await saveProfileData(newData);
      setProfileData(newData);
      
      // Also update userData age to keep in sync
      const currentUData = await getUserData();
      if (currentUData) {
        await saveUserData({ ...currentUData, age: newData.age });
      }
      
      // Save to backend
      await userAPI.updateProfile(newData);
      
      setShowEditModal(false);
      // Refresh metrics
      loadProfile(); 
    } catch (error) {
      console.error('Error saving profile changes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Your wellness profile</Text>
        </View>

        {/* BMI Section */}
        <View style={styles.bmiSection}>
          <Text style={styles.bmiTitle}>Body Mass Index (BMI)</Text>

          {/* BMI Gauge */}
          <View style={styles.gaugeContainer}>
            {/* Pointer */}
            <View style={[styles.bmiPointer, { left: `${getBMIPosition()}%` }]}>
              <View style={styles.pointerBubble}>
                <Text style={styles.pointerText}>You {metrics.bmi > 0 ? metrics.bmi.toFixed(1) : '--'}</Text>
              </View>
              <View style={styles.pointerArrow} />
            </View>

            {/* Bar */}
            <View style={styles.gaugeBar}>
              <View style={[styles.gaugeFill, { flex: 1, backgroundColor: '#FF9800' }]} />
              <View style={[styles.gaugeFill, { flex: 2, backgroundColor: '#4CAF50' }]} />
              <View style={[styles.gaugeFill, { flex: 1, backgroundColor: '#FDD835' }]} />
              <View style={[styles.gaugeFill, { flex: 0.5, backgroundColor: '#FF5722' }]} />
            </View>

            {/* Labels */}
            <View style={styles.gaugeLabels}>
              <Text style={styles.gaugeLabel}>15</Text>
              <Text style={styles.gaugeLabel}>18.5</Text>
              <Text style={styles.gaugeLabel}>25</Text>
              <Text style={styles.gaugeLabel}>30</Text>
            </View>
            <View style={styles.gaugeCategoryLabels}>
              <Text style={styles.gaugeCategoryLabel}>UNDERWEIGHT</Text>
              <Text style={styles.gaugeCategoryLabel}>NORMAL</Text>
              <Text style={styles.gaugeCategoryLabel}>OVERWEIGHT</Text>
            </View>
          </View>

          <View style={styles.contentRow}>
            <View style={styles.leftColumn}>
              {/* BMI Status Card */}
              <View style={styles.bmiStatusCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={bmiInfo.color}
                  style={styles.bmiStatusIcon}
                />
                <View style={styles.bmiStatusText}>
                  <Text style={[styles.bmiStatusTitle, { color: bmiInfo.color }]}>{bmiInfo.label}:</Text>
                  <Text style={styles.bmiStatusMessage}>{bmiInfo.message}</Text>
                </View>
              </View>

              {/* Body Stats */}
              <View style={styles.statsSection}>
                <View style={styles.statRow}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="people-outline" size={24} color={colors.primaryGreen} />
                  </View>
                  <View>
                    <Text style={styles.statRowLabel}>Body type</Text>
                    <Text style={styles.statRowValue}>{metrics.bodyType}</Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="time-outline" size={24} color={colors.primaryGreen} />
                  </View>
                  <View>
                    <Text style={styles.statRowLabel}>Lifestyle</Text>
                    <Text style={styles.statRowValue}>{profileData.lifestyle}</Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="barbell-outline" size={24} color={colors.primaryGreen} />
                  </View>
                  <View>
                    <Text style={styles.statRowLabel}>Fitness level</Text>
                    <Text style={styles.statRowValue}>{profileData.fitness_level}</Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="calendar-outline" size={24} color={colors.primaryGreen} />
                  </View>
                  <View>
                    <Text style={styles.statRowLabel}>Age</Text>
                    <Text style={styles.statRowValue}>
                      {profileData.age && profileData.age > 0 ? `${profileData.age} years` : 'Not set'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Character Image */}
            <View style={styles.rightColumn}>
               <Image
                source={
                  metrics.gender === 'male' 
                    ? require('../../assets/man.png') 
                    : require('../../assets/woman.png')
                }
                style={styles.characterImage}
                resizeMode="contain"
              />
            </View>
          </View>

        </View>

        {/* Additional Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Your Measurements</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.weight > 0 ? `${metrics.weight.toFixed(1)}` : '--'}</Text>
              <Text style={styles.metricLabel}>Weight (kg)</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.height > 0 ? `${metrics.height.toFixed(0)}` : '--'}</Text>
              <Text style={styles.metricLabel}>Height (cm)</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.bmi > 0 ? `${metrics.bmi.toFixed(1)}` : '--'}</Text>
              <Text style={styles.metricLabel}>BMI</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={24} color={colors.primaryGreen} style={styles.actionIcon} />
            <Text style={styles.editProfileText}>Update My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={24} color={colors.alertRed} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Edit Profile Modal (Single View) */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Update Profile</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editForm} showsVerticalScrollIndicator={false}>
                 <Text style={styles.formLabel}>Age (years)</Text>
                 <TextInput
                   style={styles.formInput}
                   keyboardType="numeric"
                   value={profileData.age ? profileData.age.toString() : ''}
                   onChangeText={(val) => setProfileData({...profileData, age: parseInt(val) || 0})}
                   placeholder="Enter your age"
                 />

                 <Text style={styles.formLabel}>Gender</Text>
                 <View style={styles.optionGroup}>
                   {['male', 'female'].map(g => (
                     <TouchableOpacity 
                       key={g}
                       style={[styles.optionBtn, profileData.gender === g && styles.optionBtnActive]}
                       onPress={() => setProfileData({...profileData, gender: g})}
                     >
                       <Ionicons 
                         name={g === 'male' ? 'male' : 'female'} 
                         size={18} 
                         color={profileData.gender === g ? colors.textWhite : colors.primaryGreen} 
                       />
                       <Text style={[styles.optionBtnText, profileData.gender === g && styles.optionBtnTextActive]}>
                         {g.charAt(0).toUpperCase() + g.slice(1)}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>

                 <Text style={styles.formLabel}>Lifestyle</Text>
                 <View style={styles.optionGroupVertical}>
                   {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map(l => (
                     <TouchableOpacity 
                       key={l}
                       style={[styles.optionBtnLarge, profileData.lifestyle === l && styles.optionBtnLargeActive]}
                       onPress={() => setProfileData({...profileData, lifestyle: l})}
                     >
                       <Text style={[styles.optionBtnTextLarge, profileData.lifestyle === l && styles.optionBtnTextLargeActive]}>
                         {l}
                       </Text>
                       {profileData.lifestyle === l && <Ionicons name="checkmark" size={18} color={colors.textWhite} />}
                     </TouchableOpacity>
                   ))}
                 </View>

                 <Text style={styles.formLabel}>Fitness Level</Text>
                 <View style={styles.optionGroup}>
                   {['Beginner', 'Intermediate', 'Advanced'].map(f => (
                     <TouchableOpacity 
                       key={f}
                       style={[styles.optionBtn, profileData.fitness_level === f && styles.optionBtnActive]}
                       onPress={() => setProfileData({...profileData, fitness_level: f})}
                     >
                       <Text style={[styles.optionBtnText, profileData.fitness_level === f && styles.optionBtnTextActive]}>
                         {f}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>

                 <View style={{ height: 30 }} />
              </ScrollView>

              <TouchableOpacity 
                style={styles.saveChangesButton}
                onPress={() => handleSaveProfile(profileData)}
              >
                <Text style={styles.saveChangesText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Custom Logout Modal */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="log-out-outline" size={40} color={colors.alertRed} />
              </View>
              <Text style={styles.modalTitle}>Log Out</Text>
              <Text style={styles.modalSubtitle}>Are you sure you want to log out of your wellness journey?</Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmLogoutButton} 
                  onPress={confirmLogout}
                >
                  <Text style={styles.confirmLogoutButtonText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* <LoadingOverlay visible={loading} message="Updating your profile..." /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundCream,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primaryGreen,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGreenLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderGreen,
  },
  editButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginLeft: 4,
  },
  bmiSection: {
    marginBottom: spacing.xl,
  },
  bmiTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.xl,
  },
  gaugeContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  bmiPointer: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
    zIndex: 10,
    transform: [{ translateX: -30 }],
  },
  pointerBubble: {
    backgroundColor: '#333',
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointerText: {
    color: colors.textWhite,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  pointerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#333',
  },
  gaugeBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 30,
  },
  gaugeFill: {
    height: '100%',
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  gaugeLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
  },
  gaugeCategoryLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  gaugeCategoryLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    letterSpacing: 0.5,
  },
  bmiStatusCard: {
    backgroundColor: colors.backgroundGreenLight,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  bmiStatusIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  bmiStatusText: {
    flex: 1,
  },
  bmiStatusTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    marginBottom: 2,
  },
  bmiStatusMessage: {
    fontSize: typography.base,
    color: colors.textDark,
    lineHeight: 20,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statIconContainer: {
    width: 40,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  statRowLabel: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  statRowValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textDark,
  },
  metricsCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  metricsTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  contentRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  leftColumn: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rightColumn: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterImage: {
    width: '100%',
    height: 350,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textDark,
  },
  metricLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  actionsContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundGreenLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    width: '100%',
    ...shadows.sm,
  },
  actionIcon: {
    marginRight: spacing.sm,
  },
  editProfileText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE', // Light red bg
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    width: '100%',
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.alertRed,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.backgroundCream,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    ...shadows.lg,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  confirmLogoutButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.alertRed,
    alignItems: 'center',
    ...shadows.sm,
  },
  confirmLogoutButtonText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textWhite,
  },
  
  // Edit Profile Modal Styles
  editModalContent: {
    backgroundColor: colors.backgroundCream,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    padding: spacing.xl,
    width: '100%',
    height: '90%',
    marginTop: 'auto',
    ...shadows.lg,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  editModalTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textDark,
  },
  editForm: {
    flex: 1,
  },
  formLabel: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontSize: typography.md,
    color: colors.textDark,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionGroupVertical: {
    gap: spacing.sm,
  },
  optionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    backgroundColor: colors.cardWhite,
    gap: 8,
    minWidth: '45%',
  },
  optionBtnActive: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  optionBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primaryGreen,
  },
  optionBtnTextActive: {
    color: colors.textWhite,
  },
  optionBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.cardWhite,
  },
  optionBtnLargeActive: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  optionBtnTextLarge: {
    fontSize: typography.md,
    color: colors.textDark,
  },
  optionBtnTextLargeActive: {
    color: colors.textWhite,
    fontWeight: typography.bold,
  },
  saveChangesButton: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  saveChangesText: {
    color: colors.textWhite,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
});

export default ProfileScreen;
