import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../utils/colors';

const ChatBubble = ({ message, isUser }) => {
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 6,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 2,
  },
  aiBubble: {
    backgroundColor: colors.backgroundGreenLight,
  },
  userBubble: {
    backgroundColor: colors.primaryGreen,
  },
  text: {
    fontSize: 17,
    lineHeight: 22,
  },
  userText: {
    color: colors.textWhite,
  },
  aiText: {
    color: colors.textPrimary,
  },
});

export default ChatBubble;
