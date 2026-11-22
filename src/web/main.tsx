import '@fontsource-variable/roboto';
import '@shared/styles/base.css';
import './web.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ApiError } from '@shared/api/client';
import { ToastProvider } from '@shared/ui/Toast';

import { App } from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      // Don't retry client errors (404, 401, 403...); retry network/server errors once.
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
