import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../utils/colors';
import { authAPI, userAPI } from '../services/api';
import { saveAuthToken, saveUserEmail, saveUserData, saveProfileData, clearStorage } from '../utils/storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Login button pressed', { email, password });
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      console.log('Login success:', response);
      
      // CRITICAL: Clear any old data from previous sessions
      await clearStorage();
      
      await saveAuthToken(response.access_token);
      
      // Fetch and save user details
      try {
        const user = await userAPI.getCurrentUser();
        // Save general user data
        await saveUserData({ 
          name: user.full_name || email.split('@')[0], 
          email: user.email,
          age: user.age
        });
        
        // Save profile-specific data (age, gender, lifestyle, etc.)
        await saveProfileData({
          age: user.age || 0,
          gender: user.gender || 'female',
          lifestyle: user.lifestyle || 'Moderately Active',
          fitness_level: user.fitness_level || 'Beginner',
          goal: user.goal || 'Healthy Living'
        });
        
        await saveUserEmail(email);
      } catch (userError) {
        console.error('Error fetching user details:', userError);
        await saveUserEmail(email);
      }

      navigation.replace('MainApp');
    } catch (error) {
      console.error('Login error full object:', error);
      console.error('Login error config:', error.config);
      console.error('Login error request:', error.request);
      console.error('Login error response:', error.response);
      
      Alert.alert(
        'Login Failed',
        error.response?.data?.detail || error.message || 'Connection failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.backgroundCream} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={22} color={colors.primaryGreen} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputLine} />

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={22} color={colors.primaryGreen} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputLine} />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundCream,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 150,
    height: 150,
  },
  form: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.lg,
    color: colors.textDark,
    paddingVertical: 4,
  },
  inputLine: {
    height: 1,
    backgroundColor: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  loginButton: {
    backgroundColor: colors.buttonGreen,
    paddingVertical: 18,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.textWhite,
    fontSize: typography.xl,
    fontWeight: typography.bold,
  },
  forgotContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  forgotText: {
    color: colors.primaryGreen,
    fontSize: typography.md,
    fontWeight: typography.medium,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  registerText: {
    color: colors.textDark,
    fontSize: typography.md,
  },
  registerLink: {
    color: colors.primaryGreen,
    fontSize: typography.md,
    fontWeight: typography.bold,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
