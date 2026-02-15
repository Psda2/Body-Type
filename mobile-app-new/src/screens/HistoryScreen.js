import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { historyAPI } from '../services/api';

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await historyAPI.getAll();
      if (data) {
        const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setHistory(sorted);
      }
    } catch (error) {
      console.log('History load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getBMIColor = (bmi) => {
    if (!bmi) return colors.textSecondary;
    if (bmi < 18.5) return '#FF9800';
    if (bmi < 25) return colors.accentGreen;
    if (bmi < 30) return '#FF9800';
    return colors.alertRed;
  };

  const getBodyTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'ectomorph': return 'body-outline';
      case 'mesomorph': return 'body';
      case 'endomorph': return 'body';
      default: return 'body-outline';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={colors.primaryGreen} style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.bmiChip, { backgroundColor: getBMIColor(item.bmi) + '20' }]}>
          <Text style={[styles.bmiChipText, { color: getBMIColor(item.bmi) }]}>
            BMI {item.bmi?.toFixed(1) || '--'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.statColumn}>
          <View style={styles.miniStat}>
            <Ionicons name={getBodyTypeIcon(item.somatotype)} size={20} color={colors.primaryGreen} />
            <Text style={styles.miniStatLabel}>Body Type</Text>
            <Text style={styles.miniStatValue}>{item.somatotype || item.body_type || '--'}</Text>
          </View>
        </View>
        <View style={styles.statColumn}>
          <View style={styles.miniStat}>
            <Ionicons name="scale-outline" size={20} color={colors.accentYellow} />
            <Text style={styles.miniStatLabel}>Weight</Text>
            <Text style={styles.miniStatValue}>{item.weight_kg?.toFixed(1) || '--'} kg</Text>
          </View>
        </View>
        <View style={styles.statColumn}>
          <View style={styles.miniStat}>
            <Ionicons name="resize-outline" size={20} color={colors.cyanAccent} />
            <Text style={styles.miniStatLabel}>Height</Text>
            <Text style={styles.miniStatValue}>{item.height_cm?.toFixed(0) || '--'} cm</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>Your measurement records</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ListHeader />
        <ActivityIndicator size="large" color={colors.primaryGreen} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={history}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryGreen} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={colors.borderLight} />
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>Complete a body analysis to see your records here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundCream,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
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
  loader: {
    marginTop: spacing['2xl'],
  },
  historyCard: {
    backgroundColor: colors.cardWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 6,
  },
  dateText: {
    fontSize: typography.base,
    color: colors.textDark,
    fontWeight: typography.medium,
  },
  bmiChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  bmiChipText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  miniStatValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HistoryScreen;
