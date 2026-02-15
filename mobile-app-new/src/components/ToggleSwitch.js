import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../utils/colors';

const ToggleSwitch = ({ options, selectedOption, onSelect, style }) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.option,
            selectedOption === option.value && styles.selectedOption,
            index === 0 && styles.firstOption,
            index === options.length - 1 && styles.lastOption,
          ]}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.optionText,
              selectedOption === option.value && styles.selectedOptionText,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.pill,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
  },
  selectedOption: {
    backgroundColor: colors.primaryGreen,
  },
  firstOption: {
    marginRight: 2,
  },
  lastOption: {
    marginLeft: 2,
  },
  optionText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  selectedOptionText: {
    color: colors.cardWhite,
  },
});

export default ToggleSwitch;
