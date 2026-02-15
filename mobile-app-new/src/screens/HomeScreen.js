import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { historyAPI, mealPlanAPI, tipsAPI, userAPI } from '../services/api';
import {
  getUserEmail,
  saveUserEmail,
  getUserData,
  getDailyTips, 
  saveDailyTips, 
  getProfileData, 
  saveProfileData,
  saveUserData,
  getOnboardingStatus,
  saveOnboardingStatus
} from '../utils/storage';
import { LineChart } from 'react-native-chart-kit';
import LoadingOverlay from '../components/LoadingOverlay';
import OnboardingModal from '../components/OnboardingModal';

const HomeScreen = ({ navigation }) => {
  const [userEmail, setUserEmail] = useState('');
  const [userData, setUserData] = useState(null);
  const [latestResult, setLatestResult] = useState(null);
  const [todayMeals, setTodayMeals] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyTips, setDailyTips] = useState([]);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const loadData = async () => {
    try {
      let email = await getUserEmail();
      let data = await getUserData();
      let profile = await getProfileData();
      
      // Sync from Backend if possible
      try {
          const remoteUser = await userAPI.getCurrentUser();
          if (remoteUser) {
              email = remoteUser.email || email;
              // Sync userData
              const syncedUserData = {
                  ...data,
                  name: remoteUser.full_name || data?.name || email?.split('@')[0],
                  email: remoteUser.email,
                  age: remoteUser.age
              };
              data = syncedUserData;
              await saveUserData(syncedUserData);
              await saveUserEmail(email);

              // Sync profileData
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
      } catch (err) {
          console.log('Home sync error:', err);
      }

      setUserEmail(email || 'User');
      setUserData(data);
      setProfileData(profile);
 
      // Check if onboarding is truly needed
      const isCompleted = await getOnboardingStatus();
      const hasMeaningfulData = profile && (profile.gender || profile.age || (data && data.age));
 
      // If user hasn't seen/completed it AND has no data, show survey
      if (!isCompleted && !hasMeaningfulData && (!profile || !profile.gender || !profile.age)) {
          setShowSurvey(true);
      }

      // Reset dashboard data to prevent stale states from previous users
      setLatestResult(null);
      setChartData({ labels: [], datasets: [{ data: [0] }] });
      setTodayMeals(null);

      // Load daily tips
      try {
        // Try to get from cache first
        let tips = await getDailyTips();
        
        if (!tips) {
          // Fetch from API
          console.log('Fetching daily tips from API...');
          const response = await tipsAPI.getDaily();
          if (response && response.tips) {
            tips = response.tips;
            await saveDailyTips(tips);
          }
        }
        
        if (tips) {
          setDailyTips(tips);
        }
      } catch (e) {
        console.log('Error loading tips:', e);
        // Fallback tips
        if (dailyTips.length === 0) {
          setDailyTips([
            "Stay hydrated! Drink water throughout the day.",
            "Take short breaks to stretch if you sit for long periods.",
            "Include diverse colors of vegetables in your meals.",
            "Consistency is key—aim for steady progress, not perfection.",
            "Get 7-8 hours of sleep for optimal recovery."
          ]);
        }
      }

      // Load history and process for chart
      try {
        const history = await historyAPI.getAll();
        if (history && history.length > 0) {
          // Sort by date ascending for chart
          const sortedForChart = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // Get last 6 entries
          const recentHistory = sortedForChart.slice(-6);
          
          if (recentHistory.length > 0) {
            const labels = recentHistory.map(item => {
              const date = new Date(item.date);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            });
            
            const data = recentHistory.map(item => item.bmi || 0);
            
            setChartData({
              labels,
              datasets: [{ data }]
            });
            
            // Set latest result from the last item
            setLatestResult(recentHistory[recentHistory.length - 1]);
          } else {
            setLatestResult(null);
          }
        } else {
          setLatestResult(null);
        }
      } catch (e) {
        console.log('No history yet', e);
        setLatestResult(null);
      }

      // Load meal plan
      try {
        const mealPlan = await mealPlanAPI.getCurrent();
        if (mealPlan && mealPlan.meal_plan) {
          const days = Object.keys(mealPlan.meal_plan);
          if (days.length > 0) {
            setTodayMeals(mealPlan.meal_plan[days[0]]);
          } else {
            setTodayMeals(null);
          }
        } else {
          setTodayMeals(null);
        }
      } catch (e) {
        console.log('No meal plan yet');
        setTodayMeals(null);
      }
    } finally {
      // setLoading(false); // Removed to prevent full screen overlay on focus
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveTipIndex(roundIndex);
  };

  const bmi = latestResult?.bmi;
  const bodyType = latestResult?.somatotype || latestResult?.body_type;

  const handleOnboardingComplete = async (newData) => {
    try {
      setLoading(true);
      // Save locally
      await saveProfileData(newData);
      setProfileData(newData);
      
      // Save to backend
      await userAPI.updateProfile(newData);
      
      await saveOnboardingStatus(true);
      setShowSurvey(false);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryGreen} />
        }
      >
        <LoadingOverlay visible={loading} message="Planning your wellness path..." />

        {/* Onboarding Survey */}
        <OnboardingModal 
            visible={showSurvey} 
            onComplete={handleOnboardingComplete}
            onSkip={() => setShowSurvey(false)}
            initialData={profileData || {}}
        />
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>{userData?.name || userEmail?.split('@')[0] || 'User'}</Text>
          </View>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Quick Stats or Get Started */}
        {latestResult ? (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Health Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="fitness" size={24} color={colors.primaryGreen} />
                <Text style={styles.statValue}>{bmi?.toFixed(1) || '--'}</Text>
                <Text style={styles.statLabel}>BMI</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="body" size={24} color={colors.accentYellow} />
                <Text style={styles.statValue}>{bodyType || '--'}</Text>
                <Text style={styles.statLabel}>Body Type</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="scale" size={24} color={colors.accentGreen} />
                <Text style={styles.statValue}>{latestResult?.weight_kg?.toFixed(0) || '--'}</Text>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.getStartedCard}
            onPress={() => navigation.navigate('MainApp', { screen: 'BodyAnalysis' })}
            activeOpacity={0.9}
          >
            <View style={styles.getStartedContent}>
              <View style={styles.getStartedTextContainer}>
                <Text style={styles.getStartedTitle}>Discover Your Body Type</Text>
                <Text style={styles.getStartedSubtitle}>
                  Take a quick analysis to get personalized meal plans and insights.
                </Text>
                <View style={styles.getStartedButton}>
                  <Text style={styles.getStartedButtonText}>Start Analysis</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.textWhite} />
                </View>
              </View>
              <Ionicons name="body-outline" size={80} color={colors.primaryGreen} style={{opacity: 0.2}} />
            </View>
          </TouchableOpacity>
        )}

        {/* BMI Trend Chart */}
        {latestResult && chartData && (
          <View style={styles.chartCard}>
            <Text style={styles.statsTitle}>BMI Trend</Text>
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 64} // Container padding adjustment
              height={220}
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: colors.cardWhite,
                backgroundGradientFrom: colors.cardWhite,
                backgroundGradientTo: colors.cardWhite,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(123, 111, 114, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: colors.primaryGreen
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.backgroundGreenLight }]}
            onPress={() => navigation.navigate('MainApp', { screen: 'BodyAnalysis' })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryGreen }]}>
              <Ionicons name="body" size={28} color={colors.textWhite} />
            </View>
            <Text style={styles.actionTitle}>Body{'\n'}Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FFF8E1' }]}
            onPress={() => navigation.navigate('MainApp', { screen: 'MealPlans' })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accentYellow }]}>
              <Ionicons name="restaurant" size={28} color={colors.textWhite} />
            </View>
            <Text style={styles.actionTitle}>Meal{'\n'}Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#E0F2F1' }]}
            onPress={() => navigation.navigate('MainApp', { screen: 'Chat' })}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.cyanAccent }]}>
              <Ionicons name="chatbubbles" size={28} color={colors.textWhite} />
            </View>
            <Text style={styles.actionTitle}>AI{'\n'}Assistant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FBE9E7' }]}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FF7043' }]}>
              <Ionicons name="time" size={28} color={colors.textWhite} />
            </View>
            <Text style={styles.actionTitle}>My{'\n'}History</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Nutrition Card */}
        <TouchableOpacity
          style={styles.nutritionCard}
          onPress={() => navigation.navigate('MainApp', { screen: 'MealPlans' })}
          activeOpacity={0.85}
        >
          <View style={styles.nutritionContent}>
            <View style={styles.nutritionLeft}>
              <Text style={styles.nutritionTitle}>Daily Nutrition Plan</Text>
              {todayMeals ? (
                <Text style={styles.nutritionSubtitle}>
                  {Object.keys(todayMeals).length} Meals Planned
                </Text>
              ) : (
                <Text style={styles.nutritionSubtitle}>
                  Tap to generate your plan
                </Text>
              )}
              <View style={styles.nutritionButton}>
                <Text style={styles.nutritionButtonText}>
                  {todayMeals ? 'View Plan' : 'Create Plan'}
                </Text>
              </View>
            </View>
            <Text style={styles.nutritionEmoji}>🍛</Text>
          </View>
        </TouchableOpacity>

        {/* Tip of the Day - Swipable Card */}
        {dailyTips.length > 0 && (
          <View style={styles.tipsContainer}>
            <View style={styles.tipHeaderRow}>
              <Ionicons name="bulb" size={22} color={colors.accentYellow} />
              <Text style={styles.tipTitle}>Tips for Today</Text>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              snapToInterval={Dimensions.get('window').width - 64 + 16} // Card width + margin
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {dailyTips.map((tip, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tipCard, 
                    { 
                      width: Dimensions.get('window').width - 64,
                      marginRight: 16 // Add spacing between cards
                    }
                  ]}
                >
                  <Text style={styles.tipText}>
                    "{tip}"
                  </Text>
                  <Text style={styles.tipNumber}>Tip {index + 1} of 5</Text>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.paginationDots}>
              {dailyTips.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    activeTipIndex === index ? styles.activeDot : {}
                  ]} 
                />
              ))}
            </View>
          </View>
        )}
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
  greeting: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primaryGreen,
  },
  userName: {
    fontSize: typography.md,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: 'normal',
  },
  headerLogo: {
    width: 50,
    height: 50,
  },
  statsCard: {
    backgroundColor: colors.backgroundGreenLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderColor,
    ...shadows.md,
  },
  chartCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: 6,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.borderColor,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: spacing.sm,
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textDark,
    flex: 1,
  },
  nutritionCard: {
    backgroundColor: colors.primaryGreen,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  nutritionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionLeft: {
    flex: 1,
  },
  nutritionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textWhite,
    marginBottom: 4,
  },
  nutritionSubtitle: {
    fontSize: typography.sm,
    color: '#C8E6C9',
    marginBottom: spacing.md,
  },
  nutritionButton: {
    backgroundColor: colors.accentYellow,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  nutritionButtonText: {
    color: colors.primaryGreen,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    
  },
  nutritionEmoji: {
    fontSize: 60,
    marginLeft: spacing.sm,
  },
  // Tips Styles
  tipsContainer: {
    marginBottom: spacing.xl,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  tipTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.accentYellow,
    marginLeft: spacing.sm,
  },
  tipCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accentYellow,
    marginRight: 0, // No margin right as we want full width snaps
    minHeight: 120,
    justifyContent: 'center',
  },
  tipText: {
    fontSize: typography.base,
    color: colors.textDark,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  tipNumber: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.md,
    alignSelf: 'flex-end',
    fontWeight: 'bold',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.accentYellow,
    width: 12,
  },
  // Get Started Card
  getStartedCard: {
    backgroundColor: colors.backgroundGreenLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    borderStyle: 'dashed',
  },
  getStartedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  getStartedTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  getStartedTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginBottom: 4,
  },
  getStartedSubtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  getStartedButtonText: {
    color: colors.textWhite,
    fontWeight: typography.bold,
    fontSize: typography.sm,
    marginRight: 4,
  },
});

export default HomeScreen;
