import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { getAuthToken } from '../utils/storage';
import { API_URL } from '../services/api';

// Removed local colors object to use global tokens

const FoodScanScreen = () => {
  const [imageUri, setImageUri]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState(null);

  // ── Image Picker ────────────────────────────────────────────────
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to scan your food plate.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to pick a food photo.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  // ── Analyse ─────────────────────────────────────────────────────
  const analyseImage = async () => {
    if (!imageUri) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('FoodScan: Attempting to get token...');
      const token = await getAuthToken();
      console.log('FoodScan: Token found:', token ? (token.substring(0, 10) + '...') : 'NULL');
      
      if (!token) throw new Error('Not authenticated. Please log in again.');

      const formData = new FormData();
      formData.append('file', {
        uri:  imageUri,
        type: 'image/jpeg',
        name: 'food_plate.jpg',
      });

      const response = await fetch(`${API_URL}/food/analyze`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Analysis failed. Please try again.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setError(null);
  };

  // ── Calorie colour coding ────────────────────────────────────────
  const calorieColor = (total) => {
    if (total < 400)  return '#2E7D32';
    if (total < 700)  return '#F57F17';
    return '#C62828';
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header - Standard App Style */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Food Scanner</Text>
          <Text style={styles.headerSub}>Estimate calories from your Sri Lankan plate</Text>
        </View>

        {/* Image Area */}
        <View style={styles.imageCard}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.plateImage} resizeMode="cover" />
              <TouchableOpacity style={styles.retakeBtn} onPress={reset}>
                <Ionicons name="refresh" size={16} color={colors.white} />
                <Text style={styles.retakeTxt}>Retake</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="restaurant-outline" size={64} color={colors.border} />
              <Text style={styles.placeholderTxt}>Take or upload a photo{'\n'}of your food plate</Text>
            </View>
          )}
        </View>

        {/* Camera / Gallery Buttons */}
        {!imageUri && (
          <View style={styles.pickRow}>
            <TouchableOpacity style={styles.pickBtn} onPress={pickFromCamera} activeOpacity={0.8}>
              <Ionicons name="camera" size={22} color={colors.white} />
              <Text style={styles.pickBtnTxt}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickBtn, styles.pickBtnOutline]} onPress={pickFromGallery} activeOpacity={0.8}>
              <Ionicons name="images-outline" size={22} color={colors.primaryGreen} />
              <Text style={[styles.pickBtnTxt, { color: colors.primaryGreen }]}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analyse Button */}
        {imageUri && !result && (
          <TouchableOpacity
            style={[styles.analyseBtn, loading && styles.analyseBtnDisabled]}
            onPress={analyseImage}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Ionicons name="flash" size={20} color={colors.white} />
            )}
            <Text style={styles.analyseBtnTxt}>
              {loading ? 'Analysing...' : 'Analyse Calories'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={20} color={colors.errorRed} />
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <View style={styles.resultSection}>
            {/* Total Calories */}
            <View style={[styles.totalCard, { borderColor: calorieColor(result.total_calories) }]}>
              <Text style={styles.totalLabel}>Total Calories</Text>
              <Text style={[styles.totalCalories, { color: calorieColor(result.total_calories) }]}>
                {result.total_calories} kcal
              </Text>
              <Text style={styles.totalSub}>{result.items_detected} items detected</Text>
            </View>

            {/* Per-food breakdown */}
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            {result.detected_foods.map((item, idx) => (
              <View key={idx} style={styles.foodRow}>
                <View style={styles.foodLeft}>
                  <Text style={styles.foodName}>
                    {item.food.replace(/\b\w/g, c => c.toUpperCase())}
                  </Text>
                  <Text style={styles.foodDetail}>
                    ~{item.portion_g}g · {item.cal_per_100g} kcal/100g · {Math.round(item.confidence * 100)}% conf
                  </Text>
                </View>
                <View style={styles.foodCalBadge}>
                  <Text style={styles.foodCal}>{item.estimated_calories}</Text>
                  <Text style={styles.foodCalUnit}>kcal</Text>
                </View>
              </View>
            ))}

            {result.detected_foods.length === 0 && (
              <View style={styles.noFoodCard}>
                <Ionicons name="search-outline" size={32} color={colors.border} />
                <Text style={styles.noFoodTxt}>No Sri Lankan foods detected.{'\n'}Try a clearer photo.</Text>
              </View>
            )}

            {/* Scan Again */}
            <TouchableOpacity style={styles.scanAgainBtn} onPress={reset} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={18} color={colors.primaryGreen} />
              <Text style={styles.scanAgainTxt}>Scan Another Plate</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundCream },
  scroll: { padding: spacing.lg, paddingBottom: 100 },

  // Header
  header: {
    paddingHorizontal: 0,
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primaryGreen,
    marginBottom: spacing.xs,
  },
  headerSub: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },

  // Image card
  imageCard: {
    width: '100%', aspectRatio: 4 / 3,
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: colors.backgroundWhite,
    borderWidth: 2, borderColor: colors.borderLight,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  plateImage:     { width: '100%', height: '100%' },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderTxt: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  retakeBtn: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  retakeTxt: { color: colors.textWhite, fontSize: 13, fontWeight: '600' },

  // Pick buttons
  pickRow:        { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primaryGreen,
    paddingVertical: 14, borderRadius: 14,
    elevation: 3,
  },
  pickBtnOutline: { backgroundColor: colors.backgroundWhite, borderWidth: 2, borderColor: colors.primaryGreen },
  pickBtnTxt:     { color: colors.textWhite, fontSize: 15, fontWeight: '700' },

  // Analyse button
  analyseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.accentGreen,
    paddingVertical: 16, borderRadius: 14,
    marginBottom: 16, elevation: 4,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
  },
  analyseBtnDisabled: { backgroundColor: '#A5D6A7' },
  analyseBtnTxt:      { color: colors.textWhite, fontSize: 16, fontWeight: '800' },

  // Error
  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: colors.alertRed,
  },
  errorTxt: { flex: 1, color: colors.alertRed, fontSize: 14 },

  // Results
  resultSection: { marginTop: 4 },
  totalCard: {
    alignItems: 'center', padding: 24, borderRadius: 20,
    backgroundColor: colors.backgroundWhite, borderWidth: 2,
    marginBottom: 20, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  totalLabel:    { fontSize: 13, color: colors.textSecondary, fontWeight: '600', letterSpacing: 1 },
  totalCalories: { fontSize: 52, fontWeight: '900', marginVertical: 4 },
  totalSub:      { fontSize: 13, color: colors.textSecondary },

  breakdownTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, marginBottom: 10 },

  foodRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.backgroundWhite, borderRadius: 14, padding: 14,
    marginBottom: 8, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  foodLeft:    { flex: 1 },
  foodName:    { fontSize: 15, fontWeight: '700', color: colors.textDark },
  foodDetail:  { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  foodCalBadge:{ alignItems: 'center', marginLeft: 12 },
  foodCal:     { fontSize: 20, fontWeight: '800', color: colors.primaryGreen },
  foodCalUnit: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  noFoodCard: {
    alignItems: 'center', padding: 30, gap: 12,
    backgroundColor: colors.backgroundWhite, borderRadius: 16,
  },
  noFoodTxt: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  scanAgainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 20, paddingVertical: 14, borderRadius: 14,
    borderWidth: 2, borderColor: colors.primaryGreen,
  },
  scanAgainTxt: { color: colors.primaryGreen, fontSize: 15, fontWeight: '700' },
});

export default FoodScanScreen;
