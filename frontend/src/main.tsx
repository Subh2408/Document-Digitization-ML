// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional: for dev tools

import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from "./contexts/ThemeContext.tsx";

import './index.css';

const queryClient = new QueryClient(); // Create a client

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}> {/* Wrap with QueryClientProvider */}
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} /> {/* Optional Devtools */}
    </QueryClientProvider>
  </React.StrictMode>,
);