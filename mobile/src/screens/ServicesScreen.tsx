import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useServices } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { Service } from '../types/api';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../utils/colors';
import { formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const { data: services, isLoading: servicesLoading, error: servicesError, refetch: refetchServices } = useServices();
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();

  // カテゴリでフィルタリング
  const filteredServices = selectedCategoryId
    ? services?.filter(service => service.categoryId === selectedCategoryId)
    : services;

  const handleServicePress = (serviceId: string) => {
    navigation.navigate('ServiceDetail', { serviceId });
  };

  const handleAddService = () => {
    navigation.navigate('ServiceForm', { categoryId: selectedCategoryId || undefined });
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleServicePress(item.id)}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: item.category?.color || '#6b7280' }
        ]}>
          <Text style={styles.categoryText}>{item.category?.name}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.serviceFooter}>
        <Text style={styles.memoCount}>
          メモ: {item.memos?.length || 0}件
        </Text>
        <Text style={styles.updatedAt}>
          更新: {formatDate(item.updatedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: null, name: 'すべて' }, ...(categories || [])]}
        keyExtractor={(item) => item.id || 'all'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategoryId === item.id && styles.filterButtonActive
            ]}
            onPress={() => setSelectedCategoryId(item.id)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategoryId === item.id && styles.filterButtonTextActive
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const handleRetry = () => {
    refetchServices();
    refetchCategories();
  };

  if (servicesLoading || categoriesLoading) {
    return <LoadingSpinner />;
  }

  if (servicesError) {
    return (
      <ErrorMessage 
        message="サービスの読み込みに失敗しました"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <View style={styles.container}>
      {renderCategoryFilter()}
      
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="cloud-off"
            title="サービスがありません"
            description="AWSサービスを追加して学習を始めましょう"
            actionText="最初のサービスを追加"
            onAction={handleAddService}
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddService}>
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
  filterContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.text.inverse,
  },
  listContainer: {
    padding: 16,
  },
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoCount: {
    fontSize: 12,
    color: colors.text.tertiary,
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

export default ServicesScreen;