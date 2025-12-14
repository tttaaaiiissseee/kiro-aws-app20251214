import { QueryClientProvider } from 'react-query';
import AppRouter from './router';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppRouter />
        {/* React Query DevTools - disabled for now due to import issues */}
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;