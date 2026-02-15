import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButton);
    }
    
    if (size === 'large') {
      baseStyle.push(styles.largeButton);
    } else if (size === 'small') {
      baseStyle.push(styles.smallButton);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (variant === 'outline') {
      baseStyle.push(styles.outlineButtonText);
    }
    
    if (size === 'large') {
      baseStyle.push(styles.largeButtonText);
    } else if (size === 'small') {
      baseStyle.push(styles.smallButtonText);
    }
    
    return baseStyle;
  };
  
  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={Boolean(disabled || loading)}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primaryGreen : colors.cardWhite} />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  primaryButton: {
    backgroundColor: colors.primaryGreen,
  },
  secondaryButton: {
    backgroundColor: colors.accentGreen,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primaryGreen,
  },
  largeButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  smallButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  disabledButton: {
    backgroundColor: colors.borderLight,
    opacity: 0.6,
  },
  buttonText: {
    color: colors.cardWhite,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  outlineButtonText: {
    color: colors.primaryGreen,
  },
  largeButtonText: {
    fontSize: typography.lg,
  },
  smallButtonText: {
    fontSize: typography.sm,
  },
});

export default Button;
