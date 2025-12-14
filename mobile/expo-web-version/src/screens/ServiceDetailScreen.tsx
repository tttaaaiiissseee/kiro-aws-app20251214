import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import { useService } from '../hooks/useServices';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../utils/colors';
import { formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type ServiceDetailRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

const ServiceDetailScreen: React.FC = () => {
  const route = useRoute<ServiceDetailRouteProp>();
  const { serviceId } = route.params;
  
  const { data: service, isLoading, error, refetch } = useService(serviceId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !service) {
    return (
      <ErrorMessage 
        message="サービスの読み込みに失敗しました"
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: service.category?.color || '#6b7280' }
        ]}>
          <Text style={styles.categoryText}>{service.category?.name}</Text>
        </View>
      </View>
      
      {service.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>説明</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>メモ</Text>
        <Text style={styles.placeholder}>
          メモ機能は今後のアップデートで実装予定です
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          作成日: {formatDate(service.createdAt)}
        </Text>
        <Text style={styles.footerText}>
          更新日: {formatDate(service.updatedAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  placeholder: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
});

export default ServiceDetailScreen;