import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Platform, 
  Animated, 
  Dimensions 
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import BodyAnalysisScreen from '../screens/BodyAnalysisScreen';
import MealPlansScreen from '../screens/MealPlansScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FoodScanScreen from '../screens/FoodScanScreen';

const Tab = createBottomTabNavigator();

const colors = {
  primaryGreen:  '#1B5E20',
  backgroundCream:'#FFFDE7',
  textSecondary: '#7B6F72',
  textWhite:     '#FFFFFF',
  borderLight:   '#E0E0E0',
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Storage for tab layout metrics
  const [layouts, setLayouts] = useState({});
  
  // Animated values for the sliding pill
  const contentScale = useRef(new Animated.Value(1)).current;
  const pillScaleY = useRef(new Animated.Value(1)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;
  const pillTranslateX = useRef(new Animated.Value(0)).current;

  // Track layout for each tab item
  const onTabLayout = (name, event) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts(prev => ({
      ...prev,
      [name]: { x, width }
    }));
  };

  // Animate the pill when the active index changes
  useEffect(() => {
    const activeRouteName = state.routes[state.index].name;
    const layout = layouts[activeRouteName];

    if (layout) {
      // Content pop effect
      contentScale.setValue(0.85);

      Animated.parallel([
        Animated.spring(pillTranslateX, {
          toValue: layout.x + 4,
          useNativeDriver: false,
          friction: 12, // Higher friction = less bounce, calmer
          tension: 25,  // Lower tension = slower, smoother
        }),
        Animated.spring(pillWidth, {
          toValue: layout.width - 8,
          useNativeDriver: false,
          friction: 12,
          tension: 25,
        }),
        // Bottleneck "Squash" animation - now much more subtle
        Animated.sequence([
          Animated.timing(pillScaleY, {
            toValue: 0.92, // Very subtle squash
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.spring(pillScaleY, {
            toValue: 1,
            friction: 10,
            useNativeDriver: false,
          })
        ]),
        // Content Scale Spring - softened
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 10,
          tension: 30,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [state.index, layouts]);

  return (
    <View style={[
      styles.tabBar,
      { 
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        height: 60 + (insets.bottom > 0 ? insets.bottom : 12),
      }
    ]}>
      {/* Animated Sliding Pill Background */}
      <Animated.View 
        style={[
          styles.slidingPill,
          {
            transform: [
              { translateX: pillTranslateX },
              { scaleY: pillScaleY }
            ],
            width: pillWidth,
          }
        ]} 
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        switch (route.name) {
          case 'Home': iconName = 'home'; break;
          case 'MealPlans': iconName = 'restaurant'; break;
          case 'FoodScan': iconName = 'camera'; break;
          case 'BodyAnalysis': iconName = 'body'; break;
          case 'Chat': iconName = 'chatbubbles'; break;
          case 'Profile': iconName = 'person'; break;
          default: iconName = 'ellipse';
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            onLayout={(event) => onTabLayout(route.name, event)}
            style={[
              styles.tabItem,
              isFocused ? { flex: 2 } : { flex: 1 }
            ]}
            activeOpacity={0.8}
          >
            <Animated.View style={[
              styles.contentContainer,
              isFocused && styles.contentContainerFocused,
              isFocused && { transform: [{ scale: contentScale }] }
            ]}>
              <Ionicons 
                name={isFocused ? iconName : `${iconName}-outline`} 
                size={isFocused ? 24 : 22} 
                color={isFocused ? colors.textWhite : colors.primaryGreen} 
              />
              {isFocused && (
                <Text numberOfLines={1} style={styles.pillLabel}>{label}</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="MealPlans" component={MealPlansScreen} options={{ tabBarLabel: 'Meals' }} />
      <Tab.Screen name="FoodScan" component={FoodScanScreen} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="BodyAnalysis" component={BodyAnalysisScreen} options={{ tabBarLabel: 'Body' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'Chat' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCream,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: '100%',
    width: '100%',
    zIndex: 1,
  },
  contentContainerFocused: {
    flexDirection: 'column',
    gap: 0,
  },
  slidingPill: {
    position: 'absolute',
    top: 5, // (60 - 50) / 2
    height: 50,
    backgroundColor: colors.primaryGreen,
    borderRadius: 14,
    zIndex: 0,
  },
  pillLabel: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 0,
  },
});

export default BottomTabNavigator;
