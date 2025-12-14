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
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useCategory, useCreateCategory, useUpdateCategory } from '../hooks/useCategories';
import { RootStackParamList } from '../navigation/types';
import { colors, defaultCategoryColors } from '../utils/colors';
import LoadingSpinner from '../components/LoadingSpinner';

type CategoryFormRouteProp = RouteProp<RootStackParamList, 'CategoryForm'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const CategoryFormScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CategoryFormRouteProp>();
  const { categoryId } = route.params || {};

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultCategoryColors[0]);

  const { data: category, isLoading: categoryLoading } = useCategory(categoryId || '');
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  const isEditing = !!categoryId;
  const isSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setSelectedColor(category.color || defaultCategoryColors[0]);
    }
  }, [category]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', 'カテゴリ名を入力してください');
      return;
    }

    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
      };

      if (isEditing) {
        await updateCategoryMutation.mutateAsync({ id: categoryId!, data });
      } else {
        await createCategoryMutation.mutateAsync(data);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('エラー', 'カテゴリの保存に失敗しました');
    }
  };

  const renderColorSelector = () => (
    <View style={styles.section}>
      <Text style={styles.label}>カラー</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.colorList}>
          {defaultCategoryColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Icon name="check" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (categoryLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>カテゴリ名 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例: コンピューティング"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>説明</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="カテゴリの説明を入力してください"
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {renderColorSelector()}

        <View style={styles.previewSection}>
          <Text style={styles.label}>プレビュー</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewColor, { backgroundColor: selectedColor }]} />
              <Text style={styles.previewName}>{name || 'カテゴリ名'}</Text>
            </View>
            {description && (
              <Text style={styles.previewDescription}>{description}</Text>
            )}
          </View>
        </View>
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
    height: 80,
    paddingTop: 12,
  },
  colorList: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.gray[300],
  },
  previewSection: {
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  previewDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
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

export default CategoryFormScreen;