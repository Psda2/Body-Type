import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/colors';
import { chatAPI } from '../services/api';

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: '👋 Hello! I\'m your LankaFit AI health assistant. I can provide personalized advice about nutrition and fitness. How can I help you today?',
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const flatListRef = useRef(null);
  
  // Tab bar height buffer
  const tabBarHeight = Platform.OS === 'ios' ? 95 : 75;
  
  const loadHistory = async () => {
    try {
      const response = await chatAPI.getHistory();
      if (response && response.history && response.history.length > 0) {
        const formatted = response.history.map((msg, idx) => ({
          id: msg._id || `history_${idx}`,
          text: msg.text,
          isUser: msg.is_user,
        }));
        setMessages(formatted);
      }
    } catch (error) {
      console.error('History load error:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(inputText);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.response || response.message || response.answer || JSON.stringify(response),
        isUser: false,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: '❌ Sorry, I couldn\'t process your message. Please try again.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderBubble = ({ item }) => (
    <View style={[styles.bubbleRow, item.isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubbleWrapper, item.isUser ? styles.userWrapper : styles.aiWrapper]}>
        <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.bubbleText, item.isUser && styles.userBubbleText]}>
            {item.text}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header - Standard App Style */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Personalized nutrition & fitness advice</Text>
        </View>

        {/* Messages */}
        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primaryGreen} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderBubble}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {loading && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>typing...</Text>
          </View>
        )}

        {/* Input - Standard App Style with iMessage Elements */}
        <View style={[styles.inputArea, { marginBottom: tabBarHeight }]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message..."
              placeholderTextColor={colors.textLight}
              multiline={true}
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <Ionicons name="arrow-up" size={20} color={colors.textWhite} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.lg,
    backgroundColor: 'transparent',
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
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    position: 'relative',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  aiWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 2,
  },
  aiBubble: {
    backgroundColor: colors.backgroundGreenLight,
  },
  userBubble: {
    backgroundColor: colors.primaryGreen,
  },
  bubbleText: {
    fontSize: 17,
    color: '#000000',
    lineHeight: 22,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  typingIndicator: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  typingText: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  inputArea: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#C6C6C8',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
