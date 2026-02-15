import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { mealPlanAPI } from '../services/api';
import { getUserData } from '../utils/storage';
import LoadingOverlay from '../components/LoadingOverlay';

const GOALS = ['Healthy Living', 'Weight Loss', 'Muscle Gain', 'Weight Gain'];

const MealPlansScreen = ({ navigation }) => {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState('Healthy Living');
  const [selectedDay, setSelectedDay] = useState(1);

  const loadCurrentPlan = async () => {
    try {
      const plan = await mealPlanAPI.getCurrent();
      if (plan && plan.meal_plan) {
        setMealPlan(plan);
      } else {
        setMealPlan(null);
      }
    } catch (e) {
      console.log('No existing plan or error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCurrentPlan();
    }, [])
  );

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const userData = await getUserData();
      if (!userData) {
        Alert.alert('No Data', 'Please complete a body analysis first.');
        setGenerating(false);
        return;
      }
      const result = await mealPlanAPI.generate(userData, 7, selectedGoal);
      setMealPlan(result);
      setSelectedDay(1);
    } catch (error) {
      console.error('Generate error:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getMealIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🍛';
      case 'dinner': return '🍲';
      case 'snack': case 'snacks': return '🥤';
      default: return '🍽️';
    }
  };

  const getDayPlan = () => {
    if (!mealPlan?.meal_plan) return null;
    const dayKey = `day_${selectedDay}`;
    return mealPlan.meal_plan[dayKey] || null;
  };

  const getDayName = (dayNumber) => {
    if (!mealPlan?.created_at) return `Day ${dayNumber}`;
    const startDate = new Date(mealPlan.created_at);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + (dayNumber - 1));
    
    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue
  };

  const getFullDayName = (dayNumber) => {
    if (!mealPlan?.created_at) return `Day ${dayNumber}`;
    const startDate = new Date(mealPlan.created_at);
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + (dayNumber - 1));
    return date.toLocaleDateString('en-US', { weekday: 'long' }); // Monday
  };

  const dayPlan = getDayPlan();

  // RAG now returns { item: "String Hoppers...", portion: "Rice: ~200g..." }
  // We can still try to parse the item string if it contains "Approx", but the portion field should take precedence if structured.
  const parseMealData = (mealData) => {
    // Helper for legacy string parsing
    const parseString = (str) => {
        if (!str || typeof str !== 'string') return [{ name: str, portion: null }];
        
        let mainText = str;
        let portionsText = '';
        const approxMatch = mainText.match(/\(Approx[.:]?\s*(.*?)\)/i);
        
        if (approxMatch) {
            portionsText = approxMatch[1];
            mainText = mainText.replace(approxMatch[0], '').trim();
        }
        
        const portionMap = {};
        if (portionsText) {
            portionsText.split(/[;,]/).forEach(p => {
                const parts = p.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim().toLowerCase();
                    const value = parts.slice(1).join(':').trim();
                    if (key && value) portionMap[key] = value;
                }
            });
        }
        
        return mainText.split('+').map(item => {
            let name = item.trim();
            name = name.replace(/^[,;]+|[,;]+$/g, '').trim();
            let portion = null;
            const lowerName = name.toLowerCase();
            for (const [key, value] of Object.entries(portionMap)) {
                if (lowerName.includes(key) || key.includes(lowerName)) {
                    portion = value;
                    break;
                }
            }
            return { name, portion };
        });
    };

    // Case 1: Legacy string format "Food + Side (Approx...)"
    if (typeof mealData === 'string') {
        return parseString(mealData);
    }
    
    // Case 2: Structured format from updated RAG
    if (mealData && mealData.item) {
        let items = [ { name: mealData.item, portion: mealData.portion } ];
        
        // Handle concatenated items even in structured data
        if (mealData.item.includes('+')) {
            const parsedName = parseString(mealData.item + (mealData.portion ? ` (Approx. ${mealData.portion})` : ''));
            // If the parseString logic successfully distributed the portions, use that
            // Otherwise fall back to simple split
            if (parsedName.length > 1) {
                return parsedName;
            }
            
            // Fallback split
            items = mealData.item.split('+').map(part => ({
                name: part.trim(),
                portion: mealData.portion 
            }));
        }
        
        return items;
    }
    
    // Fallback
    return [{ name: JSON.stringify(mealData), portion: null }];
  };

  const renderMealCard = (meal, type) => {
    if (!meal) return null;
    
    // meal can be:
    // 1. String: "Rice + Curry (Approx. ...)"
    // 2. Object (Old RAG): { main: "...", alternative: "..." } -> We are rendering 'meal' which is 'main' or 'alternative' passed from parent loop? 
    //    Wait, getDayPlan returns { breakfast: { main: ..., alt: ... } }. 
    //    The render loop below iterates Object.entries(dayPlan). 
    //    So 'meal' here is the FULL object { main: ..., alternative: ... }.
    
    // We need to decide which one to show. Default to 'main'.
    const activeOption = meal.main || meal; // Handle case where meal is just the data if structure changed
    
    const parsedItems = parseMealData(activeOption);

    return (
      <View style={styles.mealCard} key={type}>
        <View style={styles.mealCardHeader}>
          <Text style={styles.mealEmoji}>{getMealIcon(type)}</Text>
          <View style={styles.mealCardInfo}>
            <Text style={styles.mealType}>{type?.charAt(0).toUpperCase() + type?.slice(1)}</Text>
            
            {/* Render items */}
            <View style={styles.mealItemsContainer}>
              {parsedItems.map((item, index) => (
                <View key={index} style={styles.mealItemRow}>
                  <View style={styles.bulletPoint} />
                  <View style={{flex: 1}}>
                    <Text style={styles.mealItemName}>{item.name}</Text>
                    {item.portion && (
                      <Text style={styles.mealItemPortion}>{item.portion}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        
        {/* Legacy side/drink fields if they exist */}
        {activeOption.side && (
          <Text style={styles.mealSide}>Side: {activeOption.side}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Meal Plans</Text>
          <Text style={styles.subtitle}>Sri Lankan cuisine tailored for you</Text>
        </View>

        <Text style={styles.sectionLabel}>Select Goal</Text>
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          style={styles.goalScroll} 
          contentContainerStyle={styles.goalScrollContent}
        >
          {GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[styles.goalChip, selectedGoal === goal && styles.goalChipSelected]}
              onPress={() => setSelectedGoal(goal)}
              activeOpacity={0.8}
            >
              <Text style={[styles.goalChipText, selectedGoal === goal && styles.goalChipTextSelected]}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.8}
        >
          {generating ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <>
              <Ionicons name="restaurant" size={22} color={colors.textWhite} style={styles.generateIcon} />
              <Text style={styles.generateText}>Generate Meal Plan</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Day Selector */}
        {mealPlan?.meal_plan && !loading && !generating && (
          <View style={styles.daySelectorContainer}>
            <ScrollView 
              horizontal={true} 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.dayScrollContent}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, selectedDay === day && styles.dayChipSelected]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextSelected]}>
                    {getDayName(day)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading Overlay */}
        <LoadingOverlay visible={generating} message="Curating your Sri Lankan meal plan..." />
        {/* <LoadingOverlay visible={loading} message="Loading your plan..." /> */}

        {/* Meal Plan Display */}
        {dayPlan && !loading && (
          <View style={styles.planSection}>
            <Text style={styles.planTitle}>{getFullDayName(selectedDay)}'s Plan</Text>
            {Object.entries(dayPlan).map(([type, meal]) => renderMealCard(meal, type))}
          </View>
        )}

        {/* Empty State or Get Started */}
        {!dayPlan && !loading && !generating && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍛</Text>
            <Text style={styles.emptyTitle}>No Meal Plan Yet</Text>
            <Text style={styles.emptyText}>
              Generate a personalized meal plan based on your body analysis and health goals.
            </Text>
            
            {/* Added Get Started Card if no data */}
            <TouchableOpacity 
              style={styles.getStartedCard}
              onPress={() => navigation.navigate('MainApp', { screen: 'BodyAnalysis' })}
              activeOpacity={0.9}
            >
              <View style={styles.getStartedContent}>
                <View style={styles.getStartedTextContainer}>
                  <Text style={styles.getStartedTitle}>Missing Measurements?</Text>
                  <Text style={styles.getStartedSubtitle}>
                    You need to complete a body analysis before we can curate your perfect meal plan.
                  </Text>
                  <View style={styles.getStartedButton}>
                    <Text style={styles.getStartedButtonText}>Add Measurements</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.textWhite} />
                  </View>
                </View>
                <Ionicons name="body-outline" size={80} color={colors.primaryGreen} style={{opacity: 0.2}} />
              </View>
            </TouchableOpacity>
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
    backgroundColor: colors.backgroundCream,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
    // Removed extra padding to match other screens
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primaryGreen,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  goalScroll: {
    marginBottom: spacing.lg,
  },
  goalScrollContent: {
    // gap: spacing.sm,
  },
  goalChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.cardWhite,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    marginRight: spacing.sm,
  },
  goalChipSelected: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  goalChipText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.primaryGreen,
  },
  goalChipTextSelected: {
    color: colors.textWhite,
  },
  generateButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 16,
    borderRadius: borderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  generateIcon: {
    marginRight: spacing.sm,
  },
  generateText: {
    color: colors.textWhite,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  planSection: {
    marginTop: spacing.sm,
  },
  planTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginBottom: spacing.md,
  },
  mealCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  mealCardInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.accentGreen,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  mealName: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textDark,
  },
  mealSide: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: 52,
  },
  mealItemsContainer: {
    marginTop: 4,
  },
  mealItemRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryGreen,
    marginTop: 8,
    marginRight: 8,
  },
  mealItemName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textDark,
    lineHeight: 22,
  },
  mealItemPortion: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },
  daySelectorContainer: {
    marginBottom: spacing.md,
  },
  dayScrollContent: {
    paddingRight: spacing.lg,
  },
  dayChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.cardWhite,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayChipSelected: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  dayChipText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.textWhite,
  },
  // Get Started Card
  getStartedCard: {
    backgroundColor: colors.backgroundGreenLight,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    borderStyle: 'dashed',
    width: '100%',
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

export default MealPlansScreen;
