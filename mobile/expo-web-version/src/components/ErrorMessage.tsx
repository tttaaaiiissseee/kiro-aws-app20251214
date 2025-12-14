import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors } from '../utils/colors';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message = 'エラーが発生しました',
  onRetry,
  retryText = '再試行',
}) => {
  return (
    <View style={styles.container}>
      <Icon name="error" size={48} color={colors.error} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ErrorMessage;