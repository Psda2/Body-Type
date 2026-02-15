import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const CalendarStrip = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  
  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        fullDate: date,
      });
    }
    return dates;
  };

  const dates = getDates();

  return (
    <View style={styles.container}>
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {dates.map((item, index) => {
          const isSelected = item.date === selectedDate;
          return (
            <TouchableOpacity 
              key={index} 
              onPress={() => setSelectedDate(item.date)}
              style={styles.dateContainer}
              activeOpacity={0.8}
            >
              <View style={isSelected ? styles.selectedBg : styles.unselectedBg}>
                <Text style={isSelected ? styles.dayTextSelected : styles.dayText}>{item.day}</Text>
                <Text style={isSelected ? styles.dateTextSelected : styles.dateText}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dateContainer: {
    marginRight: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  selectedBg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    width: 60,
    backgroundColor: colors.primaryGreen,
  },
  unselectedBg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#fff',
    width: 60,
  },
  dayText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dayTextSelected: {
    fontSize: typography.xs,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dateTextSelected: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.textWhite,
  },
});

export default CalendarStrip;
