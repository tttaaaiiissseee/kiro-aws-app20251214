import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, MainTabParamList } from './types';

// Screens
import ServicesScreen from '../screens/ServicesScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import RelationsScreen from '../screens/RelationsScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import SearchScreen from '../screens/SearchScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import ServiceFormScreen from '../screens/ServiceFormScreen';
import CategoryFormScreen from '../screens/CategoryFormScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// メインタブナビゲーター
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Services':
              iconName = 'cloud';
              break;
            case 'Categories':
              iconName = 'category';
              break;
            case 'Relations':
              iconName = 'account-tree';
              break;
            case 'Comparison':
              iconName = 'compare';
              break;
            case 'Search':
              iconName = 'search';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Services" 
        component={ServicesScreen}
        options={{ title: 'サービス' }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{ title: 'カテゴリ' }}
      />
      <Tab.Screen 
        name="Relations" 
        component={RelationsScreen}
        options={{ title: '関係性' }}
      />
      <Tab.Screen 
        name="Comparison" 
        component={ComparisonScreen}
        options={{ title: '比較' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ title: '検索' }}
      />
    </Tab.Navigator>
  );
}

// ルートナビゲーター
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator}
          options={{ 
            title: 'AWS学習アプリ',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="ServiceDetail" 
          component={ServiceDetailScreen}
          options={{ title: 'サービス詳細' }}
        />
        <Stack.Screen 
          name="ServiceForm" 
          component={ServiceFormScreen}
          options={({ route }) => ({
            title: route.params?.serviceId ? 'サービス編集' : 'サービス作成'
          })}
        />
        <Stack.Screen 
          name="CategoryForm" 
          component={CategoryFormScreen}
          options={({ route }) => ({
            title: route.params?.categoryId ? 'カテゴリ編集' : 'カテゴリ作成'
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}