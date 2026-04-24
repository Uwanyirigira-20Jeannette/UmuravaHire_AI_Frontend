'use client';

import { Provider } from 'react-redux';
import { SessionProvider } from 'next-auth/react';
import { store } from '@/store';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    </SessionProvider>
  );
}
