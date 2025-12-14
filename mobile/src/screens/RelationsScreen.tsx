import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RelationsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Icon name="account-tree" size={64} color="#9ca3af" />
      <Text style={styles.title}>関係性マップ</Text>
      <Text style={styles.description}>
        AWSサービス間の関係性を視覚化する機能です。
        {'\n'}今後のアップデートで実装予定です。
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default RelationsScreen;