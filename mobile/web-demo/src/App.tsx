import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Tab,
  Tabs,
  Fab,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Category as CategoryIcon,
  AccountTree as RelationsIcon,
  Compare as CompareIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';

// API設定
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
});

// 型定義
interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  _count?: { services: number };
}

interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  updatedAt: string;
}

// React Query クライアント
const queryClient = new QueryClient();

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// サービス一覧コンポーネント
function ServicesTab() {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await apiClient.get('/services');
      return response.data.data || response.data;
    },
  });

  if (isLoading) return <Typography>読み込み中...</Typography>;
  if (error) return <Typography color="error">エラーが発生しました</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        AWSサービス一覧
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
        {services?.map((service: Service) => (
          <Card key={service.id}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography variant="h6" component="h2">
                  {service.name}
                </Typography>
                <Chip
                  label={service.category?.name}
                  size="small"
                  style={{
                    backgroundColor: service.category?.color || '#6b7280',
                    color: 'white',
                  }}
                />
              </Box>
              {service.description && (
                <Typography variant="body2" color="text.secondary">
                  {service.description}
                </Typography>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                更新: {new Date(service.updatedAt).toLocaleDateString('ja-JP')}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">詳細</Button>
              <Button size="small">編集</Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

// カテゴリ一覧コンポーネント
function CategoriesTab() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/categories');
      return response.data.data || response.data;
    },
  });

  if (isLoading) return <Typography>読み込み中...</Typography>;
  if (error) return <Typography color="error">エラーが発生しました</Typography>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        カテゴリ一覧
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
        {categories?.map((category: Category) => (
          <Card key={category.id}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: category.color || '#6b7280',
                    mr: 1,
                  }}
                />
                <Typography variant="h6" component="h2">
                  {category.name}
                </Typography>
                <Chip
                  label={`${category._count?.services || 0}件`}
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              {category.description && (
                <Typography variant="body2" color="text.secondary">
                  {category.description}
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button size="small">編集</Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

// プレースホルダーコンポーネント
function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <Box textAlign="center" py={8}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
}

// メインアプリコンポーネント
function MainApp() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AWS学習アプリ - Mobile Web
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
          <Tab icon={<CloudIcon />} label="サービス" />
          <Tab icon={<CategoryIcon />} label="カテゴリ" />
          <Tab icon={<RelationsIcon />} label="関係性" />
          <Tab icon={<CompareIcon />} label="比較" />
          <Tab icon={<SearchIcon />} label="検索" />
        </Tabs>
      </Box>

      <Container maxWidth="lg">
        <TabPanel value={tabValue} index={0}>
          <ServicesTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <CategoriesTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <PlaceholderTab
            title="関係性マップ"
            description="AWSサービス間の関係性を視覚化する機能です。今後のアップデートで実装予定です。"
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <PlaceholderTab
            title="サービス比較"
            description="複数のAWSサービスを比較する機能です。今後のアップデートで実装予定です。"
          />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <PlaceholderTab
            title="検索"
            description="サービスやメモを検索する機能です。今後のアップデートで実装予定です。"
          />
        </TabPanel>
      </Container>
    </Box>
  );
}

// ルートアプリコンポーネント
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

export default App;