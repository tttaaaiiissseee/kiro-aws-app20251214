import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import { useService, useCreateService, useUpdateService } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../utils/colors';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type ServiceFormRouteProp = RouteProp<RootStackParamList, 'ServiceForm'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const ServiceFormScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ServiceFormRouteProp>();
  const { serviceId, categoryId } = route.params || {};

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || '');

  const { data: service, isLoading: serviceLoading } = useService(serviceId || '');
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();

  const isEditing = !!serviceId;
  const isLoading = serviceLoading || categoriesLoading;
  const isSaving = createServiceMutation.isPending || updateServiceMutation.isPending;

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description || '');
      setSelectedCategoryId(service.categoryId);
    }
  }, [service]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', 'サービス名を入力してください');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('エラー', 'カテゴリを選択してください');
      return;
    }

    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: selectedCategoryId,
      };

      if (isEditing) {
        await updateServiceMutation.mutateAsync({ id: serviceId!, data });
      } else {
        await createServiceMutation.mutateAsync(data);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('エラー', 'サービスの保存に失敗しました');
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.label}>カテゴリ *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryList}>
          {categories?.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryOption,
                selectedCategoryId === category.id && styles.categoryOptionSelected,
              ]}
              onPress={() => setSelectedCategoryId(category.id)}
            >
              <View
                style={[
                  styles.categoryColor,
                  { backgroundColor: category.color || '#6b7280' },
                ]}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  selectedCategoryId === category.id && styles.categoryOptionTextSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>サービス名 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例: Amazon EC2"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>説明</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="サービスの説明を入力してください"
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {renderCategorySelector()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <LoadingSpinner size="small" color={colors.text.inverse} />
          ) : (
            <>
              <Icon name="save" size={20} color={colors.text.inverse} />
              <Text style={styles.saveButtonText}>
                {isEditing ? '更新' : '作成'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  categoryList: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  categoryOptionTextSelected: {
    color: colors.primary[600],
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
  },
  saveButton: {
    backgroundColor: colors.primary[600],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.inverse,
    marginLeft: 8,
  },
});

export default ServiceFormScreen;