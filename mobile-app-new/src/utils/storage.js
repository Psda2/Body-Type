import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_EMAIL: '@user_email',
  USER_DATA: '@user_data',
  PROFILE_DATA: '@profile_data',
  ONBOARDING_COMPLETED: '@onboarding_completed',
};

// Save auth token
export const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

// Get auth token
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Remove auth token
export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Save user email
export const saveUserEmail = async (email) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_EMAIL, email);
  } catch (error) {
    console.error('Error saving user email:', error);
  }
};

// Get user email
export const getUserEmail = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.USER_EMAIL);
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

// Save user data (merges with existing)
export const saveUserData = async (userData) => {
  try {
    const existingData = await getUserData();
    const newData = { ...existingData, ...userData };
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(newData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

// Get user data
export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Save profile data (merges with existing)
export const saveProfileData = async (profileData) => {
  try {
    const existingData = await getProfileData();
    const newData = { ...existingData, ...profileData };
    await AsyncStorage.setItem(KEYS.PROFILE_DATA, JSON.stringify(newData));
  } catch (error) {
    console.error('Error saving profile data:', error);
  }
};

// Get profile data
export const getProfileData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFILE_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting profile data:', error);
    return null;
  }
};

// Save onboarding status
export const saveOnboardingStatus = async (completed) => {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
};

// Get onboarding status
export const getOnboardingStatus = async () => {
  try {
    const status = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETED);
    return status ? JSON.parse(status) : false;
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return false;
  }
};

// Save daily tips
export const saveDailyTips = async (tips) => {
  try {
    const data = {
      date: new Date().toDateString(),
      tips: tips,
    };
    await AsyncStorage.setItem('daily_tips', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving daily tips:', error);
  }
};

// Get daily tips
export const getDailyTips = async () => {
  try {
    const data = await AsyncStorage.getItem('daily_tips');
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    // Check if tips are from today
    if (parsedData.date === new Date().toDateString()) {
      return parsedData.tips;
    }
    return null;
  } catch (error) {
    console.error('Error getting daily tips:', error);
    return null;
  }
};

// Clear all storage
export const clearStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.AUTH_TOKEN,
      KEYS.USER_EMAIL,
      KEYS.USER_DATA,
      KEYS.PROFILE_DATA,
      'daily_tips',
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
