import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useCategories } from '../hooks/useCategories';
import { Category } from '../types/api';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../utils/colors';
import { formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data: categories, isLoading, error, refetch } = useCategories();

  const handleCategoryPress = (categoryId: string) => {
    // カテゴリ編集画面に遷移
    navigation.navigate('CategoryForm', { categoryId });
  };

  const handleAddCategory = () => {
    navigation.navigate('CategoryForm', {});
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.id)}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <View style={[
            styles.colorIndicator,
            { backgroundColor: item.color || '#6b7280' }
          ]} />
          <Text style={styles.categoryName}>{item.name}</Text>
        </View>
        <Text style={styles.serviceCount}>
          {item._count?.services || 0}件
        </Text>
      </View>
      {item.description && (
        <Text style={styles.categoryDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <Text style={styles.updatedAt}>
        更新: {formatDate(item.updatedAt)}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message="カテゴリの読み込みに失敗しました"
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="category"
            title="カテゴリがありません"
            description="カテゴリを作成してサービスを整理しましょう"
            actionText="最初のカテゴリを追加"
            onAction={handleAddCategory}
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddCategory}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: 16,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  serviceCount: {
    fontSize: 14,
    color: colors.text.secondary,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  updatedAt: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default CategoriesScreen;